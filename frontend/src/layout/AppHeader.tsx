import { Sun, Moon, ChevronDown, LogOut } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';
import { Button } from '@/components/Button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/DropdownMenu';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import { cn } from '@/lib/utils';

function Separator({ className, orientation = 'vertical' }: { className?: string; orientation?: 'horizontal' | 'vertical' }) {
  return (
    <SeparatorPrimitive.Root
      orientation={orientation}
      className={cn(
        'shrink-0 bg-[var(--alpha-8)]',
        orientation === 'vertical' ? 'w-px' : 'h-px',
        className
      )}
    />
  );
}

export default function AppHeader() {
  const { theme, toggleTheme } = useTheme();

  const getUserInitials = (label: string) => {
    const parts = label.split(' ');
    if (parts.length > 1) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return label.substring(0, 2).toUpperCase();
  };

  return (
    <div className="h-12 w-full bg-semantic-2 border-b border-[var(--alpha-8)] z-50 flex items-center justify-between px-6">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded bg-primary flex items-center justify-center">
            <span className="text-inverse text-xs font-bold">EG</span>
          </div>
          <span className="text-sm font-semibold text-foreground hidden md:block">
            Execution Governance
          </span>
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-1">
        {/* GitHub */}
        <a
          href="https://github.com/dushyantzz/Execution-Governance-Platform-for-AI-Agents"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 p-2 text-muted-foreground hover:text-foreground transition-colors duration-200"
          aria-label="GitHub"
        >
          <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
        </a>

        <Separator className="h-5 mx-2" orientation="vertical" />

        {/* Theme Toggle */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={toggleTheme}
          className="text-muted-foreground"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Separator className="h-5 mx-2" orientation="vertical" />

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 hover:bg-[var(--alpha-4)] rounded-lg pr-3 transition-all duration-200 group">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center ring-2 ring-semantic-0 shadow-sm">
                <span className="text-inverse text-xs font-medium">
                  {getUserInitials('Admin User')}
                </span>
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-foreground leading-tight">Admin</p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block ml-auto" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48" sideOffset={8}>
            <DropdownMenuItem className="cursor-pointer text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
