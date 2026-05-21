import * as React from "react";

import { Slot } from "@radix-ui/react-slot";

const Badge = React.forwardRef<
  React.HTMLSpanElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, variant = "default", asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "span";
  return (
    <Comp
      className={`
        inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none border-border
        ${className}
      `}
      ref={ref}
      {...props}
    >
      <slot />
    </Comp>
  );
});
Badge.displayName = "Badge";

export { Badge };