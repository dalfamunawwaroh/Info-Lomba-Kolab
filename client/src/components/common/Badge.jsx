import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring",
  {
    variants: {
      variant: {
        default: "border-purple-500/30 bg-purple-500/20 text-purple-300",
        secondary: "border-slate-700 bg-slate-800/80 text-slate-300",
        destructive: "border-rose-500/30 bg-rose-500/20 text-rose-300",
        outline: "border-white/10 text-slate-200",
        success: "border-emerald-500/30 bg-emerald-500/20 text-emerald-300",
        warning: "border-amber-500/30 bg-amber-500/20 text-amber-300",
        info: "border-blue-500/30 bg-blue-500/20 text-blue-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
