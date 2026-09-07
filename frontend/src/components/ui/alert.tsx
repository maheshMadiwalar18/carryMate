import { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const alertVariants = cva('rounded-md border p-3 text-sm', {
  variants: {
    variant: {
      danger: 'border-red-200 bg-red-50 text-red-700',
      success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      info: 'border-blue-200 bg-blue-50 text-blue-700',
      warning: 'border-orange-200 bg-orange-50 text-orange-700',
    },
  },
  defaultVariants: { variant: 'info' },
});

export interface AlertProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {}

export function Alert({ className, variant, ...props }: AlertProps) {
  return <div className={cn(alertVariants({ variant }), className)} {...props} />;
}
