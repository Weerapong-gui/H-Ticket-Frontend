import type { Metadata } from "next";
import { Suspense } from "react";
import {
  Cinzel,
  Cinzel_Decorative,
  Cormorant_Garamond,
  DM_Sans,
  Noto_Sans_Thai,
  Noto_Serif_Thai,
  Pirata_One,
  Srisakdi,
} from "next/font/google";
import "./globals.css";
import { PackageProvider, SalesProvider } from "@/components/booking-provider";
import { LoadingMain } from "@/components/i18n-bits";

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
// หัวข้อ: ไทยใช้ Srisakdi (ตัวโบราณหัวม้วน แบบอักขระยันต์) อังกฤษ/ตัวเลขใช้ Pirata One
const srisakdi = Srisakdi({
  subsets: ["thai"],
  weight: ["400", "700"],
  variable: "--f-chant",
});
// ตัวเลข/ราคา: ตัวโรมันแกะสลักแบบป้ายหลุมศพ (ตัวเลขของ Pirata One อ่านยาก)
const cinzelDeco = Cinzel_Decorative({
  subsets: ["latin"],
  weight: "700",
  variable: "--f-cinzel-deco",
});
const pirata = Pirata_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--f-pirata",
});
const fontVars = [
  cinzel,
  cormorant,
  dmSans,
  notoSansThai,
  notoSerifThai,
  srisakdi,
  pirata,
  cinzelDeco,
]
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
        <SalesProvider>
          <PackageProvider>
            <Suspense fallback={<LoadingMain />}>{children}</Suspense>
          </PackageProvider>
        </SalesProvider>
      </body>
    </html>
  );
}
