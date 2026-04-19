import Navbar          from './Navbar';
import DesktopSidebar  from './DesktopSidebar';
import MobileBottomNav from './MobileBottomNav';

/**
 * PageLayout — wraps authenticated/app pages with Navbar, DesktopSidebar,
 * and MobileBottomNav.
 */
export default function PageLayout({ children, noPadding = false }) {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <DesktopSidebar />

        <main
          className={`flex-1 overflow-y-auto ${
            noPadding ? '' : 'px-4 py-6 lg:px-8 lg:py-8'
          } pb-20 lg:pb-6`}
        >
          {children}
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}
