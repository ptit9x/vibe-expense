import { cn } from "@/lib/utils"
import { type ReactNode } from "react"

type PageHeaderProps = {
  children: ReactNode
  className?: string
}

export default function PageHeader({ children, className }: PageHeaderProps) {
  return (
    <div className={cn(
      "clay-header relative overflow-hidden px-5 pt-6 pb-8 rounded-b-[2rem] lg:rounded-br-[2.5rem]",
      className
    )}>
      {/* Soft glow accents */}
      <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/15 rounded-full blur-3xl" />
      <div className="absolute -bottom-10 -left-6 w-32 h-32 bg-purple-300/20 rounded-full blur-3xl" />
      <div className="absolute top-12 right-20 w-24 h-24 bg-violet-200/15 rounded-full blur-2xl" />
      {/* Subtle inner highlight (top edge) */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
