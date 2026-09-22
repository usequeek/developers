import { getProduct, metafieldEntries } from "@/lib/queek";

export const dynamic = "force-dynamic";

function money(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString()}`;
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ customise?: string }>;
}) {
  const { slug } = await params;
  const { customise } = await searchParams;
  const p = await getProduct(slug);
  const metafields = metafieldEntries(p.metafields);
  const image = p.media?.image ?? p.image;

  return (
    <>
      <p className="muted">
        <a href="/products">Products</a> / {p.title}
      </p>
      <h1>{p.title}</h1>
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={p.title}
          style={{ maxWidth: "100%", borderRadius: 10 }}
        />
      )}
      <p>
        <strong style={{ fontSize: 22 }}>
          {money(p.discount_price ?? p.price, p.currency)}
        </strong>{" "}
        {p.discount_price && p.discount_price < p.price && (
          <s className="muted">{money(p.price, p.currency)}</s>
        )}
      </p>
      <p className="muted">
        {p.inventory.in_stock
          ? "In stock"
          : "Out of stock"}
      </p>
      {p.description && <p>{p.description}</p>}

      {metafields.length > 0 && (
        <section>
          <h2>Details</h2>
          <table className="meta">
            <tbody>
              {metafields.map(([key, value]) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>{typeof value === "object" ? JSON.stringify(value) : String(value ?? "")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {p.variants.length > 0 && (
        <section>
          <h2>Options</h2>
          <ul>
            {p.variants.map((v) => (
              <li key={v.id}>
                {v.title} — {money(v.price, p.currency)}
              </li>
            ))}
          </ul>
          <p className="muted">
            Variant checkout: pick the option you want, then add it from the
            cart API with its <code>variant_id</code> (see{" "}
            <code>POST /store/cart/items</code> in the API reference).
          </p>
        </section>
      )}

      {customise && (
        <p className="card">
          This product needs an option choice first — pick a variant above.
        </p>
      )}

      <form method="post" action="/api/cart/items">
        <input type="hidden" name="product_id" value={p.id} />
        <input type="hidden" name="slug" value={p.slug} />
        <button className="btn" type="submit">
          Add to cart
        </button>
      </form>
    </>
  );
}
