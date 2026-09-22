/**
 * Server-side Queek client for the headless starter.
 *
 * Every call below hits a path that exists in the public OpenAPI spec
 * (https://client.usequeek.com/openapi.json). Request bodies reuse the
 * generated `components["schemas"]` types; endpoint paths are checked
 * against the spec's literal `paths` keys.
 *
 * One honesty note: the spec's 200-response `data` schemas are loose (the
 * generator emits `data: string[]` where the API returns objects), so entity
 * shapes here are pinned from live sandbox responses instead — see README.
 * If a field you need is missing, fetch it and extend the typedef.
 *
 * The secret key (`sk_…`) lives ONLY here, on the server. Route handlers and
 * server components import these helpers; the browser never sees the key.
 *
 * Plain `.js` (with JSDoc types checked by `tsc`) on purpose: the Next app
 * and the plain-node smoke script import this same file with no build step.
 */

import { randomUUID } from "node:crypto";
import {
  createQueekClient,
  QueekSdkError,
} from "@queekai/client-sdk";

export { QueekSdkError };

export const API_BASE =
  process.env.QUEEK_API_BASE ?? "https://client.usequeek.com/v1";

/** Cookie holding the shopper's anonymous cart session id. */
export const CART_COOKIE = "queek_cart_session";

function secret() {
  const key = process.env.QUEEK_SECRET_KEY;
  if (!key) {
    throw new Error(
      "Missing QUEEK_SECRET_KEY. Copy .env.example to .env and paste a secret key (Dashboard → Settings → API).",
    );
  }
  return key;
}

/** @type {import("@queekai/client-sdk").QueekClientInstance | null} */
let client = null;

/** Shared SDK client: sends `X-Client-Key` + `Accept: application/json`. */
export function getClient() {
  if (!client) {
    client = createQueekClient({
      baseUrl: API_BASE,
      clientKey: secret(),
      fetch: globalThis.fetch,
    });
  }
  return client;
}

/**
 * Test seam: replace the cached client (used by tests/unwrap.test.mjs with a
 * stub `fetch`). Not used by the app.
 * @param {import("@queekai/client-sdk").QueekClientInstance | null} next
 */
export function setClientForTests(next) {
  client = next;
}

/**
 * Anonymous cart session id, sent as `X-Cart-Session`. One per shopper.
 * @returns {string}
 */
export function newCartSession() {
  return randomUUID();
}

/**
 * @param {string} session
 * @returns {Record<string, string>}
 */
function cartHeaders(session) {
  return { "X-Cart-Session": session };
}

// ---------------------------------------------------------------------------
// Entities (shapes observed against the live sandbox; see note above)
// ---------------------------------------------------------------------------

/**
 * @typedef {object} StoreBrand
 * @property {string | null} logo
 * @property {Record<string, string>} colors
 * @property {{ font: string, heading: string, body: string }} font
 * @property {unknown[]} socials
 */

/**
 * @typedef {object} StoreInfo
 * @property {string} id
 * @property {string} name
 * @property {string} slug
 * @property {string} currency
 * @property {string} commerce_mode
 * @property {boolean} is_open
 * @property {string | null} message
 * @property {string} storefront_url
 * @property {string} checkout_url
 * @property {StoreBrand} brand
 */

/**
 * @typedef {object} ProductSummary
 * @property {string} id
 * @property {number} p_id
 * @property {string} title
 * @property {string} slug
 * @property {string | null} excerpt
 * @property {string | null} description
 * @property {number} price
 * @property {number | null} discount_price
 * @property {number | null} compare_at_price
 * @property {string} currency
 * @property {string | null} thumbnail_image
 * @property {string | null} image
 * @property {boolean} has_variants
 * @property {{ in_stock: boolean, quantity: number | null }} inventory
 * @property {number} rating
 * @property {number} review_count
 * @property {unknown} metafields List endpoint answers `[]`; detail answers `{}`. Use `metafieldEntries`.
 */

