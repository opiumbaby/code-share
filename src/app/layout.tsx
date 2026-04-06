import "./globals.css";
import type { ReactNode } from "react";
import Link from "next/link";
import Providers from "./providers";
import AuthStatus from "./ui/auth-status";

export const metadata = {
  title: "CodeShare",
  description: "Client-server app for code snippets",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="app">
        <Providers>
          <header className="site-header">
            <div className="header-inner">
              <div className="header-top">
                <div className="brand">
                <div className="brand-mark">CS</div>
                <div className="brand-text">
                  <span>CodeShare</span>
                </div>
              </div>
                <AuthStatus />
              </div>
              <nav className="nav">
                <Link href="/">Snippets</Link>
                <Link href="/snippets/new">Create</Link>
                <Link href="/collections">Collections</Link>
              </nav>
            </div>
          </header>
          <main className="page">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
