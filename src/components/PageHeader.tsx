import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

type PageHeaderProps = {
  children: ReactNode;
  className?: string;
};

export default function PageHeader({ children, className }: PageHeaderProps) {
  return (
    <div className={cn("bg-linear-to-b from-blue-500 to-blue-600 px-5 pt-4 pb-6", className)}>
      {children}
    </div>
  );
}
