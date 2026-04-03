import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Notification } from '@/data/mockData';

type Props = {
  notifications: Notification[];
  markNotificationRead: (id: string) => void;
  viewAllHref: string | null;
  unreadCount: number;
};

export function NotificationsPopover({
  notifications,
  markNotificationRead,
  viewAllHref,
  unreadCount,
}: Props) {
  const recent = notifications.slice(0, 8);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <p className="text-sm font-semibold text-foreground">Notifications</p>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground">{unreadCount} new</span>
          )}
        </div>
        <ScrollArea className="h-[min(320px,50vh)]">
          {recent.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className={cn(
                      'w-full px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/80',
                      !n.read && 'bg-primary/5',
                    )}
                    onClick={() => markNotificationRead(n.id)}
                  >
                    <p className="font-medium text-foreground">{n.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{n.time}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
        {viewAllHref && (
          <div className="border-t border-border p-2">
            <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
              <Link to={viewAllHref}>View all activity</Link>
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
