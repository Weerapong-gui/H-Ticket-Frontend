import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { DemoBookingProvider } from "@/components/demo-booking-provider";
import { Header, Footer } from "@/components/chrome";

export const metadata: Metadata = {
  title: "The Haunted House | Enter if you dare",
  description:
    "An immersive horror experience. Explore the house and create your demo booking.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" data-scroll-behavior="smooth">
      <body>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <DemoBookingProvider>
          <Header />
          <div id="main-content">
            <Suspense
              fallback={
                <main className="booking-main">Opening the house…</main>
              }
            >
              {children}
            </Suspense>
          </div>
          <Footer />
        </DemoBookingProvider>
      </body>
    </html>
  );
}
