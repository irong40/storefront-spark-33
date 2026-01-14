import { Header } from './Header';
import { Footer } from './Footer';
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-[88px] md:pt-[112px] lg:pt-[124px]">
        {children}
      </main>
      <Footer />
    </div>
  );
}
