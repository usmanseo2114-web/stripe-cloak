import * as React from "react";

import { Slot } from "@radix-ui/react-slot";

const Table = React.forwardRef<
  React.HTMLTableElement,
  React.TableHTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <table
    className={`
      w-full text-sm text-muted-foreground
      ${className}
    `}
    ref={ref}
    {...props}
  >
    <slot />
  </table>
));
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  React.HTMLTableSectionElement,
  React.TableSectionHTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    className={`
      bg-muted
      ${className}
    `}
    ref={ref}
    {...props}
  >
    <slot />
  </thead>
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  React.HTMLTableSectionElement,
  React.TableSectionHTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    className={`
      ${className}
    `}
    ref={ref}
    {...props}
  >
    <slot />
  </tbody>
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
  React.HTMLTableSectionElement,
  React.TableSectionHTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    className={`
      bg-muted
      ${className}
    `}
    ref={ref}
    {...props}
  >
    <slot />
  </tfoot>
));
TableFooter.displayName = "TableFooter";

const TableCell = React.forwardRef<
  React.HTMLTableDataCellElement,
  React.TableDataCellHTMLAttributes<HTMLTableDataCellElement>
>(({ className, ...props }, ref) => (
  <td
    className={`
      p-4 align-middle border-b border-border
      ${className}
    `}
    ref={ref}
    {...props}
  >
    <slot />
  </td>
));
TableCell.displayName = "TableCell";

const TableHead = React.forwardRef<
  React.HTMLTableHeaderCellElement,
  React.TableHeaderCellHTMLAttributes<HTMLTableHeaderCellElement>
>(({ className, ...props }, ref) => (
  <th
    className={`
      p-4 align-middle border-b border-border
      ${className}
    `}
    ref={ref}
    {...props}
  >
    <slot />
  </th>
));
TableHead.displayName = "TableHead";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableCell,
  TableHead
};