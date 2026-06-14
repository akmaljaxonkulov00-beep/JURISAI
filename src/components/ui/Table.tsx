import React from 'react';
import { cn } from '@/lib/utils';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

const Table: React.FC<TableProps> = ({ children, className }) => (
  <div className="w-full overflow-auto">
    <table className={cn('w-full caption-bottom text-sm', className)}>
      {children}
    </table>
  </div>
);

interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

const TableHeader: React.FC<TableHeaderProps> = ({ children, className }) => (
  <thead className={cn('[&_tr]:border-b', className)}>
    {children}
  </thead>
);

interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

const TableBody: React.FC<TableBodyProps> = ({ children, className }) => (
  <tbody className={cn('[&_tr:last-child]:border-0', className)}>
    {children}
  </tbody>
);

interface TableFooterProps {
  children: React.ReactNode;
  className?: string;
}

const TableFooter: React.FC<TableFooterProps> = ({ children, className }) => (
  <tfoot className={cn(
    'border-t bg-muted/50 font-medium [&>tr:last-child]:border-b-0',
    className
  )}>
    {children}
  </tfoot>
);

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
}

const TableRow: React.FC<TableRowProps> = ({ children, className }) => (
  <tr className={cn(
    'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
    className
  )}>
    {children}
  </tr>
);

interface TableHeadProps {
  children: React.ReactNode;
  className?: string;
}

const TableHead: React.FC<TableHeadProps> = ({ children, className }) => (
  <th className={cn(
    'h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
    className
  )}>
    {children}
  </th>
);

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
}

const TableCell: React.FC<TableCellProps> = ({ children, className }) => (
  <td className={cn(
    'p-4 align-middle [&:has([role=checkbox])]:pr-0',
    className
  )}>
    {children}
  </td>
);

interface TableCaptionProps {
  children: React.ReactNode;
  className?: string;
}

const TableCaption: React.FC<TableCaptionProps> = ({ children, className }) => (
  <caption className={cn('text-sm text-muted-foreground mt-4', className)}>
    {children}
  </caption>
);

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
