import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getStoreInfo } from "@/lib/queek";

export const dynamic = "force-dynamic";

const FALLBACK_BRAND = {
  bg: "#fafafa",
  surface: "#ffffff",
  text: "#1a1a1a",
  text_muted: "#6b7280",
  primary: "#229879",
  on_accent: "#ffffff",
  border: "#e5e7eb",
};

export async function generateMetadata(): Promise<Metadata> {
  try {
    const info = await getStoreInfo();
    return { title: info.name, description: `Shop ${info.name} — headless Queek storefront` };
  } catch {
    return { title: "Queek headless storefront" };
  }
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  let brand = FALLBACK_BRAND;
  let storeName = "Store";
  let fontFamily = "system-ui, -apple-system, sans-serif";
  try {
    const info = await getStoreInfo();
    storeName = info.name;
    brand = { ...FALLBACK_BRAND, ...info.brand.colors };
    // Theme: the merchant's brand kit (Dashboard → brand) drives the theme.
    // Override `fontFamily` here to pin your own typeface instead.
    if (info.brand.font?.body) fontFamily = `${info.brand.font.body}, ${fontFamily}`;
  } catch {
    // No key / API unreachable: render unbranded so the build never fails.
  }

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: brand.bg,
          color: brand.text,
          fontFamily,
        }}
      >
        <style>{`
          a { color: ${brand.primary}; }
          .wrap { max-width: 960px; margin: 0 auto; padding: 24px 16px 64px; }
          header.top { border-bottom: 1px solid ${brand.border}; background: ${brand.surface}; }
          header.top .wrap { display: flex; gap: 20px; align-items: center; padding-top: 14px; padding-bottom: 14px; }
          header.top nav { display: flex; gap: 16px; margin-left: auto; }
          header.top nav a { text-decoration: none; font-weight: 600; }
          .store-name { font-weight: 800; font-size: 20px; color: ${brand.text}; text-decoration: none; }
          .card { background: ${brand.surface}; border: 1px solid ${brand.border}; border-radius: 10px; padding: 16px; }
          .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
          .muted { color: ${brand.text_muted}; }
          .btn { display: inline-block; background: ${brand.primary}; color: ${brand.on_accent}; border: 0; border-radius: 8px; padding: 10px 18px; font-weight: 700; cursor: pointer; text-decoration: none; font-size: 15px; }
          .btn-secondary { background: transparent; color: ${brand.primary}; border: 1px solid ${brand.primary}; }
          table.meta { border-collapse: collapse; width: 100%; }
          table.meta td { border-top: 1px solid ${brand.border}; padding: 8px 4px; vertical-align: top; }
          table.meta td:first-child { font-weight: 600; width: 220px; }
          input, select { padding: 9px 12px; border: 1px solid ${brand.border}; border-radius: 8px; font-size: 15px; background: ${brand.surface}; color: ${brand.text}; }
        `}</style>
        <header className="top">
          <div className="wrap">
            <a className="store-name" href="/">
              {storeName}
            </a>
            <nav>
              <a href="/products">Products</a>
              <a href="/cart">Cart</a>
            </nav>
          </div>
        </header>
        <main className="wrap">{children}</main>
      </body>
    </html>
  );
}
