/**
 * Regression test for the envelope-unwrap bug: the SDK returns the raw API
 * body and `ApiEnvelope<T>` already models `data`, so helpers must type the
 * generic as the *content* of `data` and return `res.data` — never
 * `res.data.data` (which is `undefined` on real payloads).
 *
 * Runs on stubbed `fetch` (no network): `node --test tests/`.
 */
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createQueekClient } from "@queekai/client-sdk";
import {
  addToCart,
  collectionName,
  collectionRef,
  getCart,
  getProduct,
  getStoreInfo,
  listProducts,
  metafieldEntries,
  setClientForTests,
  validateCart,
} from "../lib/queek.js";

const STORE = { id: "store-1", name: "Dev Store", slug: "dev-store" };
const PRODUCT = { id: "prod-1", title: "Probe", slug: "probe", metafields: {} };
const CART = { id: "cart-1", cart_items: [], total_price: 0 };

/** Minimal fetch stub keyed by path; mimics the SDK's fetchFn contract. */
function stubFetch(routes) {
  return async (url, init = {}) => {
    const path = String(url).replace("https://client.usequeek.com/v1", "");
    const route = routes[path];
    assert.ok(route, `unexpected request ${init.method ?? "GET"} ${path}`);
    return {
      ok: true,
      headers: { get: () => "application/json" },
      json: async () =>
        typeof route === "function" ? route(url, init) : route,
    };
  };
}

beforeEach(() => {
  setClientForTests(null);
  process.env.QUEEK_SECRET_KEY = "sk_test_stub";
});

function useClient(fetchImpl) {
  setClientForTests(
    createQueekClient({
      baseUrl: "https://client.usequeek.com/v1",
      clientKey: "sk_test_stub",
      fetch: fetchImpl,
    }),
  );
}

describe("envelope unwrap", () => {
  it("getStoreInfo returns the store, not undefined", async () => {
    useClient(
      stubFetch({ "/store/info": { status: "success", data: STORE } }),
    );
    const info = await getStoreInfo();
    assert.equal(info.name, "Dev Store");
  });

  it("listProducts returns products + total from meta", async () => {
    useClient(
      stubFetch({
        "/store/products?per_page=10": {
          data: [PRODUCT],
          meta: { pagination: { total: 7 } },
        },
      }),
    );
    const { products, total } = await listProducts({ per_page: 10 });
    assert.equal(products.length, 1);
    assert.equal(products[0].title, "Probe");
    assert.equal(total, 7);
  });

  it("getProduct returns the product", async () => {
    useClient(
      stubFetch({
        "/store/products/probe": { status: "success", data: PRODUCT },
      }),
    );
    const p = await getProduct("probe");
    assert.equal(p.slug, "probe");
  });

  it("cart helpers forward X-Cart-Session and unwrap", async () => {
    const seen = {};
    useClient(
      stubFetch({
        "/store/cart/items": (url, init) => {
          seen.headers = Object.fromEntries(init.headers.entries());
          seen.body = JSON.parse(init.body);
          return { data: { result: "added", cart: CART } };
        },
        "/store/cart": { data: [CART] },
        "/store/cart/validate": { data: { is_valid: true, validation_errors: [] } },
      }),
    );
    const added = await addToCart("sess-1", { product_id: "prod-1" });
    assert.equal(added.result, "added");
    assert.equal(seen.headers["x-cart-session"], "sess-1");
    assert.equal(seen.body.product_id, "prod-1");
    const cart = await getCart("sess-1");
    assert.equal(cart?.id, "cart-1");
    const v = await validateCart("cart-1", "sess-1");
    assert.equal(v.is_valid, true);
  });
});

describe("metafield / collection helpers", () => {
  it("metafieldEntries handles [] (list) and {} (detail)", () => {
    assert.deepEqual(metafieldEntries([]), []);
    assert.deepEqual(metafieldEntries({ "custom.fabric": "cotton" }), [
      ["custom.fabric", "cotton"],
    ]);
    assert.deepEqual(metafieldEntries(undefined), []);
  });

  it("collectionRef prefers slug, falls back to id", () => {
    assert.equal(collectionRef({ id: 5, slug: "new-in" }), "new-in");
    assert.equal(collectionRef({ id: 5 }), "5");
    assert.equal(collectionName({ id: 5, title: "Best" }), "Best");
  });
});
