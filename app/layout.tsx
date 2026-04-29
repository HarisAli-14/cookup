import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CookUp",
  description: "Custom meal ordering for CookUp customers"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
