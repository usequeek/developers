import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { CART_COOKIE, QueekSdkError, addToCart, newCartSession } from "@/lib/queek";

/**
 * POST /api/cart/items — add one line to the shopper's anonymous cart.
 * Reads (or mints) the `queek_cart_session` cookie, forwards it as the
 * `X-Cart-Session` header, then redirects. The secret key never leaves the
 * server (see lib/queek.js).
 */
export async function POST(request: Request): Promise<Response> {
  const form = await request.formData().catch(() => null);
  if (!form) {
    return Response.json({ error: "Send a form body with product_id" }, { status: 400 });
  }
  const product_id = String(form.get("product_id") ?? "");
  const slug = String(form.get("slug") ?? "");
  if (!product_id) {
    return Response.json({ error: "product_id is required" }, { status: 400 });
  }

  const store = await cookies();
  const session = store.get(CART_COOKIE)?.value ?? newCartSession();

  let result: string;
  try {
    ({ result } = await addToCart(session, { product_id, quantity: 1 }));
  } catch (error) {
    if (!(error instanceof QueekSdkError)) throw error;
    // Pass a client error (unknown product, invalid quantity) back as-is;
    // anything else is an upstream failure.
    const status = error.status >= 400 && error.status < 500 ? error.status : 502;
    return Response.json({ error: error.code, message: error.message }, { status });
  }
  const target =
    result === "added"
      ? "/cart"
      : `/products/${encodeURIComponent(slug)}?customise=1`;

  // Secure cookies only over HTTPS, so http://localhost keeps working in every browser.
  const proto =
    request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol;
  const secure = proto.replace(":", "") === "https";

  const res = NextResponse.redirect(new URL(target, request.url), 303);
  res.cookies.set(CART_COOKIE, session, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
