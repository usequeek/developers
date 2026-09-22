import {
  collectionName,
  collectionRef,
  getStoreInfo,
  listCollections,
  listProducts,
} from "@/lib/queek";

export const dynamic = "force-dynamic";

function money(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString()}`;
}

export default async function Home() {
  const [info, collections, { products, total }] = await Promise.all([
    getStoreInfo(),
    listCollections(),
    listProducts({ per_page: 12 }),
  ]);

  return (
    <>
      <p className="muted">
        {info.is_open ? info.message ?? "Open" : "Currently closed"} · {total}{" "}
        product{total === 1 ? "" : "s"}
      </p>

      {collections.length > 0 && (
        <section>
          <h2>Collections</h2>
          <div className="grid">
            {collections.map((c) => (
              <a
                key={String(c.id)}
                className="card"
                href={`/products?collection=${encodeURIComponent(collectionRef(c))}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <strong>{collectionName(c)}</strong>
              </a>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2>Products</h2>
        {products.length === 0 ? (
          <p className="muted">No published products yet.</p>
        ) : (
          <div className="grid">
            {products.map((p) => (
              <a
                key={p.id}
                className="card"
                href={`/products/${encodeURIComponent(p.slug)}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <strong>{p.title}</strong>
                <p>
                  {p.discount_price && p.discount_price < p.price ? (
                    <>
                      {money(p.discount_price, p.currency)}{" "}
                      <s className="muted">{money(p.price, p.currency)}</s>
                    </>
                  ) : (
                    money(p.price, p.currency)
                  )}
                </p>
                <p className="muted" style={{ fontSize: 13 }}>
                  {p.inventory.in_stock ? "In stock" : "Out of stock"}
                  {p.has_variants ? " · options available" : ""}
                </p>
              </a>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
