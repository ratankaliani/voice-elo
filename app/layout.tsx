import type { Metadata } from "next";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "Voice Arena",
  description: "Compare AI voices head-to-head",
};

// Inline script to set theme before hydration (prevents flash)
const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
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
              <ThemeToggle />
            </div>
          </div>
        </nav>
        <main className="main-content">{children}</main>
      </body>
    </html>
  );
}
