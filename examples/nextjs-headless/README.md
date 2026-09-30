# Queek headless starter (Next.js)

A minimal storefront that uses Queek as its backend — home with collections,
product list, product page (renders public `metafields`), cart, and checkout
handoff to Queek-hosted `checkout_url`. App Router + TypeScript. No invented
endpoints: every call exists in https://client.usequeek.com/openapi.json.

## Five minutes from clone to a running store

```bash
cd examples/nextjs-headless
yarn install
cp .env.example .env
# paste your secret key: Developers → Dev stores (sk_test_… from your dev store)
yarn build
yarn start   # open http://localhost:3000
```

Want the sandbox immediately? Use the publishable test key from
`.env.example` (dev store only, safe to share) and run `yarn smoke`
to prove the wiring without opening a browser.

## What each route does

| Route | Source | Queek API calls |
|---|---|---|
| `/` | `app/page.tsx` | `GET /store/info`, `GET /store/collections`, `GET /store/products` |
| `/products` | `app/products/page.tsx` | `GET /store/products` (`keyword`, `sort`) or `GET /store/collections/{collection}/products` |
| `/products/[slug]` | `app/products/[slug]/page.tsx` | `GET /store/products/{slug}` (renders `metafields`) |
| `/cart` | `app/cart/page.tsx` | `GET /store/cart` + `POST /store/cart/validate`, checkout button → `checkout_url` |
| `POST /api/cart/items` | `app/api/cart/items/route.ts` | `POST /store/cart/items` (sets the `queek_cart_session` cookie) |
| `POST /api/cart/clear` | `app/api/cart/clear/route.ts` | `DELETE /store/cart/clear` |

All Queek calls live in `lib/queek.js` and run server-side with
`QUEEK_SECRET_KEY` (`sk_…`). The browser only talks to these Next routes —
it never sees the key. Anonymous shoppers are tracked with a
`queek_cart_session` cookie forwarded as the `X-Cart-Session` header.

Typed from the spec: `yarn types:pull` refreshes `openapi.json` and
regenerates `lib/schema.d.ts` (`openapi-typescript`) in one command
(`yarn spec:pull` / `yarn types:gen` run each half). Request bodies reuse the
generated `components["schemas"]` types. The generated entity resources
(`QueekStoreProduct`, `QueekStoreCart`, …) exist but still diverge from live
payloads on fields the starter uses, so entity shapes in `lib/queek.js` stay
pinned from live sandbox responses — the divergences are listed in the
comment there.

## Where to change the theme

You barely need to: `app/layout.tsx` reads the merchant brand kit
(`brand.colors`, `brand.font`) from `GET /store/info` and themes the whole
store from the dashboard. Override the inline `<style>` block there for
custom CSS, and swap the font in `fontFamily`.

## Signing customers in

Available, but not wired here yet. The public spec now has customer auth —
email OTP (`POST /auth/email/request-otp` → `POST /auth/email/verify-otp`,
plus `POST /auth/register` and `POST /auth/token/refresh`) — while
email+password login, `GET /auth/me`, `GET /store/orders` and
`GET /store/addresses` are not in the spec yet, so there is nothing to build
an account page on. The starter therefore ships guest checkout only, and this
section stays code-free until those paths land. Flow and token handling are
documented at https://docs.usequeek.com — when the missing paths arrive, add
sign-in in `lib/queek.js` + a `/api/session` route following the same
server-side pattern (customer token in an httpOnly cookie, never the
browser).

## Scripts

- `yarn types:pull` — refresh the spec snapshot AND regenerate typed schema
  (one command; `yarn spec:pull` / `yarn types:gen` run each half)
- `yarn lint` — `tsc --noEmit`
- `yarn build` — production build
- `yarn smoke` — live proof against the sandbox (product count, one product's
  title + metafields, cart add → validate → clear)
