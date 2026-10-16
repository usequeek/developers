# Queek for developers

Queek is a commerce platform. A business keeps one catalogue and runs orders,
stock, delivery and payment from one system, and developers build on the same
public APIs. This repository is the front door: it shows what you can build,
where each piece lives, and gives you a working storefront to start from.

- Docs: <https://docs.usequeek.com>
- Storefront API reference (OpenAPI): <https://client.usequeek.com/openapi.json>
- Merchant API reference (OpenAPI): <https://api.usequeek.com/docs/merchant.json>
- Docs as Markdown for AI agents: <https://docs.usequeek.com/llms.txt>
- API status: <https://status.usequeek.com>

## Pick what you are building

| I want to... | Use | Start here |
| --- | --- | --- |
| Build a custom or headless storefront | Storefront API | [Quickstart](#quickstart-read-a-store-in-two-minutes), then [`examples/nextjs-headless`](examples/nextjs-headless/) |
| Sync stock, orders and catalogue with my own systems | Merchant API | [Merchant API docs](https://docs.usequeek.com/docs/merchant) |
| React to orders, products and customers as they change | Webhooks | [Webhooks](#webhooks) |
| Ship an installable app inside the merchant dashboard | App SDK and `queek` CLI | [Build an app](https://docs.usequeek.com/docs/apps/build-an-app) |
| Design a storefront theme merchants can pick | Theme kit and `queek` CLI | [Build your first theme](https://docs.usequeek.com/docs/themes/quickstart) |
| Run a store from Claude or ChatGPT | Queek OS connector | [Queek OS](https://docs.usequeek.com/docs/queek-os) |
| Have an AI agent build on Queek | OpenAPI, `llms.txt`, AI toolkit | [AI agents](#building-with-ai-agents) |

## The platform in one table

| Piece | What it is | Where |
| --- | --- | --- |
| Storefront API | Read one store's catalogue, content and metafields, manage a cart, hand off to Queek checkout. Base URL `https://client.usequeek.com/v1`. | [Docs](https://docs.usequeek.com/docs/storefront) |
| Merchant API | Server-side access to a store's own data: products, inventory, orders, customers, discounts. Scoped keys. Base URL `https://api.usequeek.com/api/v1/merchant`. | [Docs](https://docs.usequeek.com/docs/merchant) |
| Webhooks | Signed events pushed to your server. | [Docs](https://docs.usequeek.com/docs/webhooks) |
| Dev stores | A sandbox store you own, with `sk_test_` keys. Nothing in it reaches real money or real customers. | [Docs](https://docs.usequeek.com/docs/sandbox) |
| App SDK | Install handlers, session verification, webhook verification and a typed Merchant API client. | [`@usequeek/app-sdk`](https://github.com/usequeek/app-sdk) |
| App starter | A full-stack app with the Queek design system preinstalled. | [`queek-app-starter`](https://github.com/usequeek/queek-app-starter) |
| Theme kit | Hooks, stores and checkout flows a theme is built on. | [`@usequeek/theme-kit`](https://github.com/usequeek/theme-kit) |
| Theme starter | A complete, design-free theme and the contract it is checked against. | [`theme-starter`](https://github.com/usequeek/theme-starter) |
| `queek` CLI | Preview, check and package themes. Develop, deploy and release apps. | [`@usequeek/cli`](https://github.com/usequeek/theme-tools) |
| AI toolkit | Agent skills for building Queek apps. | [`queek-ai-toolkit`](https://github.com/usequeek/queek-ai-toolkit) |
| Queek OS | A connector that lets Claude or ChatGPT run a store in conversation: `https://mcp.usequeek.com/merchant`. | [Docs](https://docs.usequeek.com/docs/queek-os) |

## Quickstart: read a store in two minutes

1. In the Queek dashboard, open **Developers > Dev stores** and create a dev store.
   It comes with a private key that starts with `sk_test_`.
2. Call the API:

```bash
curl https://client.usequeek.com/v1/store/info \
  -H "X-Client-Key: sk_test_your_key_here" \
  -H "Accept: application/json"
```

You get the store's name, currency, `storefront_url`, `checkout_url` and brand
kit. Responses from a dev store carry `X-Queek-Mode: test`, so you can tell a
sandbox from a live store in code.

3. List products:

```bash
curl "https://client.usequeek.com/v1/store/products?per_page=10" \
  -H "X-Client-Key: sk_test_your_key_here"
```

4. Run the storefront starter on the same key:

```bash
cd examples/nextjs-headless
yarn install
cp .env.example .env      # set QUEEK_SECRET_KEY to your sk_test_ key
yarn build && yarn start  # http://localhost:3000
```

Going live is swapping the key for the live store's key. Paths, headers and
bodies do not change.

## Authentication

Every request carries a key in the `X-Client-Key` header. There is no OAuth flow
for the two APIs: the key is the credential, and it belongs to one store.

| Key | Where it belongs | Reaches |
| --- | --- | --- |
| `pk_live_...` | Browser code. Works only from origins on the key's allowlist. | Storefront API |
| `sk_live_...` | Servers, build-time fetches and native apps. Never a browser. | Storefront API and Merchant API, within its scopes |
| `pk_test_...`, `sk_test_...` | Same rules, for a dev store. | The dev store only |

A test key against a live store, or a live key against a dev store, is a
`401 api_key_mode_mismatch`. Merchants create live keys under **Settings > API
keys**. For the Merchant API, the merchant chooses the key's scopes when they
create it, and an operation outside them is a `403 insufficient_scope`.

Keep secret keys in server environment variables. Never commit one and never
send one to a browser.

## Errors

Every failure answers with one envelope. Branch on `error.code`, never on
`message`.

```json
{
  "status": "failed",
  "message": "The email field is required.",
  "data": null,
  "error": {
    "code": "validation_failed",
    "message": "The email field is required.",
    "field": "email",
    "errors": { "email": ["The email field is required."] },
    "doc_url": "https://docs.usequeek.com/docs/versioning-and-errors#validation_failed",
    "request_id": "5d1c9b3e-8f2a-4b6d-9c07-3e1f8a2b6d45"
  }
}
```

- Codes are stable. A new failure mode gets a new code, and an existing code
  never changes meaning.
- `doc_url` links to the code's entry in the
  [error reference](https://docs.usequeek.com/docs/versioning-and-errors).
- `request_id` is also returned in the `X-Request-Id` header. Quote it when you
  contact support. You can send your own `X-Request-Id` (8 to 128 characters)
  to correlate your logs with ours.
- Retry `GET` requests freely. Retry writes only with an `Idempotency-Key`.

## Idempotency

Send an `Idempotency-Key` header on writes. Retrying with the same key and the
same body replays the stored response, marked `Idempotent-Replayed: true`, for 24
hours. The same key with a different body is a `409 idempotency_key_reuse`.
Failed responses are not stored, so a retry after an error runs again.

## Rate limits

- 180 requests per minute per API key and IP.
- A private live key (`sk_live_`) also carries its store's plan quota, from 60
  requests a minute on `free` to 2400 on `enterprise`. A public key is shared by
  every visitor of the store, so it has no per-store quota.
- A `429 too_many_requests` carries `Retry-After`. Wait that long before you
  retry. `X-RateLimit-Limit` and `X-RateLimit-Remaining` are on successful
  responses too.

## Versioning

There is one major version, `v1`, in the path. Inside `v1`, fields and endpoints
may be added. Nothing is removed, renamed or retyped, and enum values may grow,
so keep a default branch when you switch on a status. A breaking change would
ship as `v2` beside `v1`. If anything is ever deprecated, the responses say so
with `Deprecation` and `Sunset` headers, at least six months before it stops
working. Webhook deliveries state the contract they follow in
`X-Queek-Api-Version`. See the
[changelog](https://docs.usequeek.com/docs/changelog).

## Webhooks

Queek posts signed JSON events to an HTTPS endpoint configured for your app or
integration. Topics include
`orders/create`, `orders/paid`, `orders/updated`, `orders/fulfilled` and
`orders/cancelled`, plus product, customer, inventory level, locale and
translation events. The full list and payload schemas are in the
[webhooks docs](https://docs.usequeek.com/docs/webhooks) and the Merchant API
spec.

- Signatures follow [Standard Webhooks](https://www.standardwebhooks.com):
  verify `webhook-signature` over the raw request body, and reject timestamps
  more than 300 seconds old.
- Delivery is at least once and unordered. Deduplicate on `webhook-id`.
- A non-`2xx` response is retried up to 8 attempts in total, with delays from 5
  seconds to 2 hours. An endpoint that fails for 24 hours is disabled and the
  merchant is notified.
- Dev stores fire the same webhooks, signed and retried the same way, so you can
  prove your receiver before real orders reach it.

## Building with AI agents

- The Storefront API and Merchant API publish OpenAPI documents, linked above.
  Generate typed clients from them, or hand them to an agent.
- Every docs page is available as Markdown through
  <https://docs.usequeek.com/llms.txt>.
- The [AI toolkit](https://github.com/usequeek/queek-ai-toolkit) gives a coding
  agent skills for the app SDK, manifest and Merchant API:
  `npx skills add usequeek/queek-ai-toolkit`.
- [Queek OS](https://docs.usequeek.com/docs/queek-os) lets a merchant run their
  store from Claude or ChatGPT with their own account and permissions.

## Examples

| Example | What it shows |
| --- | --- |
| [`examples/nextjs-headless`](examples/nextjs-headless/) | A Next.js (App Router, TypeScript) storefront: store info, collections, products with metafields, a guest cart, and handoff to Queek-hosted checkout. The secret key stays on the server. |

The example has unit tests, a smoke test against a dev store, and a CI job that
builds it.

## Support

- Questions and integration help:
  [GitHub Discussions](https://github.com/usequeek/developers/discussions).
  Asking in the open helps the next developer.
- Bugs in an example: open an issue in this repository.
- Email: <developers@queek.com.ng>.
- Security issues: email <security@queek.com.ng> and do not open a public
  issue. See [SECURITY.md](SECURITY.md).

## Contributing

Fixes to the examples are welcome. Before you open a pull request, run the
example's checks (`yarn lint`, `yarn test`, `yarn build`) and
`node scripts/check-public-text.mjs`, which blocks internal references and
secret-shaped strings from landing in this public repository.

## License

MIT. Copyright (c) 2026 Queekx Technology LTD. See [LICENSE](LICENSE).
