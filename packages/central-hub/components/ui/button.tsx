import * as React from "react";

import { Slot } from "@radix-ui/react-slot";

const Button = React.forwardRef<
  React.HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={`
        inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background
        ${className}
      `}
      ref={ref}
      {...props}
    >
      <slot />
    </Comp>
  );
});
Button.displayName = "Button";

export { Button };