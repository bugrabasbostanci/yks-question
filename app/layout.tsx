import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { Home, Upload, Search, BarChart3 } from "lucide-react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "YKS Soru Arşivi",
  description: "YKS sınavına hazırlık için kişisel soru arşivi uygulaması",
};

const navigation = [
  { name: "Ana Sayfa", href: "/", icon: Home },
  { name: "Soru Yükle", href: "/upload", icon: Upload },
  { name: "Ara", href: "/search", icon: Search },
  { name: "İstatistikler", href: "/stats", icon: BarChart3 },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${geistSans.className} antialiased`}>
        <div className="min-h-screen bg-background">
          {/* Navigation */}
          <nav className="border-b bg-card shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <Link href="/" className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                      <span className="text-primary-foreground font-bold text-sm">
                        YKS
                      </span>
                    </div>
                    <span className="font-bold text-xl">Soru Arşivi</span>
                  </Link>
                </div>

                <div className="flex items-center space-x-1">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      >
                        <Icon className="h-4 w-4" />
                        <span className="hidden sm:block">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
