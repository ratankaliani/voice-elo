import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voice Arena",
  description: "Compare AI voices head-to-head",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <nav className="nav-bar">
          <div className="nav-inner">
            <span className="nav-title">Voice Arena</span>
            <div className="nav-links">
              <a href="/" className="nav-link">
                Battle
              </a>
              <a href="/leaderboard" className="nav-link">
                Leaderboard
              </a>
              <a href="/admin" className="nav-link">
                Admin
              </a>
            </div>
          </div>
        </nav>
        <main className="main-content">{children}</main>
      </body>
    </html>
  );
}
