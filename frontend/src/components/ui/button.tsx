import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-navy-900 text-white hover:bg-navy-800 focus-visible:ring-navy-700',
        accent: 'bg-orange-600 text-white hover:bg-orange-500 focus-visible:ring-orange-500',
        outline: 'border border-border-subtle bg-white text-navy-900 hover:bg-surface-muted',
        ghost: 'text-navy-900 hover:bg-surface-muted',
        success: 'bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:ring-emerald-500',
        danger: 'bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-500',
        link: 'text-navy-700 underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
));
Button.displayName = 'Button';
