# HerLife boutique: prioritised retailers and authorised data feeds (October 2026)

**Important:** No nine retailers have granted HerLife a usable catalogue credential in this project yet. Consequently the public API intentionally returns no manufactured products. HerLife is the visual host; purchases still complete at original merchants.

## Product permissions and routes researched

| Requested shop | Publicly verifiable route | What it gives us | Status for in-app real product catalogue |
|---|---|---|---|
| SHEIN | Official affiliate programme (ca.shein.com/affiliate-a-427.html), public developer portal open.sheincorp.com | Affiliate/referral links; seller-oriented OpenAPI | Ask affiliate representative for approved product feed and SA market coverage; **not yet connected** |
| Temu | Official affiliate programme (temu.com/affiliate_question.html), partner.temu.com | Affiliate links and partner/seller APIs | Ask partner for catalogue access permitted in SA; **not yet connected** |
| Superbalist | Official invite-only Influencer Shop, confirmed by retailer on LinkedIn | Influencer commerce programme, not public catalogue API | Negotiate authorised product feed; **not yet connected** |
| Bash | Bash storefront/TGF ecosystem | No publicly documented unrestricted product feed established | Contact Bash/TFG commercial partnerships; **not yet connected** |
| Cotton On | Third-party listing of Admitad affiliate CSV product feed (affiliate-toolkit.com/program/cotton-on/) | Potential product feed after network publisher approval | Prioritise feed application, verify that SA inventory/currency is included; **not yet connected** |
| H&M | No verified open South African consumer product catalogue API | Requires direct commercial approval or permitted partner feed | **Not yet connected** |
| Mr Price | MCANISM Mr Price Sport CPA programme exists, but explicitly lists 0 feeds | Affiliate links only in that listing | Request retailer/affiliate data permission; **not yet connected** |
| Zara | No verified official open South African catalogue feed | Direct commercial approval needed | **Not yet connected** |
| Takealot | Official Marketplace API (marketplace-api.takealot.com/v1/docs) | Seller offers, orders, shipments; not consumer catalogue feed | Cannot use seller key to mirror retailer products; **not yet connected** |

No association or approval is implied by naming these merchants. Do not rebrand their content deceptively: HerLife can own the UI while naming merchants as sources and respecting attribution/licensing/checkout terms.

## Implemented feed adapters

The Vercel `/api/products` function supports:
1. `HERLIFE_SHOPIFY_STORES`: JSON array of authorised merchants `[{ "id":"partner-1", "name":"Partner 1", "domain":"partner-1.myshopify.com", "siteDomain":"partner1.co.za", "tokenEnv":"HERLIFE_PARTNER1_STOREFRONT_TOKEN" }]`; `tokenEnv` is the **name of a separate Vercel env var** storing a merchant-supplied Storefront API token. Shopify tokenless access may also work if the merchant authorises it. URLs are limited to configured storefront/public merchant domains.
2. `HERLIFE_APPROVED_FEEDS`: JSON array `[{ "id":"cottonon", "name":"Cotton On", "url":"https://approved-feed-provider.example/catalog.json", "productHosts":["cottonon.com","cottonon.com.au"], "tokenEnv":"HERLIFE_COTTONON_FEED_TOKEN" }]`. Example domains and config do **not** mean a real feed exists. The hosted feed must be merchant-approved and normalize to `{ "products": [{ "id":"sku", "title":"...", "description":"...", "image":"https://...", "price":199, "currency":"ZAR", "url":"https://cottonon.com/...", "available":true }] }`. The bearer credential is optional and always read from a separate secret Vercel environment variable.

All remote feed URLs are **server-configured**, not user-provided. The server requires HTTPS, rejects redirects and validates checkout URLs against explicit merchant-domain allowlists. It caches results for ten minutes. Approval must include images and product data re-use rights. Avoid arbitrary third-party catalog scrapers and copyrighted image copying.

Do not publish partner API keys to public GitHub. After an approved feed is supplied, configure the Vercel variables, redeploy, check `/api/products`, and test HerLife Boutique product photos, prices, brand attribution and projected shopping bag calculations on a real device. Any items in a non-ZAR currency are not yet transferable to the ZAR bag without verified conversion and shipping.

## Verified official/related sources

- https://open.sheincorp.com/
- https://ca.shein.com/affiliate-a-427.html
- https://www.temu.com/affiliate_question.html
- https://partner.temu.com/documentation
- https://marketplace-api.takealot.com/v1/docs
- https://shopify.dev/docs/api/storefront/2026-10
- https://www.linkedin.com/posts/superbalist-com_superbalists-influencer-shop-grows-from-activity-7209139834760704000-sYX3
- https://www.affiliate-toolkit.com/program/cotton-on/
- https://campaigns.mcanism.com/5881
