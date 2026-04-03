import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogOut, LayoutDashboard, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { NotificationsPopover } from '@/components/layout/NotificationsPopover';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isLoggedIn, role, logout, notifications, markNotificationRead } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const viewAllHref =
    role === 'user'
      ? '/dashboard?tab=notifications'
      : role === 'seller'
        ? '/seller?tab=notifications'
        : null;

  const mainActive =
    role === 'user'
      ? location.pathname.startsWith('/dashboard')
      : role === 'seller'
        ? location.pathname.startsWith('/seller')
        : location.pathname.startsWith('/admin');

  return (
    <nav className="glass-nav fixed left-0 right-0 top-0 z-50">
      <div className="container mx-auto flex h-[4.25rem] items-center px-4">
        <Link
          to="/"
          className="flex shrink-0 select-none items-center gap-3 transition-opacity hover:opacity-90"
          title="Star Purpose — Home"
        >
          <img
            src="/star-purpose-logo.png"
            alt="Star Purpose"
            className="h-9 w-auto max-h-11 max-w-[min(100%,200px)] object-contain object-left md:h-10"
          />
        </Link>

        <div className="hidden flex-1 items-center justify-end gap-1 md:flex">
          {!isLoggedIn ? (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  Log In
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm" className="gradient-primary text-primary-foreground shadow-sm">
                  Get Started
                </Button>
              </Link>
              <span className="mx-2 hidden h-5 w-px bg-border sm:block" aria-hidden />
              <Link to="/admin-signin">
                <Button variant="outline" size="sm" className="gap-1.5 border-primary/25 text-primary hover:bg-primary/5">
                  <Shield className="h-3.5 w-3.5" /> Admin
                </Button>
              </Link>
            </>
          ) : (
            <>
              {role === 'user' && (
                <Link to="/dashboard">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'gap-2 text-muted-foreground',
                      mainActive && 'bg-muted text-foreground',
                    )}
                  >
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Button>
                </Link>
              )}
              {role === 'seller' && (
                <Link to="/seller">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'gap-2 text-muted-foreground',
                      mainActive && 'bg-muted text-foreground',
                    )}
                  >
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Button>
                </Link>
              )}
              {role === 'admin' && (
                <Link to="/admin">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'gap-2 text-muted-foreground',
                      mainActive && 'bg-muted text-foreground',
                    )}
                  >
                    <LayoutDashboard className="h-4 w-4" /> Admin
                  </Button>
                </Link>
              )}
              {role !== 'admin' && (
                <NotificationsPopover
                  notifications={notifications}
                  markNotificationRead={markNotificationRead}
                  viewAllHref={viewAllHref}
                  unreadCount={unreadCount}
                />
              )}
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
              >
                <LogOut className="h-4 w-4" /> Logout
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="ml-auto p-2 md:ml-0 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border bg-background md:hidden"
          >
            <div className="flex flex-col gap-2 p-4">
              {!isLoggedIn ? (
                <>
                  <Link to="/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" className="w-full">
                      Log In
                    </Button>
                  </Link>
                  <Link to="/signup" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full gradient-primary text-primary-foreground">Get Started</Button>
                  </Link>
                  <div className="my-1 border-t border-border" />
                  <Link to="/admin-signin" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full gap-2 border-primary/25 text-primary">
                      <Shield className="h-4 w-4" /> Admin
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  {role === 'user' && (
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 py-2 text-sm"
                    >
                      <LayoutDashboard className="h-4 w-4" /> Dashboard
                    </Link>
                  )}
                  {role === 'seller' && (
                    <Link to="/seller" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 py-2 text-sm">
                      <LayoutDashboard className="h-4 w-4" /> Dashboard
                    </Link>
                  )}
                  {role === 'admin' && (
                    <Link to="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 py-2 text-sm">
                      <LayoutDashboard className="h-4 w-4" /> Admin
                    </Link>
                  )}
                  {role !== 'admin' && (
                    <div className="flex items-center justify-between border-t border-border pt-2">
                      <span className="text-xs text-muted-foreground">Notifications</span>
                      <NotificationsPopover
                        notifications={notifications}
                        markNotificationRead={markNotificationRead}
                        viewAllHref={viewAllHref}
                        unreadCount={unreadCount}
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      navigate('/');
                      setMobileOpen(false);
                    }}
                    className="flex items-center gap-2 py-2 text-sm text-destructive"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
