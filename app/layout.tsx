import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import { LocaleProvider } from "@/lib/locale-context";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ServiceWorkerRegister } from "@/components/sw-register";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Barbell Calculator",
  description: "Calculate your barbell weights",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased relative min-h-screen`}>
        <div className="fixed inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(#d1d5db_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#ffffff0a_1px,transparent_1px)]">
          <div className="absolute top-[-10%] left-[-10%] -z-10 h-[400px] w-[400px] rounded-full bg-primary/10 blur-[150px]" />
          <div className="absolute bottom-[-10%] right-[-10%] -z-10 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[150px]" />
        </div>
        <ServiceWorkerRegister />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <LocaleProvider>
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container mx-auto flex h-14 items-center justify-end gap-2 px-4">
                <LocaleSwitcher />
                <ModeToggle />
              </div>
            </header>

            {children}
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
