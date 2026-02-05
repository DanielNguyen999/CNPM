import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "BizFlow Web",
  description: "BizFlow - Nền tảng chuyển đổi số cho hộ kinh doanh"
};

import { Providers } from "@/components/providers";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

