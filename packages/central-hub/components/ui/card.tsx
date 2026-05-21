import * as React from "react";

import { CardContent as PrimitiveCardContent } from "@/components/ui/card-content";
import { CardDescription as PrimitiveCardDescription } from "@/components/ui/card-description";
import { CardFooter as PrimitiveCardFooter } from "@/components/ui/card-footer";
import { CardHeader as PrimitiveCardHeader } from "@/components/ui/card-header";
import { CardTitle as PrimitiveCardTitle } from "@/components/ui/card-title";

const Card = React.forwardRef<
  React.HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    className={`
      rounded-lg border bg-card text-card-foreground shadow-sm
      ${className}
   `}
    ref={ref>
      <slot />
    </div>
  )
);
Card.displayName = PrimitiveCard.displayName;

const CardHeader = React.forwardRef<
  React.HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    className={`
      flex flex-col space-y-1.5 p-6
      ${className}
   `}
    ref={ref}
    {...props}
  >
    <slot />
  </div>
));
CardHeader.displayName = PrimitiveCardHeader.displayName;

const CardTitle = React.forwardRef<
  React.HTMLHeadingElement,
  React.ComponentPropsWithoutRef<"h2">
>(({ className, ...props }, ref) => (
  <h2
    className={`
      text-lg font-semibold leading-none tracking-tight
      ${className}
   `}
    ref={ref}
    {...props}
  >
    <slot />
  </h2>
));
CardTitle.displayName = PrimitiveCardTitle.displayName;

const CardDescription = React.forwardRef<
  React.HTMLParagraphElement,
  React.ComponentPropsWithoutRef<"p">
>(({ className, ...props }, ref) => (
  <p
    className={`
      text-sm text-muted-foreground
      ${className}
    %}
    ref={ref}
    {...props}
  >
    <slot />
  </p>
));
CardDescription.displayName = PrimitiveCardDescription.displayName;

const CardContent = React.forwardRef<
  React.HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    className={`
      p-6 pt-0
      ${className}
    %}
    ref={ref}
    {...props}
  >
    <slot />
  </div>
));
CardContent.displayName = PrimitiveCardContent.displayName;

const CardFooter = React.forwardRef<
  React.HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    className={`
      flex items-center p-6 pt-0
      ${className}
    %}
    ref={ref}
    {...props}
  >
    <slot />
  </div>
));
CardFooter.displayName = PrimitiveCardFooter.displayName;

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };