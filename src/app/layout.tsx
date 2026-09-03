import type { Metadata, Viewport } from "next";
import { Geist, Noto_Sans_JP } from "next/font/google";

import "./globals.css";

/**
 * Fonts are loaded through `next/font` so they are self-hosted, preloaded and
 * emitted with a stable class name — no layout shift, no request to Google at
 * runtime.
 */
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

/**
 * Japanese text must never fall back to a generic sans-serif: on many systems
 * that resolves to a Chinese font, which draws a noticeable minority of
 * characters in the wrong regional form.
 */
const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
  display: "swap",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Japanese",
    template: "%s · Japanese",
  },
  description: "Learn Japanese from where you actually are.",
};

export const viewport: Viewport = {
  themeColor: "#f7f3ea",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geist.variable} ${notoSansJP.variable}`}>
      <body className="min-h-dvh bg-canvas text-ink antialiased">{children}</body>
    </html>
  );
}
