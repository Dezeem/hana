import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { site } from "@/site.config";

const fraunces = localFont({
  src: "../public/fonts/fraunces-latin.woff2",
  variable: "--font-fraunces",
  weight: "300 700",
  display: "swap",
  preload: true,
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: site.title,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.owner }],
  keywords: ["个人收藏", "书影音", "标本室", "豆瓣", "作品档案"],
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: site.name,
    title: site.title,
    description: site.description,
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
  },
  robots: { index: true, follow: true },
};

const themeScript = `
(function(){
  try {
    var stored = localStorage.getItem('hana-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (stored === 'dark' || (!stored && prefersDark)) {
      document.documentElement.classList.add('dark');
    }
    document.documentElement.style.colorScheme = stored === 'light' ? 'light' : (stored === 'dark' ? 'dark' : (prefersDark ? 'dark' : 'light'));
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className={fraunces.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
