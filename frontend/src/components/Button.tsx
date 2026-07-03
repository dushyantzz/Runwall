import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    'relative isolate inline-flex items-center justify-center gap-1 whitespace-nowrap rounded text-sm font-medium leading-5',
    'cursor-pointer overflow-hidden transition-colors',
    'hover:opacity-90',
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground',
    'disabled:pointer-events-none disabled:opacity-40',
    '[&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-primary text-inverse',
        secondary: 'bg-card text-foreground border border-[var(--border)]',
        outline: 'bg-transparent text-foreground border border-foreground',
        ghost: 'bg-transparent text-muted-foreground hover:bg-[var(--alpha-4)] hover:text-foreground',
        destructive: 'bg-destructive text-white',
      },
      size: {
        sm: 'h-7 px-2',
        default: 'h-8 px-2.5',
        lg: 'h-9 px-3',
        'icon-sm': 'size-7',
        icon: 'size-8',
        'icon-lg': 'size-9',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
