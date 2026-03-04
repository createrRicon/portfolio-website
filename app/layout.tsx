import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "龚力康 | UI/UX Designer",
  description: "关系设计师 — 在复杂系统中寻找并设计联系",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
