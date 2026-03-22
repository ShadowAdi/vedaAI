import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SocketProvider } from '@/components/providers/SocketProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'VedaAI - AI Assessment Creator',
  description: 'Create intelligent assessments with AI-powered question generation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SocketProvider>
          {children}
        </SocketProvider>
      </body>
    </html>
  );
}