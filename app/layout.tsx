import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import Script from "next/script";

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

const themeInitScript = `
(function () {
  var storageKey = "bolao-theme";
  var allowedThemes = { light: true, dark: true, system: true };
  var root = document.documentElement;

  function getStoredTheme() {
    try {
      var storedTheme = window.localStorage.getItem(storageKey);
      return allowedThemes[storedTheme] ? storedTheme : "system";
    } catch (_) {
      return "system";
    }
  }

  function resolveTheme(theme) {
    if (theme !== "system") return theme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  var theme = getStoredTheme();
  var resolvedTheme = resolveTheme(theme);
  root.dataset.theme = theme;
  root.dataset.resolvedTheme = resolvedTheme;
  root.style.colorScheme = resolvedTheme;
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${manrope.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[color:var(--background)] text-[color:var(--text-strong)]">
        {children}
        <AppToaster />
        <Script
          id="bolao-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </body>
    </html>
  );
}
