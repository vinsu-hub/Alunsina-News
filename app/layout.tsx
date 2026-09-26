import type { Metadata, Viewport } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";
import { Masthead } from "@/components/layout/Masthead";
import { MainNav } from "@/components/layout/MainNav";
import { TrendingTicker } from "@/components/layout/TrendingTicker";
import { Footer } from "@/components/layout/Footer";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { SampleBanner } from "@/components/layout/SampleBanner";
import { getTrendingTopics } from "@/lib/queries";

const newsreader = Newsreader({ variable: "--font-newsreader", subsets: ["latin"], style: ["normal", "italic"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

// Every page reads the live Postgres edition; render per request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "ALUNSINA NEWS — Truth has more than one source.", template: "%s · ALUNSINA NEWS" },
  description: "One story. Multiple sources. Fuller context. Philippine news, compared across national, regional, and primary sources.",
};

export const viewport: Viewport = { themeColor: "#F4F1E8", viewportFit: "cover" };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const trending = (await getTrendingTopics()).map((t) => t.topic);
  return (
    <html lang="en" className={`${newsreader.variable} ${inter.variable}`}>
      <body className="min-h-dvh">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:bg-paper focus:p-2">
          Skip to content
        </a>
        <SampleBanner />
        <header>
          <Masthead />
          <MainNav />
          <TrendingTicker topics={trending} />
        </header>
        <main id="main" className="min-w-0 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">{children}</main>
        <Footer />
        <MobileTabBar />
      </body>
    </html>
  );
}
