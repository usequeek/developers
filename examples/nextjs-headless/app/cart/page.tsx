import { cookies } from "next/headers";
import { CART_COOKIE, getCart, validateCart } from "@/lib/queek";

export const dynamic = "force-dynamic";

function money(amount: number): string {
  return amount.toLocaleString();
}

export default async function CartPage() {
  const session = (await cookies()).get(CART_COOKIE)?.value;
  const cart = session ? await getCart(session) : null;
  const validation =
    cart && session && cart.cart_items.length > 0
      ? await validateCart(cart.id, session)
      : null;

  if (!cart || cart.cart_items.length === 0) {
    return (
      <>
        <h1>Cart</h1>
        <p className="muted">
          Your cart is empty. <a href="/products">Browse products</a>.
        </p>
      </>
    );
  }

  return (
    <>
      <h1>Cart</h1>
      {validation && !validation.is_valid && (
        <p className="card">
          Heads up — the store re-checked your lines:{" "}
          {JSON.stringify(validation.validation_errors)}
        </p>
      )}
      <div className="card" style={{ marginBottom: 16 }}>
        {cart.cart_items.map((item) => (
          <p key={`${item.item_id}-${item.variant_id ?? "base"}`}>
            <strong>{item.title}</strong>
            {item.variant_title ? ` (${item.variant_title})` : ""} ×{" "}
            {item.quantity} — {money(item.discount_price ?? item.price)}
          </p>
        ))}
        <p>
          <strong>Total: {money(cart.total_price)}</strong>
        </p>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <a className="btn" href={cart.checkout_url}>
          Continue to checkout
        </a>
        <form method="post" action="/api/cart/clear">
          <button className="btn btn-secondary" type="submit">
            Clear cart
          </button>
        </form>
      </div>
      <p className="muted" style={{ fontSize: 13 }}>
        Checkout is hosted by Queek — the button hands the shopper (and their
        cart session) to <code>checkout_url</code> from the cart API.
      </p>
    </>
  );
}
