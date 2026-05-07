import { useState } from 'react'
import { FileSpreadsheet, FileText, Check, Loader2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useTransactions } from '@/hooks/useTransactions'
import { toast } from 'sonner'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import PageHeader from '@/components/PageHeader'

type ExportFormat = 'csv' | 'xlsx'

export default function ExportData() {
  const { t } = useI18n()
  const [exporting, setExporting] = useState<ExportFormat | null>(null)

  // Fetch all transactions for export
  const { data: transactions } = useTransactions()

  const handleExport = async (format: ExportFormat) => {
    setExporting(format)

    try {
      if (isSupabaseConfigured()) {
        // Fetch all transactions for export (no month filter)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { data: allTransactions, error } = await supabase
          .from('transactions')
          .select(`
            id,
            amount,
            type,
            description,
            transaction_date,
            created_at,
            wallet:wallets!transactions_wallet_id_fkey(id, name),
            category:categories(id, name, icon)
          `)
          .eq('user_id', user.id)
          .order('transaction_date', { ascending: false })

        if (error) throw error

        if (format === 'csv') {
          exportToCSV(allTransactions || [])
        } else {
          exportToXLSX(allTransactions || [])
        }
      } else {
        // Use mock data for development
        exportToCSV([])
      }
    } catch (error) {
      toast.error(t.settings.exportFailed)
      console.error(error)
    } finally {
      setExporting(null)
    }
  }

  interface ExportTransaction {
    transaction_date?: string
    type?: string
    category?: { name?: string } | { name?: string }[] | null
    wallet?: { name?: string } | { name?: string }[] | null
    amount?: number
    description?: string
  }

  const getCategoryName = (cat: ExportTransaction['category']): string => {
    if (!cat) return ''
    if (Array.isArray(cat)) return cat[0]?.name || ''
    return cat.name || ''
  }

  const getWalletName = (wallet: ExportTransaction['wallet']): string => {
    if (!wallet) return ''
    if (Array.isArray(wallet)) return wallet[0]?.name || ''
    return wallet.name || ''
  }

  const exportToCSV = (transactions: ExportTransaction[]) => {
    const headers = ['Date', 'Type', 'Category', 'Wallet', 'Amount', 'Description']

    const rows = transactions.map(t => [
      t.transaction_date || '',
      t.type || '',
      getCategoryName(t.category),
      getWalletName(t.wallet),
      String(t.amount || 0),
      (t.description || '').replace(/"/g, '""'), // Escape quotes
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    downloadFile(csvContent, 'vibe-expense-export.csv', 'text/csv')
    toast.success(t.settings.exportSuccess)
  }

  const exportToXLSX = (transactions: ExportTransaction[]) => {
    // Generate proper HTML table that Excel can open natively
    const headers = ['Date', 'Type', 'Category', 'Wallet', 'Amount', 'Description']

    const rows = transactions.map(t => [
      t.transaction_date || '',
      t.type === 'income' ? 'Income' : t.type === 'transfer' ? 'Transfer' : 'Expense',
      getCategoryName(t.category),
      getWalletName(t.wallet),
      String(t.amount || 0),
      t.description || '',
    ])

    const html = generateExcelHTML(headers, rows)
    downloadFile(html, 'vibe-expense-export.xls', 'application/vnd.ms-excel')
    toast.success(t.settings.exportSuccess)
  }

  const generateExcelHTML = (headers: string[], rows: string[][]) => {
    const headerCells = headers.map(h => `<th style="font-weight:bold;background:#f0f0f0;padding:4px 8px">${escapeXML(h)}</th>`).join('')
    const dataRows = rows.map(row =>
      `<tr>${row.map(cell => `<td style="padding:4px 8px">${escapeXML(String(cell))}</td>`).join('')}</tr>`
    ).join('')

    return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Transactions</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
<body><table>${headerCells}${dataRows}</table></body></html>`
  }

  const escapeXML = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const transactionCount = transactions?.length || 0

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <PageHeader>
        <h1 className="text-xl font-semibold text-white">{t.settings.exportData}</h1>
      </PageHeader>

      <div className="bg-white mt-2 px-5 py-4">
        <p className="text-sm text-gray-500 mb-4">
          {t.settings.exportDescription}
        </p>

        {/* Export Summary */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">{t.settings.availableRecords}</span>
            <span className="font-medium text-gray-900">{transactionCount} {t.settings.transactions}</span>
          </div>
        </div>

        <div className="space-y-3">
          {/* Excel Export */}
          <button
            onClick={() => handleExport('xlsx')}
            disabled={exporting !== null}
            className="w-full flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {exporting === 'xlsx' ? (
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
              </div>
            ) : (
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <FileSpreadsheet className="h-5 w-5 text-green-500" />
              </div>
            )}
            <div className="text-left flex-1">
              <p className="text-gray-900 font-medium">{t.settings.exportExcel}</p>
              <p className="text-gray-400 text-sm">{t.settings.suitableForSheets}</p>
            </div>
            {exporting === 'xlsx' && <Check className="h-5 w-5 text-blue-500" />}
          </button>

          {/* CSV Export */}
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting !== null}
            className="w-full flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {exporting === 'csv' ? (
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
              </div>
            ) : (
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
            )}
            <div className="text-left flex-1">
              <p className="text-gray-900 font-medium">{t.settings.exportCSV}</p>
              <p className="text-gray-400 text-sm">{t.settings.basicFormat}</p>
            </div>
            {exporting === 'csv' && <Check className="h-5 w-5 text-blue-500" />}
          </button>
        </div>
      </div>
    </div>
  )
}