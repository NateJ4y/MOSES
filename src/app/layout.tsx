import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MOSES // COALESCE DIGITAL OS',
  description: 'Futuristic AI command centre and operating system for Coalesce Digital',
  openGraph: {
    title: 'MOSES // COALESCE DIGITAL OS',
    description: 'Futuristic AI command centre and operating system for Coalesce Digital',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MOSES // COALESCE DIGITAL OS',
    description: 'Futuristic AI command centre and operating system for Coalesce Digital',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-zinc-900 selection:bg-black selection:text-white overflow-x-hidden antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
