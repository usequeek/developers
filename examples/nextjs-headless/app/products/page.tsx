import { getCollectionProducts, listProducts } from "@/lib/queek";

export const dynamic = "force-dynamic";

type SearchParams = {
  keyword?: string;
  sort?: "latest" | "popular" | "price_low" | "price_high";
  collection?: string;
};

function money(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString()}`;
}

export default async function ProductList({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { keyword, sort, collection } = await searchParams;

  const products = collection
    ? await getCollectionProducts(collection, { per_page: 24 })
    : (
        await listProducts({
          per_page: 24,
          ...(keyword ? { keyword } : {}),
          ...(sort ? { sort } : {}),
        })
      ).products;

  return (
    <>
      <h1>{collection ? `Collection: ${collection}` : "Products"}</h1>
      {!collection && (
        <form method="get" style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <input
            type="search"
            name="keyword"
            placeholder="Search products…"
            defaultValue={keyword ?? ""}
          />
          <select name="sort" defaultValue={sort ?? ""}>
            <option value="">Sort: featured</option>
            <option value="latest">Newest</option>
            <option value="popular">Popular</option>
            <option value="price_low">Price: low to high</option>
            <option value="price_high">Price: high to low</option>
          </select>
          <button className="btn" type="submit">
            Apply
          </button>
        </form>
      )}
      {products.length === 0 ? (
        <p className="muted">Nothing here yet.</p>
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
                {money(p.discount_price ?? p.price, p.currency)}{" "}
                {p.discount_price && p.discount_price < p.price && (
                  <s className="muted">{money(p.price, p.currency)}</s>
                )}
              </p>
              <p className="muted" style={{ fontSize: 13 }}>
                {p.inventory.in_stock ? "In stock" : "Out of stock"}
              </p>
            </a>
          ))}
        </div>
      )}
    </>
  );
}
