import type { Metadata } from 'next';
import './globals.css';
import Monitoring from './monitoring';
export const metadata: Metadata = {
  title: 'مجمع الهبهاب | دفتر الديون',
  description: 'إدارة الزبائن والمخزون والديون لمجمع الهبهاب',
};
export const viewport = { width: 'device-width', initialScale: 1 };
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <Monitoring />
        {children}
      </body>
    </html>
  );
}
