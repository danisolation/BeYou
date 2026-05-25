import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Peerlight AI",
  description: "Không gian hỗ trợ học sinh THPT",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
