# Queek headless starter (Next.js)

A minimal storefront that uses Queek as its backend: a home page with collections,
a product list with search and sort, a product page that shows metafields, a
guest cart, and a handoff to Queek-hosted checkout. Next.js App Router and
TypeScript. Every call it makes is a path in the
[Storefront API spec](https://client.usequeek.com/openapi.json).

Your server holds the secret key. The browser only talks to this app's own
routes and never sees the key.

## Requirements

- Node.js 20.9 or later
- Yarn 1
- A Queek dev store and its `sk_test_` key (**Developers > Dev stores** in the
  dashboard). See [Dev stores](https://docs.usequeek.com/docs/sandbox).

## Run it

```bash
cd examples/nextjs-headless
yarn install
cp .env.example .env     # set QUEEK_SECRET_KEY to your dev store key
yarn build
yarn start               # http://localhost:3000
```

For development with reload, use `yarn dev`. With the key in `.env`, `yarn smoke`
checks the wiring against the API without a browser.

A new dev store starts empty. Add products in the dashboard, or use **Generate
test data** on the dev store, then reload.

## Environment

| Variable | Required | Meaning |
| --- | --- | --- |
| `QUEEK_SECRET_KEY` | yes | The dev store's secret key (`sk_test_...`). Server only. |
| `QUEEK_API_BASE` | no | Defaults to `https://client.usequeek.com/v1`. Test and live keys use the same base URL. |

To go live, set `QUEEK_SECRET_KEY` to the live store's `sk_live_` key. Nothing
else changes.

## What each route does

| Route | Source | Queek API calls |
| --- | --- | --- |
| `/` | `app/page.tsx` | `GET /store/info`, `GET /store/collections`, `GET /store/products` |
| `/products` | `app/products/page.tsx` | `GET /store/products` (`keyword`, `sort`) or `GET /store/collections/{collection}/products` |
| `/products/[slug]` | `app/products/[slug]/page.tsx` | `GET /store/products/{slug}` (shows `metafields`; an unknown slug renders a 404) |
| `/cart` | `app/cart/page.tsx` | `GET /store/cart`, `POST /store/cart/validate`; the checkout button goes to the cart's `checkout_url` |
| `POST /api/cart/items` | `app/api/cart/items/route.ts` | `POST /store/cart/items`; sets the `queek_cart_session` cookie |
| `POST /api/cart/clear` | `app/api/cart/clear/route.ts` | `DELETE /store/cart/clear` |

All Queek calls live in `lib/queek.js` and run on the server. Anonymous
shoppers are tracked with a `queek_cart_session` cookie, which the server
forwards as the `X-Cart-Session` header.

## Errors

The API answers failures with one envelope; the stable part is `error.code`.
This starter handles the cases a storefront meets first:

- An unknown product slug renders the 404 page.
- A rejected add-to-cart (for example an unknown product) returns the API's
  status and `error` code as JSON.
- Any other failure renders `app/error.tsx` and logs the details on the server.
  A missing or wrong `QUEEK_SECRET_KEY` shows up here first.

See [Versioning and errors](https://docs.usequeek.com/docs/versioning-and-errors)
for every code.

## Types

`yarn types:pull` downloads the current spec into `openapi.json` and regenerates
`lib/schema.d.ts` with `openapi-typescript`. `yarn spec:pull` and `yarn types:gen`
run each half. Request bodies reuse the generated `components["schemas"]` types.

The generated entity types can differ from what a dev store returns on fields
this starter reads, so the entity shapes in `lib/queek.js` are pinned to
observed responses. If you need a field that is missing, add it to the typedef.

## Theming

`app/layout.tsx` reads the merchant's brand kit (`brand.colors`, `brand.font`)
from `GET /store/info`, so colours and font follow the dashboard. Edit the
inline `<style>` block for your own CSS and set `fontFamily` to pin a typeface.

## Customer accounts

The Storefront API has customer sign-in: email and phone one-time codes, email
and password login, token refresh, `GET /auth/me`, saved addresses
(`/store/addresses`) and order history (`/store/orders`). This starter does not
use them. It ships guest checkout.

To add sign-in, follow the same server-side pattern as the cart: call the auth
endpoints from `lib/queek.js`, keep the customer token in an `httpOnly` cookie,
and send it as `Authorization: Bearer <token>` next to `X-Client-Key`. A cart
call that carries a customer token ignores `X-Cart-Session`. The endpoints are
in the [reference](https://docs.usequeek.com/docs/storefront).

## Variants

The product page lists variants but the add-to-cart button adds the base
product. A product that needs a choice answers `result: "customise"`, and the
page tells the shopper to pick an option. To add a specific variant, send its
`variant_id` to `POST /store/cart/items`.

## Scripts

| Script | What it does |
| --- | --- |
| `yarn dev` | Development server |
| `yarn build`, `yarn start` | Production build and server |
| `yarn lint` | Type check with `tsc --noEmit` |
| `yarn test` | Unit tests on a stubbed `fetch`. No network, no key. |
| `yarn smoke` | Runs the helpers against the API: store, products, collections, then cart add, validate and clear. Refuses anything but an `sk_test_` key. |
| `yarn types:pull` | Refresh the spec snapshot and regenerate types |
