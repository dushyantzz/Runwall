import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

/** Routes that use the docs sidebar layout (no footer, no content-frame) */
function isDocsLayout(pathname: string): boolean {
  // The main docs sidebar page and its feature sub-pages
  // GEO docs pages (/docs/getting-started, /docs/mcp, etc.) use the
  // standard content-frame layout with footer, so we only match the
  // existing DocsPage patterns here.
  if (pathname === '/docs') return true;
  const geoDocsSlugs = ['getting-started', 'mcp', 'policies', 'risk', 'taint', 'approvals', 'audit'];
  const match = pathname.match(/^\/docs\/(.+)$/);
  if (match && !geoDocsSlugs.includes(match[1])) return true;
  return false;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const isDocs = isDocsLayout(pathname);

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
