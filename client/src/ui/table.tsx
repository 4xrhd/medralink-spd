import React, { type ReactNode, type TdHTMLAttributes, type ThHTMLAttributes } from "react";
import { cn } from "../utils/cn.js";

/* One table style for data lists: scrolls sideways on small screens, quiet header, hairline rows. */

export interface DataTableProps {
  children: ReactNode;
  /** Narrowest width before the table scrolls horizontally, e.g. "min-w-[640px]". */
  minWidth?: string;
  caption?: string;
  className?: string;
  /** Below 1024px, show each row as a labelled card instead of scrolling sideways. Label cells with Td's `label`. */
  stack?: boolean;
}

export function DataTable({ children, minWidth = "min-w-[640px]", caption, className, stack = false }: DataTableProps) {
  return (
    // Focusable so keyboard users can scroll it; the edge shadows show there is more to the side
    <div className={cn("scroll-shadow-x relative overflow-x-auto", stack && "table-stack")} tabIndex={0} role="region" aria-label={caption}>
      <table className={cn("w-full text-sm", minWidth, className)}>
        {caption && <caption className="sr-only">{caption}</caption>}
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="border-y border-hair bg-canvas text-left">{children}</thead>;
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-hair">{children}</tbody>;
}

export function Th({ className, children, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th scope="col" className={cn("px-6 py-3 text-xs font-semibold text-ink-600", className)} {...props}>
      {children}
    </th>
  );
}

export interface TdProps extends TdHTMLAttributes<HTMLTableCellElement> {
  /** Column name shown above the value when a stacked table renders rows as cards. */
  label?: string;
  /** In stacked mode, let this cell take the full card width. */
  wide?: boolean;
}

export function Td({ className, children, label, wide, ...props }: TdProps) {
  return (
    <td
      className={cn("px-6 py-3.5 align-middle text-ink-900", className)}
      data-label={label}
      data-wide={wide || undefined}
      {...props}
    >
      {children}
    </td>
  );
}

export function Tr({ className, children }: { className?: string; children: ReactNode; key?: React.Key }) {
  return <tr className={cn("transition-colors hover:bg-canvas/60", className)}>{children}</tr>;
}
