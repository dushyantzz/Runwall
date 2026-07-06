import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const isDocs = pathname.startsWith('/docs');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <Navbar />
      <div 
        className={isDocs ? "" : "content-frame"} 
        style={{ 
          marginTop: 60, 
          display: 'flex', 
          flexDirection: 'column', 
          minHeight: 'calc(100vh - 60px)',
          borderLeft: isDocs ? 'none' : undefined,
          borderRight: isDocs ? 'none' : undefined,
          maxWidth: isDocs ? 'none' : undefined,
          margin: isDocs ? '0' : undefined
        }}
      >
        <main style={{ flex: 1 }}>
          {children}
        </main>
        {!isDocs && <Footer />}
      </div>
    </>
  );
}
