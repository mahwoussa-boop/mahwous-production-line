import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Perfume Brand AI — Campaign Generator',
  description: 'Generate stunning 3D promotional campaigns for your perfume brand with AI',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="ltr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
