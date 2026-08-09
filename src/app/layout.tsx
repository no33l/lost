import type { Metadata } from "next";
import { Figtree, Fraunces } from "next/font/google";
import "./globals.css";

// Ersatz-Fonts im Geist von Styrene (Sans) und Copernicus/Tiempos (Display-Serif).
// Tausch gegen die Original-Fonts: hier laden und dieselben Variablen setzen.
const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: {
    default: "Lost. - Lebensberatung zwischen den Welten",
    template: "%s · Lost.",
  },
  description:
    "Lebensberatung für Menschen zwischen den Welten. Ehrlich, vertraulich, auf Augenhöhe - online oder in Wien.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${figtree.variable} ${fraunces.variable}`}>
      <body>{children}</body>
    </html>
  );
}
