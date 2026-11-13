import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '晚风小院 · 田园生活',
  description: '在山与海之间，耕种、做饭、慢慢生活的治愈系田园生活游戏。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
