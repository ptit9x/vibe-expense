import { cn } from "@/lib/utils"
import { type ReactNode } from "react"

type PageHeaderProps = {
  children: ReactNode
  className?: string
}

export default function PageHeader({ children, className }: PageHeaderProps) {
  return (
    <div className={cn("relative overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 px-5 pt-4 pb-6", className)}>
      {/* Decorative mesh gradient circles */}
      <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute -bottom-8 -left-4 w-24 h-24 bg-pink-300/20 rounded-full blur-2xl" />
      <div className="absolute top-8 right-16 w-20 h-20 bg-violet-300/15 rounded-full blur-xl" />
      <div className="absolute bottom-2 right-6 w-12 h-12 bg-indigo-200/10 rounded-full blur-lg" />
      {/* Subtle mesh line */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08),transparent_50%)]" />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
