import { Inter, Rajdhani } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-rajdhani',
});

export const metadata = {
  title: 'Bảng Giá Dino — ARK Mobile Server',
  description: 'Bảng giá trao đổi Dino chính thức của server ARK Mobile. Liên hệ Admin để đặt hàng.',
  keywords: 'ARK Mobile, Dino, Bảng giá, Server, Trading',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className={`${inter.variable} ${rajdhani.variable}`}>
      <body>{children}</body>
    </html>
  );
}
