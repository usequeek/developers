# Queek for Developers

Build on Queek: use Queek as the backend for a custom storefront, sync catalogues
and orders over webhooks, and drive AI shopping experiences from the same public
API our own storefronts use.

- Docs: https://docs.usequeek.com
- API reference (OpenAPI): https://client.usequeek.com/openapi.json
- API status: https://status.usequeek.com
- Support: ask in
  [GitHub Discussions](https://github.com/usequeek/developers/discussions)

## Headless starter

[`examples/nextjs-headless/`](examples/nextjs-headless/) is a minimal Next.js
(App Router, TypeScript) storefront that talks to Queek **only** through the
public client API:

- Home with collections, product list, product page (renders `metafields` from
  the public schema), cart, and checkout handoff to Queek-hosted `checkout_url`.
- Server-side calls carry your secret key (`sk_…`); the browser never sees it.
- Catalogue/cart calls are typed from the live OpenAPI spec
  (`openapi-typescript`, generated inside the example — no extra package).

Five minutes from clone to a running store — see the
[example README](examples/nextjs-headless/README.md).

## Get a test store

1. Create a store in the Queek dashboard.
2. Go to **Settings → API** and create a secret key (`sk_test_…`).
3. Copy `.env.example` to `.env` in the example and paste the key.

Sandbox base URL: `https://client.usequeek.com/v1`. Auth is one header,
`X-Client-Key: <your key>`. The key identifies the store — no per-store host
configuration is needed; storefront and checkout URLs come back inside
`GET /store/info` as `storefront_url` / `checkout_url`.

Rate limits are published on every response (`x-ratelimit-limit`,
`x-ratelimit-remaining`); error codes are documented at
https://docs.usequeek.com/docs/versioning-and-errors.

## What is not here (yet)

- **Customer sign-in.** The public OpenAPI spec now has email OTP auth
  (`/auth/email/request-otp` → `/auth/email/verify-otp`, plus `/auth/register`
  and `/auth/token/refresh`), but email+password login, `/auth/me`,
  `/store/orders` and `/store/addresses` are not in it yet — so the starter
  ships guest checkout via anonymous cart sessions (`X-Cart-Session`,
  documented on the spec's cart endpoints). See "Signing customers in" in the
  [example README](examples/nextjs-headless/README.md).
- **Merchant API with scoped tokens** — next. **App platform** — later.

## License

MIT — see [LICENSE](LICENSE).
