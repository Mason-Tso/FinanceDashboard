import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { StockSearch } from "@/components/StockSearch";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Finance Dashboard",
  description: "Personal portfolio, research, and market intelligence.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-line-soft bg-bg/70 px-5 py-3 backdrop-blur-md">
              <Link href="/" className="text-sm font-semibold text-fg md:hidden">
                ◆ Finance
              </Link>
              <StockSearch />
              <div className="ml-auto flex items-center gap-2 text-xs text-faint">
                <span className="hidden h-2 w-2 rounded-full bg-up sm:inline-block" />
                <span className="hidden sm:inline">Local · read-only</span>
              </div>
            </header>
            <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
