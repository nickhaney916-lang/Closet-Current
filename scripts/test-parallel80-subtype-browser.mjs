/** Actual app Adjust + actual P80 modules, synthetic model callback ONLY. */
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { resolve, extname } from "node:path";
import assert from "node:assert/strict";
import { chromium, webkit } from "playwright";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url),
  root = resolve("public"),
  app = await readFile("public/app.js", "utf8");
function between(a, b) {
  const i = app.indexOf(a),
    j = app.indexOf(b, i + a.length);
  if (i < 0 || j < i) throw Error("Actual app source boundary missing");
  return app.slice(i, j);
}
const source =
  between("function node(", "function cropClothingPhoto(") +
  between("function unit70Receipts(", "function renderRecognitionNotice(");
const server = createServer(async (req, res) => {
  try {
    const path = new URL(req.url, "http://localhost").pathname;
    if (path === "/") {
      res.setHeader("Content-Type", "text/html");
      return res.end(
        '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Synthetic subtype review</title><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/app-theme.css"></head><body><main><h1>Synthetic subtype review</h1></main></body></html>',
      );
    }
    const file = resolve(root, "." + decodeURIComponent(path));
    if (!file.startsWith(root + "/")) throw Error("Path");
    res.setHeader(
      "Content-Type",
      extname(file) === ".json"
        ? "application/json"
        : extname(file) === ".css"
          ? "text/css"
          : "text/javascript",
    );
    let content = await readFile(file);
    if (extname(file) === ".css")
      content = content.toString().replace(/@import url\([^;]+;/g, "");
    res.end(content);
  } catch {
    res.statusCode = 404;
    res.end("Missing");
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const url = "http://127.0.0.1:" + server.address().port,
  rows = [];
const harness = `
const categories=['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'];
let items=[],batch=[],stream=null,cameraOpening=false,localReady=true;const localPending=new Set(),sessionCapturedIds=new Set();
window.closetAuth={user:{id:'SYNTHETIC-owner-80'}};window.savedCount=0;window.savedValue=null;window.lastMessage='';window.hold80=false;window.requested80=0;
const checkPhoto=async()=>({colorEstimate:null});const enableLocal=async()=>true;
const removeItem=async()=>{};const persistDraft=async()=>{};const render=()=>{};const scheduleMemoryReview=()=>{};const stopCamera=()=>{};const queueAutomatic=()=>{};const message=s=>window.lastMessage=s;
const savePiece=async(value,nextBatch)=>{window.savedCount++;await new Promise(r=>setTimeout(r,40));window.savedValue=value;};
async function localRequest(type,image,_,hint,context){if(type!=='subtype-candidates80')throw Error('Only synthetic subtype callback allowed');window.requested80++;while(window.hold80)await new Promise(r=>setTimeout(r,10));const {subtypeModel80,sourceCodeHash80}=await import('/subtype-worker-80.mjs');const {localCandidates}=await import('/local-catalog.mjs');const meta=await(await fetch('/recognition-vectors.json')).json();const cat=window.current80.category,a=cat==='Shoes'?'Sneakers':'Shorts',b=cat==='Shoes'?'Ankle boots':'Skirt';const scores=localCandidates.map(c=>({label:c.label,score:c.category===cat&&c.itemType===a?.8:c.category===cat&&c.itemType===b?.1:.1/(localCandidates.length-2)}));return subtypeModel80({request:{image,subtype80:context},image:{},whole:async()=>scores,confirmation:async()=>scores,metadata:meta,sourceCodeSha256:await sourceCodeHash80()});}
async function fixture80({pair=false,saved=false,owner=true,flag=true}={}){for(const d of document.querySelectorAll('dialog')){d.close();d.remove();}history.replaceState(null,'','/?'+(flag?'subtype80=1':''));window.closetAuth.user=owner?{id:'SYNTHETIC-owner-80'}:null;const canvas=document.createElement('canvas');canvas.width=360;canvas.height=480;const ctx=canvas.getContext('2d');ctx.fillStyle='#ddd';ctx.fillRect(0,0,360,480);ctx.fillStyle='#18559c';ctx.fillRect(45,45,260,390);ctx.fillStyle='#a5b6c7';for(let i=0;i<8;i++)ctx.fillRect(55,60+i*42,240,8);const image=canvas.toDataURL('image/jpeg',.9),value={id:'SYNTHETIC-item-80',image,name:'Synthetic garment',category:pair?'Shoes':'Bottoms',itemType:'Unknown',color:'Blue',colorSource:'user',pattern:'Unknown',sleeveLength:'Not applicable',fit:'Unknown',seasons:[],requiresOwnershipConfirmation:!saved,userAdjusted:false};
 if(pair){const {hash80,jpeg80}=await import('/subtype-review-80.mjs');const sourceSha256=await hash80(jpeg80(image));value.originalPhoto={image};value.outfitSourceId='SYNTHETIC-scene';value.reconciliation70={ownerId:'SYNTHETIC-owner-80',sourceSha256,maskSha256:'a'.repeat(64)};value.reconciliation70Status='paired_confirmed';value.shoePair={confirmedByOwner:true,companion:{image,reconciliation70:{ownerId:'SYNTHETIC-owner-80',sourceSha256,maskSha256:'b'.repeat(64)}}};}
 batch=saved?[]:[value];items=saved?[value]:[];window.current80=value;window.savedCount=0;window.savedValue=null;window.requested80=0;window.hold80=false;adjustPhoto(value);}
`;
try {
  for (const engine of [chromium, webkit]) {
    const browser = await engine.launch({
      headless: true,
      args: engine === chromium ? ["--no-sandbox"] : [],
    });
    try {
      for (const width of [320, 390, 430]) {
        const page = await browser.newPage({
            viewport: { width, height: 900 },
          }),
          errors = [],
          requests = [];
        page.on("pageerror", (e) => errors.push(e.message));
        page.on("request", (r) => requests.push(r.url()));
        await page.goto(url + "/?subtype80=1");
        for (const s of [
          await readFile("public/taxonomy.js", "utf8"),
          await readFile("public/clothing-details.js", "utf8"),
          harness,
          source,
        ])
          await page.addScriptTag({ content: s });
        const panel = page.getByRole("group", {
            name: "Subtype hypotheses · optional research",
          }),
          check = page.getByRole("button", {
            name: "Compare subtype hypotheses",
          }),
          consent = page.getByRole("checkbox", {
            name: /I checked the broad category/,
          }),
          visible = page.getByRole("checkbox", {
            name: /I can isolate this one garment/,
          }),
          ack = page.getByRole("checkbox", {
            name: /I inspected the original and want/,
          }),
          save = page.getByRole("button", { name: "Save changes" }),
          ownerAck = page.getByRole("checkbox", {
            name: /I checked the clothing photo/,
          });
        await page.evaluate(() => fixture80());
        await panel.waitFor();
        await check.click();
        assert.equal(await page.evaluate(() => window.requested80), 0);
        assert.equal(await save.isDisabled(), true);
        await consent.check();
        await visible.check();
        await check.click();
        await page
          .getByRole("button", { name: "Choose Shorts", exact: true })
          .waitFor();
        assert.equal(
          await page.getByLabel("Item type").inputValue(),
          "Unknown",
        );
        assert.equal(await page.evaluate(() => window.savedCount), 0);
        await page
          .getByRole("button", { name: "Choose Shorts", exact: true })
          .click();
        assert.equal(
          await page.getByLabel("Item type").inputValue(),
          "Unknown",
        );
        await ack.check();
        await page
          .getByRole("button", { name: "Choose Shorts", exact: true })
          .click();
        assert.equal(await page.getByLabel("Item type").inputValue(), "Shorts");
        assert.equal(await ownerAck.isChecked(), false);
        assert.equal(await save.isDisabled(), true);
        await ownerAck.check();
        await page.locator("dialog form").evaluate((f) => {
          f.dispatchEvent(new Event("submit", { cancelable: true }));
          f.dispatchEvent(new Event("submit", { cancelable: true }));
        });
        await page.waitForFunction(() => window.savedValue !== null);
        assert.equal(await page.evaluate(() => window.savedCount), 1);
        assert.equal(
          await page.evaluate(() => window.savedValue.itemType),
          "Shorts",
        );
        assert.ok(
          await page.evaluate(
            () =>
              !Object.keys(window.savedValue).some((k) =>
                /subtype80|alternatives|modelReceipt/.test(k),
              ),
          ),
        );
        for (const attack of [
          "owner",
          "owner-id",
          "crop",
          "mask",
          "consent",
          "category",
        ]) {
          await page.evaluate(() => fixture80());
          await panel.waitFor();
          await consent.check();
          await visible.check();
          await page.evaluate(() => (window.hold80 = true));
          await check.click();
          await page.waitForFunction(() => window.requested80 === 1);
          if (attack === "owner")
            await page.evaluate(
              () => (window.closetAuth.user = { id: "OTHER" }),
            );
          if (attack === "owner-id")
            await page.evaluate(() => (window.closetAuth.user.id = "OTHER"));
          if (attack === "crop")
            await page.evaluate(
              () =>
                (window.current80.recognitionPhoto = {
                  image: window.current80.image + "AA",
                }),
            );
          if (attack === "mask")
            await page.evaluate(
              () =>
                (window.current80.segmentHint = {
                  categories: ["Bottoms"],
                  clipped: true,
                }),
            );
          if (attack === "consent") await consent.uncheck();
          if (attack === "category")
            await page.getByLabel("Main category").selectOption("Dresses");
          await page.evaluate(() => (window.hold80 = false));
          await page.waitForFunction(
            () => !document.querySelector("fieldset button")?.disabled,
          );
          assert.equal(
            await page
              .getByRole("button", { name: "Choose Shorts", exact: true })
              .count(),
            0,
          );
          assert.equal(await page.evaluate(() => window.savedCount), 0);
        }
        await page.evaluate(() => fixture80());
        await panel.waitFor();
        await consent.check();
        await visible.check();
        await check.click();
        await page
          .getByRole("button", { name: "Choose Shorts", exact: true })
          .waitFor();
        await ack.check();
        await page
          .getByRole("button", { name: "Choose Shorts", exact: true })
          .click();
        await ownerAck.check();
        await page.locator("dialog form").evaluate((form) => {
          form.dispatchEvent(new Event("submit", { cancelable: true }));
          window.closetAuth.user = { id: "OTHER" };
        });
        await page.waitForFunction(
          () => window.lastMessage === "Could not save changes. Try again.",
        );
        assert.equal(
          await page.evaluate(() => window.savedCount),
          0,
          "owner change across final async save boundary rejected",
        );
        await page.evaluate(() => fixture80({ pair: true }));
        await panel.waitFor();
        await consent.check();
        await visible.check();
        await check.click();
        await page
          .getByRole("button", { name: "Choose Sneakers", exact: true })
          .waitFor();
        await ack.check();
        await page
          .getByRole("button", { name: "Choose Sneakers", exact: true })
          .click();
        await ownerAck.check();
        await save.click();
        await page.waitForFunction(() => window.savedValue !== null);
        assert.equal(await page.evaluate(() => window.savedCount), 1);
        assert.equal(await page.evaluate(() => items.length), 1);
        assert.equal(
          await page.evaluate(
            () => window.savedValue.shoePair.confirmedByOwner,
          ),
          true,
        );
        assert.equal(
          await page.evaluate(() => window.savedValue.reconciliation70Status),
          "paired_confirmed",
        );
        assert.equal(
          await page.evaluate(
            () =>
              window.savedValue.originalPhoto.image === window.savedValue.image,
          ),
          true,
        );
        await page.evaluate(() => fixture80({ flag: false }));
        assert.equal(await panel.count(), 0);
        await page.evaluate(() => fixture80({ owner: false }));
        assert.equal(await panel.count(), 0);
        await page.evaluate(() => fixture80({ saved: true }));
        assert.equal(await panel.count(), 0);
        await page.evaluate(() => fixture80());
        await panel.waitFor();
        await consent.check();
        await visible.check();
        await check.click();
        await page
          .getByRole("button", { name: "Choose Shorts", exact: true })
          .waitFor();
        await page.evaluate(
          await readFile(require.resolve("axe-core/axe.min.js"), "utf8"),
        );
        const axe = await page.evaluate(
          async () =>
            await axe.run(document.querySelector("dialog"), {
              runOnly: {
                type: "tag",
                values: ["wcag2a", "wcag2aa", "wcag21aa"],
              },
            }),
        );
        assert.deepEqual(
          axe.violations.map((v) => v.id),
          [],
        );
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 2,
          ),
          "No page overflow",
        );
        assert.deepEqual(
          requests.filter(
            (r) =>
              !r.startsWith(url) &&
              !r.startsWith("data:") &&
              !r.startsWith("blob:"),
          ),
          [],
        );
        assert.deepEqual(errors, []);
        rows.push({
          engine: engine.name(),
          width,
          syntheticEditor: "PASS",
          staleAttacks: 6,
          oneConfirmedPairOneSave: true,
          axeViolations: 0,
          externalRequests: 0,
        });
        await page.close();
      }
    } finally {
      await browser.close();
    }
  }
} finally {
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
}
console.log(
  "P80_SYNTHETIC_DESKTOP_BROWSER " +
    JSON.stringify({
      rows,
      physicalDevices: 0,
      realModelInference: 0,
      humanLabels: 0,
      accuracy: "UNKNOWN",
    }),
);
