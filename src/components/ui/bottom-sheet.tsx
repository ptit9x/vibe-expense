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
    <div className="fixed inset-0 z-[60] bg-black/50" onClick={handleClose}>
      <div
        className="absolute bottom-20 left-0 right-0 bg-white rounded-t-3xl p-5 pb-8 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center mb-3">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {children}

        {/* Submit Button */}
        {submitLabel && onSubmit && (
          <Button
            type="submit"
            onClick={onSubmit}
            disabled={submitDisabled || isPending}
            className="w-full h-12 text-base font-medium mt-4"
          >
            {isPending ? "Saving..." : submitLabel}
          </Button>
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
      <label className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2 block">
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
    <div className="flex flex-wrap gap-2">
      {options.map((icon) => (
        <button
          key={icon}
          type="button"
          onClick={() => onChange(icon)}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all",
            value === icon
              ? "bg-blue-500 ring-2 ring-blue-300"
              : "bg-gray-100 hover:bg-gray-200"
          )}
        >
          {icon}
        </button>
      ))}
    </div>
  )
}

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  options: string[]
}

export function ColorPicker({ value, onChange, options }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={cn(
            "w-10 h-10 rounded-full transition-all",
            value === color ? "ring-2 ring-offset-2 ring-gray-400" : ""
          )}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  )
}

export { Button, Input }