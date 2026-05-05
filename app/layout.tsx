import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";

import { AppToaster } from "@/components/ui/toast";
import "flag-icons/css/flag-icons.min.css";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Bolão da Copa",
    template: "%s | Bolão da Copa",
  },
  description:
    "Bolão privado da Copa do Mundo com cadastro aprovado por admin, palpites por fase, ranking e painel admin.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${manrope.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[color:var(--background)] text-[color:var(--text-strong)]">
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
