# HerLife Boutique — real store product integrations

HerLife has a bespoke boutique interface with search, filters, real product detail pages, images and connection to the private shopping bag. Product information comes **only** from configured merchant-approved live Shopify Storefront API feeds; no fake products, scraped images, or invented prices are inserted.

## Connect a merchant

Obtain the merchant's approval to display their catalogue, images, product links and prices in HerLife. Find the actual `*.myshopify.com` store domain; not just a public brand website domain.

In the **HerLife Vercel project settings → Environment Variables**, add `HERLIFE_SHOPIFY_STORES` with JSON like:

```json
[
  {"id":"merchant-a","name":"Merchant A","domain":"merchant-a.myshopify.com"},
  {"id":"merchant-b","name":"Merchant B","domain":"merchant-b.myshopify.com"}
]
```

These are illustrative placeholders, **not** live configured stores. Redeploy after configuring. The endpoint `/api/products` will attempt **tokenless Shopify Storefront API** access. Some merchant storefronts may prohibit tokenless API access or require authentication, in which case the feed will remain empty pending merchant-approved API credentials. Never place Shopify admin or private Storefront tokens in frontend code or public GitHub.

HerLife always preserves the bespoke brand styling; store names appear only as merchant provenance on products and links. Catalogues reflect prices retrieved at request time with a short server cache. Product pages and shopping links remain with the merchant. The user's HerLife bag is a planning list, **not** a payment/order processing basket; ZAR values are compared to the finance spending budget only as projections, with no automatic debit. Non-ZAR products cannot be added to the ZAR bag until currency conversion and tax/delivery logic are implemented.

The server-side function allowlists merchant domains, rejects unknown caller-supplied URLs and only returns product URLs under the configured merchant's domain. Source: https://shopify.dev/docs/api/storefront/latest

Temu, Takealot, Bash, Superbalist and others require appropriate commercial data feeds or partner API agreements. Do not list those brands as connected until their feeds are actually operational.
