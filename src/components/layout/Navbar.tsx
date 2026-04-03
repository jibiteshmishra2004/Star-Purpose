import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Bell, LogOut, User, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import AdminLoginModal from '@/components/auth/AdminLoginModal';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const { isLoggedIn, role, logout, notifications } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogoClick = () => {
    const next = logoClicks + 1;
    setLogoClicks(next);
    if (next >= 5) {
      setAdminModalOpen(true);
      setLogoClicks(0);
    }
    setTimeout(() => setLogoClicks(0), 3000);
  };

  const dashboardPath = role === 'seller' ? '/seller' : role === 'admin' ? '/admin' : '/dashboard';
  const isDashboard = ['/dashboard', '/seller', '/admin'].some(p => location.pathname.startsWith(p));

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={handleLogoClick} className="flex items-center gap-2 select-none">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">★</span>
            </div>
            <span className="font-bold text-lg text-foreground">Star Purpose</span>
          </button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {!isLoggedIn ? (
              <>
                <Link to="/for-users" className="text-sm text-muted-foreground hover:text-foreground transition-colors">For Users</Link>
                <Link to="/for-sellers" className="text-sm text-muted-foreground hover:text-foreground transition-colors">For Sellers</Link>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Log In</Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            ) : (
              <>
                <Link to={dashboardPath}>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Button>
                </Link>
                <button className="relative p-2 rounded-lg hover:bg-muted transition-colors" onClick={() => navigate(dashboardPath + '?tab=notifications')}>
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <Button variant="ghost" size="sm" onClick={() => { logout(); navigate('/'); }} className="gap-2">
                  <LogOut className="w-4 h-4" /> Logout
                </Button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-border overflow-hidden bg-background"
            >
              <div className="p-4 flex flex-col gap-3">
                {!isLoggedIn ? (
                  <>
                    <Link to="/for-users" onClick={() => setMobileOpen(false)} className="py-2 text-sm">For Users</Link>
                    <Link to="/for-sellers" onClick={() => setMobileOpen(false)} className="py-2 text-sm">For Sellers</Link>
                    <Link to="/login" onClick={() => setMobileOpen(false)}><Button variant="ghost" className="w-full">Log In</Button></Link>
                    <Link to="/signup" onClick={() => setMobileOpen(false)}><Button className="w-full">Get Started</Button></Link>
                  </>
                ) : (
                  <>
                    <Link to={dashboardPath} onClick={() => setMobileOpen(false)} className="py-2 text-sm flex items-center gap-2"><LayoutDashboard className="w-4 h-4" /> Dashboard</Link>
                    <button onClick={() => { logout(); navigate('/'); setMobileOpen(false); }} className="py-2 text-sm flex items-center gap-2 text-destructive"><LogOut className="w-4 h-4" /> Logout</button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <AdminLoginModal open={adminModalOpen} onOpenChange={setAdminModalOpen} />
    </>
  );
}
