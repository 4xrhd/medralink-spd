import React, { type ReactNode, type TdHTMLAttributes, type ThHTMLAttributes } from "react";
import { cn } from "../utils/cn.js";

/* One table style for data lists: scrolls sideways on small screens, quiet header, hairline rows. */

export interface DataTableProps {
  children: ReactNode;
  /** Narrowest width before the table scrolls horizontally, e.g. "min-w-[640px]". */
  minWidth?: string;
  caption?: string;
  className?: string;
}

export function DataTable({ children, minWidth = "min-w-[640px]", caption, className }: DataTableProps) {
  return (
    <div className="overflow-x-auto">
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

export function Td({ className, children, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn("px-6 py-3.5 align-middle text-ink-900", className)} {...props}>
      {children}
    </td>
  );
}

export function Tr({ className, children }: { className?: string; children: ReactNode; key?: React.Key }) {
  return <tr className={cn("transition-colors hover:bg-canvas/60", className)}>{children}</tr>;
}
