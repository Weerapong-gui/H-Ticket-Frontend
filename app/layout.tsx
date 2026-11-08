import type { Metadata } from "next";
import { Suspense } from "react";
import {
  Cinzel,
  Cormorant_Garamond,
  DM_Sans,
  Noto_Sans_Thai,
  Noto_Serif_Thai,
} from "next/font/google";
import "./globals.css";
import { SalesProvider } from "@/components/booking-provider";
import { Header, Footer } from "@/components/chrome";

// โหลดฟอนต์ผ่าน next/font เพราะ @import ใน globals.css ถูกตัดทิ้งตอน build
const cinzel = Cinzel({ subsets: ["latin"], variable: "--f-cinzel" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--f-cormorant",
});
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--f-dm-sans" });
const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai"],
  variable: "--f-sans-thai",
});
const notoSerifThai = Noto_Serif_Thai({
  subsets: ["thai"],
  variable: "--f-serif-thai",
});
const fontVars = [cinzel, cormorant, dmSans, notoSansThai, notoSerifThai]
  .map((f) => f.variable)
  .join(" ");

export const metadata: Metadata = {
  title: "The Haunted House | บ้านผีสิง",
  description: "จองบัตรล่วงหน้าบ้านผีสิง The Haunted House",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="th"
      data-scroll-behavior="smooth"
      className={fontVars}
      // หน้าแรกตั้ง data-hh-entered ด้วย inline script ก่อน hydrate
      suppressHydrationWarning
    >
      <body>
        <a href="#main-content" className="skip-link">
          ข้ามไปที่เนื้อหา
        </a>
        <SalesProvider>
          <Header />
          <div id="main-content">
            <Suspense
              fallback={<main className="booking-main">กำลังโหลด…</main>}
            >
              {children}
            </Suspense>
          </div>
          <Footer />
        </SalesProvider>
      </body>
    </html>
  );
}
