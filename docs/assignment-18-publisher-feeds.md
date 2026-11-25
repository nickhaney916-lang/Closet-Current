# Assignment 18 — Offline publisher feed acceptance

Reviewed November 25, 2026. Maintenance donor: draft #1685 at
`e508c152fb9385f8014df16287964fc74006a877`. The adapter and browser fixture
mode are scoped to #1687. #1684 owns maintenance and scheduler behavior, #1686
owns backup preview, and #1054 owns combined integration. The browser continues
to read the same-origin verified catalog endpoint. There is no live registry or
change to scheduling, overnight jobs or the maintenance entry point.

## Source decision matrix

| Independent publisher and source | Automation, reuse and attribution evidence | Machine format, cadence and access limits | Decision |
| --- | --- | --- | --- |
| The Metropolitan Museum of Art, Costume Institute collection | The Met's [Open Access policy](https://www.metmuseum.org/hubs/open-access) dates the initiative to February 2017 and releases basic accessioned-work data under CC0. This permits transformation, retention and in-app reuse of that data. Record The Met and the object link for provenance. | REST JSON [collection API](https://metmuseum.github.io/) documents a cap of 80 requests/second. The [open-data repository](https://github.com/metmuseum/openaccess) also offers CSV. No documented fashion trend publication schedule. | Qualified as collection metadata only. Rejected as a current trend feed. Collection records and accession updates do not establish contemporary trend observations. |
| Europeana Foundation, fashion heritage metadata via Europeana's API | [Europeana terms](https://www.europeana.eu/en/rights/terms-of-use) release metadata under CC0 for transformation, retention and reuse. Follow [metadata usage guidelines](https://www.europeana.eu/en/rights/usage-guidelines-for-metadata) by crediting the provider, aggregators and Europeana. Media has separate rights. | [API FAQ](https://europeana.atlassian.net/wiki/spaces/EF/pages/2360508417/Europeana%2BAPI%2BFAQ) describes free read access and asks callers to space requests. Search/record access uses a key. No guaranteed contemporary fashion cadence. | Qualified as collection metadata only. Rejected as a current trend feed. No key requested and no API calls made. |
| Europeana Fashion consortium website | [Site terms](https://portal.fashionheritage.eu/portal/terms.html) describe CC BY-SA metadata and independently restrict robotic extraction and commercial exploitation without authorization. | Heritage site. No approved machine interface, access limits or current trend publication schedule established for this site. | Rejected for automated collection from this website. |
| Google Trends API | Google's [July 24, 2025 announcement](https://developers.google.com/search/blog/2025/07/trends-api) and [API documentation](https://developers.google.com/search/apis/trends) describe restricted alpha access. Exact permissions for retaining, transforming and displaying the planned derived signals in Closet Current have not been established. Attribution terms for such use need confirmation before approval. | Programmatic metrics with daily, weekly, monthly and yearly aggregation. Alpha approval required, quotas and binding product-specific terms unverified. Google search interest would require separate interpretation before presenting it as a fashion direction. | Legally unconfirmed and access-gated. No application for a key or access was made. |

| EDITED fashion retail intelligence | The [March 1, 2026 API agreement](https://edited.com/msa-api/) requires an order form and API key. Standard terms allow internal access, storage, derivatives and display during the agreement. A consumer-facing app displaying trend insights needs separate authorization for the proposed use. | API offered. Payload format, cadence, quotas and attribution require confirmation. | Rejected under standard terms. |
| Heuritech fashion forecasting | The [forecasting platform](https://heuritech.com/) publishes dated insights and advertises [demo access](https://heuritech.com/get-a-demo/). No public grant for automated access, transformation, retention and consumer-app display was established. | Feed format, cadence, quotas and attribution unconfirmed. Editorial publication dates do not establish a feed cadence. | Legally and technically unconfirmed. Requires a delivery specification and reuse license. |

**Live qualification gate: BLOCKED.** Zero of two required independent sources
meet the fashion-trend, permission and access criteria together. A future
candidate needs a documented automated interface with a dependable trend
cadence and verifiable authorization for automated retrieval, transformation,
retention and in-app publication, including applicable attribution and limits.
Owner approval follows source qualification. A feed's self-reported license
only checks conformance to configured policy.

## Offline conformance

The original synthetic exports model a publisher-approved JSON delivery
contract. No publisher samples are included. The adapter enforces the envelope
version, byte size, rights/credit and mapped taxonomy before the existing
maintenance validator checks provenance, dates, duplicates and compatibility.
The existing SQLite implementation owns candidate activation, retry, last-good
retention and rollback.

Run the focused test with `node --test tests/publisher-feed-1687.test.mjs`.
The dedicated no-deploy workflow runs the full Node suite and uses
`ASSIGNMENT_18_PUBLISHER=1` with the donor browser harness at 320, 390 and 430px.
The ordinary Stylist test exercises trend updates, browser offline retention,
rollback, and a before/after comparison of synthetic IndexedDB item rows and
saved outfit display. It does not establish physical-device behavior or
conformance to a live publisher API.
