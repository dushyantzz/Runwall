import { useMemo } from 'react';
import { Link, useLocation, matchPath } from 'react-router-dom';
import { PanelLeftOpen, PanelRightOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/Tooltip';
import { mainMenuItems, bottomMenuItems, type MenuItem } from '@/navigation/menuItems';

interface AppSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function AppSidebar({ isCollapsed, onToggleCollapse }: AppSidebarProps) {
  const { pathname } = useLocation();

  const activeMenu = useMemo(() => {
    const allItems = [...mainMenuItems, ...bottomMenuItems];
    return allItems.find((item) => {
      if (item.onClick || !item.href) return false;
      const shouldMatchExactly = item.href === '/dashboard';
      return !!matchPath({ path: item.href, end: shouldMatchExactly }, pathname);
    });
  }, [pathname]);

  const menuItemBaseClasses = (isActive: boolean) =>
    cn(
      'group flex items-center rounded transition-colors',
      isCollapsed ? 'h-8 w-full justify-center p-1.5' : 'h-8 w-full gap-1 p-1.5',
      isActive
        ? 'bg-toast text-foreground'
        : 'text-muted-foreground hover:bg-[var(--alpha-4)] hover:text-foreground'
    );

  const SidebarMenuItem = ({ item }: { item: MenuItem }) => {
    const isActive = item.id === activeMenu?.id;
    const itemClasses = menuItemBaseClasses(isActive);

    const content = (
      <>
        <item.icon
          className={cn(
            'h-5 w-5 shrink-0',
            isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
          )}
        />
        {!isCollapsed && (
          <span
            className={cn(
              'min-w-0 truncate px-2 text-sm font-normal leading-5',
              isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
            )}
          >
            {item.label}
          </span>
        )}
      </>
    );

    if (item.onClick) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className={itemClasses} onClick={item.onClick}>
              {content}
            </button>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right">
              <p>{item.label}</p>
            </TooltipContent>
          )}
        </Tooltip>
      );
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link to={item.href} className={itemClasses}>
            {content}
          </Link>
        </TooltipTrigger>
        {isCollapsed && (
          <TooltipContent side="right">
            <p>{item.label}</p>
          </TooltipContent>
        )}
      </Tooltip>
    );
  };

  return (
    <TooltipProvider disableHoverableContent delayDuration={300}>
      <aside
        className={cn(
          'bg-semantic-2 border-r border-[var(--alpha-8)] h-full flex flex-col flex-shrink-0 px-2 pt-3 pb-2',
          'transition-[width] duration-300 ease-in-out overflow-hidden',
          isCollapsed ? 'w-[52px]' : 'w-[200px]'
        )}
      >
        <nav className="flex min-h-0 w-full flex-col gap-1.5 overflow-y-auto overflow-x-hidden">
          {mainMenuItems.map((item) => (
            <div key={item.id}>
              <SidebarMenuItem item={item} />
              {item.sectionEnd && <div className="my-1.5 h-px w-full bg-[var(--alpha-8)]" />}
            </div>
          ))}
        </nav>

        <div className="flex-1" />

        <div className={cn('w-full', isCollapsed ? 'space-y-2' : 'space-y-1.5')}>
          {bottomMenuItems.map((item) => (
            <SidebarMenuItem key={item.id} item={item} />
          ))}
          <div className={cn('flex', isCollapsed ? 'justify-center' : 'justify-end')}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="flex items-center justify-center rounded text-muted-foreground transition-colors hover:bg-[var(--alpha-8)] hover:text-foreground h-8 w-8 p-1.5"
                >
                  {isCollapsed ? (
                    <PanelLeftOpen className="h-5 w-5" />
                  ) : (
                    <PanelRightOpen className="h-5 w-5" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{isCollapsed ? 'Expand' : 'Collapse'}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
