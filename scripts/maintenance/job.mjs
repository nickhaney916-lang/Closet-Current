import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { activeTrends, health, openStore, rollback, tick } from './store.mjs';

const [command, path, input] = process.argv.slice(2);
const commands = ['tick', 'status', 'rollback', 'serve'];
if (!path || !commands.includes(command) || (command === 'tick' && !input)) {
  console.error('Usage: node scripts/maintenance/job.mjs tick|status|rollback|serve DATABASE [FEED_POLICY or PORT]');
  process.exitCode = 2;
} else {
  let db;
  try {
    db = openStore(path);
    if (command === 'serve') {
      const port = Number(input ?? 8094);
      if (!Number.isInteger(port) || port < 0 || port > 65535) throw Error('Invalid port');
      const server = createServer((req, res) => {
        const options = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
        try {
          if (req.method !== 'GET' || req.url !== '/maintenance/trends') {
            res.writeHead(404, options).end('{}');
            return;
          }
          const current = activeTrends(db);
          res.writeHead(current ? 200 : 404, options).end(JSON.stringify(current ?? {}));
        } catch {
          res.writeHead(503, options).end('{}');
        }
      });
      server.once('error', () => {
        console.error('Maintenance service stopped');
        db.close();
        process.exitCode = 1;
      });
      server.listen(port, '127.0.0.1', () => console.log(JSON.stringify({ port: server.address().port })));
    } else {
      try {
        const result = command === 'tick' ? await tick(db, JSON.parse(await readFile(input, 'utf8'))) :
          command === 'rollback' ? await rollback(db) : health(db);
        console.log(JSON.stringify(result));
        if (result.status === 'degraded' || (result.result && !['activated', 'not-due', 'busy', 'rolled-back'].includes(result.result))) {
          process.exitCode = 1;
        }
      } finally {
        db.close();
      }
    }
  } catch {
    console.error('Maintenance command failed');
    process.exitCode = 1;
  }
}
