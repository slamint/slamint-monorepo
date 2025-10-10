import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/utils';

export enum ButtonVariant {
  DEFAULT = 'default',
  DESTRUCTIVE = 'destructive',
  OUTLINE = 'outline',
  SECONDARY = 'secondary',
  GHOST = 'ghost',
  LINK = 'link',
}

export enum ButtonSize {
  DEFAULT = 'default',
  SM = 'sm',
  LG = 'lg',
  ICON = 'icon',
}

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 focus-visible:outline-none',
  {
    variants: {
      variant: {
        [ButtonVariant.DEFAULT]:
          'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        [ButtonVariant.DESTRUCTIVE]:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        [ButtonVariant.OUTLINE]:
          'border border-input bg-background shadow-sm hover:bg-primary hover:text-primary-foreground',
        [ButtonVariant.SECONDARY]:
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        [ButtonVariant.GHOST]: 'hover:bg-primary hover:text-primary-foreground',
        [ButtonVariant.LINK]: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        [ButtonSize.DEFAULT]: 'h-9 px-4 py-2',
        [ButtonSize.SM]: 'h-8 rounded-md px-3 text-xs',
        [ButtonSize.LG]: 'h-10 rounded-md px-8',
        [ButtonSize.ICON]: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: ButtonVariant.DEFAULT,
      size: ButtonSize.DEFAULT,
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
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