/**
 * Detail adds media, variants, options and addons to the summary shape.
 * (Defined standalone — TS JSDoc cannot extend a typedef by intersection.)
 * @typedef {object} ProductDetail
 * @property {string} id
 * @property {number} p_id
 * @property {string} title
 * @property {string} slug
 * @property {string | null} excerpt
 * @property {string | null} description
 * @property {number} price
 * @property {number | null} discount_price
 * @property {number | null} compare_at_price
 * @property {string} currency
 * @property {string | null} thumbnail_image
 * @property {string | null} image
 * @property {boolean} has_variants
 * @property {{ in_stock: boolean, quantity: number | null }} inventory
 * @property {number} rating
 * @property {number} review_count
 * @property {unknown} metafields
 * @property {{ thumbnail: string | null, image: string | null, original: string | null, gallery: string[] }} media
 * @property {Array<{ id: string, title: string, price: number, in_stock?: boolean, option_values?: unknown }>} variants
 * @property {unknown[]} options
 * @property {unknown[]} addons
 */

/**
 * @typedef {object} Collection
 * @property {string | number} id
 * @property {string} [slug]
 * @property {string} [name]
 * @property {string} [title]
 */

/**
 * @typedef {object} CartItem
 * @property {string} item_id
 * @property {string} title
 * @property {string | null} variant_id
 * @property {string | null} variant_title
 * @property {number} price
 * @property {number | null} discount_price
 * @property {number} quantity
 */

/**
 * @typedef {object} Cart
 * @property {string} id
 * @property {CartItem[]} cart_items
 * @property {number} total_price
 * @property {string} checkout_url
 * @property {boolean | null} is_valid
 * @property {unknown[]} validation_errors
 */

/**
 * @typedef {import("./schema.js").components["schemas"]["AddCartItemRequest"]} AddCartItemBody
 * @typedef {import("./schema.js").components["schemas"]["ValidateCustomerCartRequest"]} ValidateCartBody
 * @typedef {keyof import("./schema.js").paths} SpecPath
 */

/**
 * `metafields` is `[]` on list and `{}` on detail — normalize to entries.
 * @param {unknown} metafields
 * @returns {Array<[string, unknown]>}
 */
export function metafieldEntries(metafields) {
  if (Array.isArray(metafields)) return [];
  if (metafields && typeof metafields === "object") {
    return Object.entries(metafields);
  }
  return [];
}

/**
 * @param {Collection} c
 * @returns {string}
 */
export function collectionRef(c) {
  return String(c.slug ?? c.id);
}

/**
 * @param {Collection} c
 * @returns {string}
 */
export function collectionName(c) {
  return String(c.name ?? c.title ?? c.slug ?? c.id);
}

// ---------------------------------------------------------------------------
// Calls — one per spec path used.
// NB: the SDK returns the raw body and `ApiEnvelope<T>` already models
// `data`, so the generic is the *content* of `data`, never `{ data: … }`.
// ---------------------------------------------------------------------------

/**
 * GET /store/info — the store, its brand kit and checkout URLs.
 * @returns {Promise<StoreInfo>}
 */
export async function getStoreInfo() {
  /** @type {SpecPath} */
  const path = "/store/info";
  const res = await getClient().get(path);
  return /** @type {StoreInfo} */ (res.data);
}

/**
 * @typedef {object} ProductListParams
 * @property {number} [page]
 * @property {number} [per_page]
 * @property {string} [keyword]
 * @property {string} [category_slug]
 * @property {"latest" | "popular" | "price_low" | "price_high"} [sort]
 * @property {boolean} [in_stock]
 */

/**
 * GET /store/products — paginated catalogue (`page`, `per_page` ≤ 100).
 * @param {ProductListParams} [params]
 * @returns {Promise<{ products: ProductSummary[], total: number }>}
 */
