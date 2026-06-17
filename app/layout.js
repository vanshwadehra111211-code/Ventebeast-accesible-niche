import './globals.css';
import Providers from '@/components/Providers';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'VENTEBEAST — Accessibilis Niche Perfumery',
  description: 'Luxury niche perfumery. Composed in small batches with the finest naturals. Worn slowly. Remembered always.',
  openGraph: {
    title: 'VENTEBEAST — Accessibilis Niche Perfumery',
    description: 'Luxury niche perfumery composed in small batches.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        <Providers>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
