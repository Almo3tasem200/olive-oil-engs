import type { Metadata, Viewport } from 'next';
import './globals.css';
import { CartProvider } from '@/components/cart/CartProvider';

const storeUrl = process.env.STORE_BASE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(storeUrl),
  title: {
    default: 'زيت زيتون المهندسين | El Mohandeseen Olive Oil',
    template: '%s | زيت زيتون المهندسين',
  },
  description: 'تصفّح أحجام زيت زيتون المهندسين واطلب بسهولة.',
  openGraph: {
    type: 'website',
    locale: 'ar_EG',
    alternateLocale: ['en_US'],
    siteName: 'زيت زيتون المهندسين',
    title: 'زيت زيتون المهندسين',
    description: 'تصفّح المنتجات واطلب بسهولة.',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#263326',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='ar-EG' dir='rtl'>
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}

