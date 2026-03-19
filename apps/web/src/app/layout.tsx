import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Navbar } from '@/components/navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'DSA Suite — Master DSA, CP and GATE CSE',
    template: '%s | DSA Suite',
  },
  description:
    'Learn Data Structures, Algorithms, Competitive Programming, and GATE CSE with structured editorials, progress tracking, and a clean developer experience.',
  keywords: ['DSA', 'Data Structures', 'Algorithms', 'GATE CSE', 'Competitive Programming'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <Navbar />
          <div className="min-h-[calc(100vh-3.5rem)]">
            {children}
          </div>
          <footer className="border-t border-border py-6 mt-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
              <p>© {new Date().getFullYear()} DSA Suite. Built for deep learning.</p>
              <div className="flex items-center gap-4">
                <a href="/about" className="hover:text-foreground transition-colors">About</a>
                <a href="/contact" className="hover:text-foreground transition-colors">Contact</a>
                <a href="/dsa" className="hover:text-foreground transition-colors">DSA</a>
                <a href="/cp" className="hover:text-foreground transition-colors">CP</a>
                <a href="/gate" className="hover:text-foreground transition-colors">GATE</a>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
