import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Paired Comments Demo Playground',
  description: 'Interactive demo for the Paired Comments VS Code extension',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-github-canvas-default text-github-fg-default font-mono">
        {children}
      </body>
    </html>
  );
}
