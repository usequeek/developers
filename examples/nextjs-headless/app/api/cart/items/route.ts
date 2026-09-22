import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { CART_COOKIE, addToCart, newCartSession } from "@/lib/queek";

/**
 * POST /api/cart/items — add one line to the shopper's anonymous cart.
 * Reads (or mints) the `queek_cart_session` cookie, forwards it as the
 * `X-Cart-Session` header, then redirects. The secret key never leaves the
 * server (see lib/queek.js).
 */
export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const product_id = String(form.get("product_id") ?? "");
  const slug = String(form.get("slug") ?? "");
  if (!product_id) {
    return Response.json({ error: "product_id is required" }, { status: 400 });
  }

  const store = await cookies();
  const session = store.get(CART_COOKIE)?.value ?? newCartSession();

  const { result } = await addToCart(session, { product_id, quantity: 1 });
  const target =
    result === "added"
      ? "/cart"
      : `/products/${encodeURIComponent(slug)}?customise=1`;

  const res = NextResponse.redirect(new URL(target, request.url), 303);
  res.cookies.set(CART_COOKIE, session, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
