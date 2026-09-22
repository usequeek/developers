import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { CART_COOKIE, clearCart } from "@/lib/queek";

/** POST /api/cart/clear — empty the shopper's cart, back to /cart. */
export async function POST(request: Request): Promise<Response> {
  const session = (await cookies()).get(CART_COOKIE)?.value;
  if (session) await clearCart(session);
  return NextResponse.redirect(new URL("/cart", request.url), 303);
}
