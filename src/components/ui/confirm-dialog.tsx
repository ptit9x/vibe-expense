import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
  onConfirm: () => void
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[320px] rounded-2xl p-6 gap-4">
        <DialogHeader className="gap-2">
          <DialogTitle className="text-lg text-gray-900">{title}</DialogTitle>
          <DialogDescription className="text-sm text-gray-500 leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row gap-3 sm:gap-3">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 h-11 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 active:scale-[0.98] transition-all"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
            className={`flex-1 h-11 rounded-xl text-sm font-semibold text-white active:scale-[0.98] transition-all ${
              variant === 'destructive'
                ? 'bg-red-500 hover:bg-red-600 shadow-sm shadow-red-200'
                : 'bg-blue-500 hover:bg-blue-600 shadow-sm shadow-blue-200'
            }`}
          >
            {confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
