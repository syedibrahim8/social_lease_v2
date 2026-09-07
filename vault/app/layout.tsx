import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import "@/styles/globals.css";

/**
 * Three voices, per the design system:
 *   Playfair  — hero amounts and page titles. The number you feel.
 *   JetBrains — every figure in a table, row, stat or badge. The number you compare.
 *   Inter     — body, labels, navigation, forms.
 *
 * next/font self-hosts these, so there is no render-blocking request to a third
 * party and no layout shift from a late webfont swap.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Vault",
    template: "%s · Vault",
  },
  description:
    "Escrow-backed campaigns between brands and creators. Funds are held before the work starts and released the moment it is approved.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} ${jetbrains.variable}`}
    >
      <body>
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
