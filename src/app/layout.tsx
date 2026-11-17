import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "商智通 · 企业 AI 经营增长助手",
  description:
    "面向成长型企业的 AI 经营增长平台：AI 营销、企业知识库问答、客户经营与平台运营。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
