/**
 * Smoke test: runs the lib/queek.js helpers that the route handlers call
 * against the Storefront API and prints what came back.
 *
 *   QUEEK_SECRET_KEY=sk_test_... node scripts/smoke.mjs
 *
 * It writes a cart (add, validate, clear) under a throwaway session, so it
 * only runs with a dev store key (`sk_test_`). It refuses a live key.
 */
import {
  addToCart,
  clearCart,
  getCart,
  getCollectionProducts,
  getMetafieldDefinitions,
  getProduct,
  getStoreInfo,
  listCollections,
  listProducts,
  metafieldEntries,
  newCartSession,
  validateCart,
} from "../lib/queek.js";

function fail(msg) {
  console.error(`SMOKE FAIL: ${msg}`);
  process.exit(1);
}

if (!process.env.QUEEK_SECRET_KEY?.startsWith("sk_test_")) {
  fail(
    "QUEEK_SECRET_KEY must be a dev store key (sk_test_...). The smoke test writes a cart, so it never runs against a live store.",
  );
}

const info = await getStoreInfo();
console.log(`store: ${info.name} (${info.slug}) currency=${info.currency}`);

const { products, total } = await listProducts({ per_page: 10 });
console.log(`product count: ${total}`);
if (products.length === 0) fail("product list is empty");

const first = products[0];
const detail = await getProduct(first.slug);
console.log(
  `first product: ${detail.title} (slug=${detail.slug} price=${detail.price})`,
);
const entries = metafieldEntries(detail.metafields);
console.log(
  `metafields (${entries.length}): ${entries.map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(", ") || "(none)"}`,
);

const collections = await listCollections();
console.log(`collections: ${collections.length}`);
if (collections.length > 0) {
  const ref = String(collections[0].slug ?? collections[0].id);
  const inCollection = await getCollectionProducts(ref, { per_page: 5 });
  console.log(`collection ${ref} products: ${inCollection.length}`);
}

const defs = await getMetafieldDefinitions();
console.log(
  `metafield definitions: ${Array.isArray(defs) ? defs.length : typeof defs}`,
);

const session = newCartSession();
const added = await addToCart(session, { product_id: first.id, quantity: 1 });
console.log(
  `cart add result: ${added.result} items=${added.cart.cart_items.length} total=${added.cart.total_price}`,
);
if (added.result !== "added")
  fail(`expected result=added, got ${added.result}`);

const cart = await getCart(session);
if (!cart) fail("cart missing after add");
console.log(`cart id: ${cart.id} checkout_url=${cart.checkout_url}`);

const validation = await validateCart(cart.id, session);
console.log(
  `cart valid: ${validation.is_valid} errors=${JSON.stringify(validation.validation_errors)}`,
);

await clearCart(session);
const after = await getCart(session);
console.log(`cart after clear: ${after?.cart_items.length ?? 0} items`);
console.log("SMOKE OK");
