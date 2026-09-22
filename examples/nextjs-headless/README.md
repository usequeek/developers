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
# paste your secret key: Dashboard → Settings → API (sk_test_… for sandbox)
yarn build
yarn start   # open http://localhost:3000
```

Want the sandbox immediately? Use the publishable test key from
`.env.example` (test store only, safe to share) and run `yarn smoke`
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

Typed from the spec: `yarn spec:pull` refreshes `openapi.json`, and
`yarn types:gen` regenerates `lib/schema.d.ts` (`openapi-typescript`).
Request bodies reuse the generated `components["schemas"]` types. Note the
spec's 200-response `data` schemas are loose, so entity shapes in
`lib/queek.js` are pinned from live sandbox responses (commented there).

## Where to change the theme

You barely need to: `app/layout.tsx` reads the merchant brand kit
(`brand.colors`, `brand.font`) from `GET /store/info` and themes the whole
store from the dashboard. Override the inline `<style>` block there for
custom CSS, and swap the font in `fontFamily`.

## Sign-in

Not wired: the public spec currently exposes `/store/*` catalogue/cart
resources only — no customer auth path — so the starter ships guest checkout.
(The SDK's OTP auth targets a different `/client/auth/*` path family needing
a real phone OTP flow.) When customer auth lands in the spec, add it in
`lib/queek.js` + a `/api/session` route following the same server-side
pattern.

## Scripts

- `yarn spec:pull` — refresh the spec snapshot
- `yarn types:gen` — regenerate typed schema
- `yarn lint` — `tsc --noEmit`
- `yarn build` — production build
- `yarn smoke` — live proof against the sandbox (product count, one product's
  title + metafields, cart add → validate → clear)
