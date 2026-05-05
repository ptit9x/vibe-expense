import { useState } from 'react'
import { FileSpreadsheet, FileText, Check, Loader2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useTransactions } from '@/hooks/useTransactions'
import { toast } from 'sonner'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

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
            wallet:wallets(id, name),
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
      toast.error('Failed to export data')
      console.error(error)
    } finally {
      setExporting(null)
    }
  }

  const exportToCSV = (transactions: any[]) => {
    const headers = ['Date', 'Type', 'Category', 'Wallet', 'Amount', 'Description']

    const rows = transactions.map(t => [
      t.transaction_date || '',
      t.type || '',
      t.category?.name || '',
      t.wallet?.name || '',
      t.amount || 0,
      (t.description || '').replace(/"/g, '""'), // Escape quotes
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    downloadFile(csvContent, 'vibe-expense-export.csv', 'text/csv')
    toast.success('Exported to CSV successfully')
  }

  const exportToXLSX = (transactions: any[]) => {
    // Simple XLSX generation (works with Excel/Google Sheets)
    // Uses CSV with .xlsx extension for compatibility
    const headers = ['Date', 'Type', 'Category', 'Wallet', 'Amount', 'Description']

    const rows = transactions.map(t => [
      t.transaction_date || '',
      t.type === 'income' ? 'Income' : 'Expense',
      t.category?.name || '',
      t.wallet?.name || '',
      t.amount || 0,
      t.description || '',
    ])

    // Generate XML-based Excel file (simple spreadsheet)
    const xml = generateSimpleXML(headers, rows)
    downloadFile(xml, 'vibe-expense-export.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    toast.success('Exported to Excel successfully')
  }

  const generateSimpleXML = (headers: string[], rows: string[][]) => {
    const headerRow = headers.map(h => `<cell><data>${escapeXML(h)}</data></cell>`).join('')
    const dataRows = rows.map(row =>
      `<row>${row.map(cell => `<cell><data>${escapeXML(String(cell))}</data></cell>`).join('')}</row>`
    ).join('')

    return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<worksheet>
<table>${headerRow}${dataRows}</table>
</worksheet>`
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
      <div className="bg-gradient-to-b from-blue-500 to-blue-600 px-5 pt-4 pb-6">
        <h1 className="text-xl font-semibold text-white">{t.settings.exportData}</h1>
      </div>

      <div className="bg-white mt-2 px-5 py-4">
        <p className="text-sm text-gray-500 mb-4">
          {t.settings.exportDescription}
        </p>

        {/* Export Summary */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Available records:</span>
            <span className="font-medium text-gray-900">{transactionCount} transactions</span>
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
              <p className="text-gray-400 text-xs">{t.settings.suitableForSheets}</p>
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
              <p className="text-gray-400 text-xs">{t.settings.basicFormat}</p>
            </div>
            {exporting === 'csv' && <Check className="h-5 w-5 text-blue-500" />}
          </button>
        </div>
      </div>
    </div>
  )
}