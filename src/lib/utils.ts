import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, showBalance: boolean = true): string {
  if (!showBalance) return '••••••'
  return new Intl.NumberFormat('vi-VN').format(amount)
}

export const CURRENCY_SYMBOL = 'đ'