export async function listProducts(params = {}) {
  /** @type {SpecPath} */
  const path = "/store/products";
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) qs.set(k, String(v));
  }
  const suffix = qs.size > 0 ? `?${qs}` : "";
  const res = await getClient().get(`${path}${suffix}`);
  const meta =
    /** @type {{ meta?: { total?: number, pagination?: { total?: number } } }} */ (
      res
    ).meta;
  const products = /** @type {ProductSummary[]} */ (res.data);
  const total = meta?.total ?? meta?.pagination?.total ?? products.length;
  return { products, total };
}

/**
 * GET /store/products/{slug} — full product incl. public `metafields`.
 * @param {string} slug
 * @returns {Promise<ProductDetail>}
 */
export async function getProduct(slug) {
  const res = await getClient().get(
    `/store/products/${encodeURIComponent(slug)}`,
  );
  return /** @type {ProductDetail} */ (res.data);
}

/**
 * GET /store/collections — curated/smart collections (may be empty).
 * @returns {Promise<Collection[]>}
 */
export async function listCollections() {
  /** @type {SpecPath} */
  const path = "/store/collections";
  const res = await getClient().get(path);
  return /** @type {Collection[]} */ (res.data);
}

/**
 * GET /store/collections/{collection}/products — one collection's products.
 * @param {string} ref
 * @param {Pick<ProductListParams, "page" | "per_page">} [params]
 * @returns {Promise<ProductSummary[]>}
 */
export async function getCollectionProducts(ref, params = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) qs.set(k, String(v));
  }
  const suffix = qs.size > 0 ? `?${qs}` : "";
  const res = await getClient().get(
    `/store/collections/${encodeURIComponent(ref)}/products${suffix}`,
  );
  return /** @type {ProductSummary[]} */ (res.data);
}

/**
 * GET /store/metafield-definitions — schema behind product `metafields`.
 * @returns {Promise<unknown>}
 */
export async function getMetafieldDefinitions() {
  /** @type {SpecPath} */
  const path = "/store/metafield-definitions";
  const res = await getClient().get(path);
  return res.data;
}

/**
 * GET /store/cart — carts for the `X-Cart-Session` shopper.
 * @param {string} session
 * @returns {Promise<Cart | null>}
 */
export async function getCart(session) {
  /** @type {SpecPath} */
  const path = "/store/cart";
  const res = await getClient().get(path, { headers: cartHeaders(session) });
  const carts = /** @type {Cart[]} */ (res.data);
  return carts[0] ?? null;
}

/**
 * POST /store/cart/items — add one line. Replies `result: "added"` with the
 * cart, or `result: "customise"` when the product needs variant/addon choice.
 * @param {string} session
 * @param {AddCartItemBody} body
 * @returns {Promise<{ result: string, cart: Cart }>}
 */
export async function addToCart(session, body) {
  /** @type {SpecPath} */
  const path = "/store/cart/items";
  const res = await getClient().post(path, body, {
    headers: cartHeaders(session),
  });
  return /** @type {{ result: string, cart: Cart }} */ (res.data);
}

/**
 * POST /store/cart/validate — re-check lines vs stock/prices pre-checkout.
 * Anonymous carts must also send `X-Cart-Session` (required by the server
 * though not listed in the spec params).
 * @param {string} cartId
 * @param {string} session
 * @returns {Promise<{ is_valid: boolean, validation_errors: unknown[] }>}
 */
export async function validateCart(cartId, session) {
  /** @type {SpecPath} */
  const path = "/store/cart/validate";
  /** @type {ValidateCartBody} */
  const body = { cart_id: cartId };
  const res = await getClient().post(path, body, {
    headers: cartHeaders(session),
  });
  return /** @type {{ is_valid: boolean, validation_errors: unknown[] }} */ (
    res.data
  );
}

/**
 * DELETE /store/cart/clear — empty the shopper's cart.
 * @param {string} session
 * @returns {Promise<void>}
 */
export async function clearCart(session) {
  /** @type {SpecPath} */
  const path = "/store/cart/clear";
  await getClient().delete(path, { headers: cartHeaders(session) });
}
