import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

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
          <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
            <div className="flex-1">
              {children}
            </div>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
