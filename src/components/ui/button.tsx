import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold uppercase tracking-wide ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground rounded-[14px] hover:bg-primary/90 hover:shadow-[0_0_12px_hsl(110_100%_55%_/_0.6)] hover:scale-[1.02]",
        destructive: "bg-destructive text-destructive-foreground rounded-[14px] hover:bg-destructive/90",
        outline: "border border-primary/40 bg-transparent text-primary rounded-[14px] hover:bg-primary/10 hover:shadow-[0_0_12px_hsl(110_100%_55%_/_0.3)]",
        secondary: "glass text-foreground rounded-[14px] hover:border-primary/40 hover:text-primary",
        ghost: "text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-[14px]",
        link: "text-primary underline-offset-4 hover:underline",
        cyber: "bg-primary text-primary-foreground rounded-[14px] shadow-[0_0_12px_hsl(110_100%_55%_/_0.4)] hover:shadow-[0_0_20px_hsl(110_100%_55%_/_0.6),0_0_40px_hsl(110_100%_55%_/_0.3)] hover:scale-[1.02]",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
