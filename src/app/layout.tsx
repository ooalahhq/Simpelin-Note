import type { Metadata } from "next";
import OfflineShell from "@/components/OfflineShell";
import "@fontsource/pixelify-sans/400.css";
import "@fontsource/pixelify-sans/600.css";
import "@fontsource-variable/dm-sans";
import "@fontsource/jetbrains-mono/400.css";
import "../../tokens.css";
import "./globals.css";
export const metadata: Metadata = {
  title: "Simpelin — Buku perjalananmu",
  description:
    "Catatan belajar terstruktur dengan timeline pertemuan, editor rich text, dan spell pixel fantasy interaktif. Lokal di perangkatmu.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        {children}
        <OfflineShell />
      </body>
    </html>
  );
}
