import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Input } from "./input"

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  isPending?: boolean
  submitLabel?: string
  onSubmit?: (e: React.FormEvent) => void
  submitDisabled?: boolean
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  isPending,
  submitLabel,
  onSubmit,
  submitDisabled,
}: BottomSheetProps) {
  if (!isOpen) return null

  const handleClose = () => {
    onClose()
  }

  return (
    <div className="fixed inset-0 z-60 bg-black/50" onClick={handleClose}>
      <div
        className="absolute bottom-20 left-0 right-0 clay-card rounded-t-[2rem] rounded-b-3xl animate-slide-up flex flex-col mx-2"
        style={{ maxHeight: '70vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <button
            onClick={handleClose}
            className="p-2 clay-button rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-5 flex-1 overscroll-contain">
          {children}
        </div>

        {/* Submit Button */}
        {submitLabel && onSubmit && (
          <div className="px-5 pb-6 pt-3 shrink-0">
            <Button
              type="submit"
              onClick={onSubmit}
              disabled={submitDisabled || isPending}
              className="w-full h-12 text-base font-medium"
            >
              {isPending ? "Saving..." : submitLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

interface BottomSheetFormFieldProps {
  label: string
  children: React.ReactNode
}

export function BottomSheetFormField({ label, children }: BottomSheetFormFieldProps) {
  return (
    <div className="mb-4">
      <label className="text-sm text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide mb-2 block">
        {label}
      </label>
      {children}
    </div>
  )
}

interface IconPickerProps {
  value: string
  onChange: (icon: string) => void
  options: string[]
}

export function IconPicker({ value, onChange, options }: IconPickerProps) {
  return (
    <div className="flex gap-3">
      {/* Selected preview */}
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 bg-blue-50 dark:bg-blue-900/30 sticky top-0 self-start">
        {value}
      </div>
      <div className="flex flex-wrap gap-1">
        {options.map((icon) => (
          <button
            key={icon}
            type="button"
            onClick={() => onChange(icon)}
            className={cn(
              "w-11 h-11 rounded-lg flex items-center justify-center text-base transition-all",
              value === icon
                ? "bg-blue-500 text-white shadow-sm"
                : "bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20"
            )}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  )
}

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  options: string[]
  previewIcon?: string
}

export function ColorPicker({ value, onChange, options, previewIcon = '📦' }: ColorPickerProps) {
  return (
    <div className="flex gap-3">
      {/* Selected preview */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 sticky top-0 self-start"
        style={{ backgroundColor: value + '20' }}
      >
        {previewIcon}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={cn(
              "w-11 h-11 rounded-lg flex items-center justify-center text-xs text-white font-bold transition-all",
              value === color ? "ring-2 ring-offset-1 ring-gray-400 dark:ring-gray-500 dark:ring-offset-[hsl(224,30%,11%)] scale-110" : ""
            )}
            style={{ backgroundColor: color }}
          >
            {value === color ? '✓' : ''}
          </button>
        ))}
      </div>
    </div>
  )
}

export { Button, Input }
