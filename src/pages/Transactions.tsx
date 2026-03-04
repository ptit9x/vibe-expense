import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { useTransactions } from '@/hooks/useTransactions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export default function Transactions() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [searchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all')
  const { data: transactions, isLoading } = useTransactions(month)

  const filteredTransactions = transactions?.filter(t => {
    const matchesSearch = !searchQuery || 
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === 'all' || t.type === typeFilter
    return matchesSearch && matchesType
  })

  const totalIncome = filteredTransactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) || 0
  const totalExpense = filteredTransactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) || 0

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Giao dịch</h1>
          <p className="text-muted-foreground">Quản lý thu chi hàng ngày</p>
        </div>
        <Button asChild>
          <Link to="/add-transaction">
            <Plus className="mr-2 h-4 w-4" />
            Thêm giao dịch
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">Tất cả</option>
          <option value="income">Thu nhập</option>
          <option value="expense">Chi tiêu</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng thu</CardTitle>
            <span className="text-green-500">📈</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat('vi-VN').format(totalIncome)} ₫
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng chi</CardTitle>
            <span className="text-red-500">📉</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {new Intl.NumberFormat('vi-VN').format(totalExpense)} ₫
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Còn lại</CardTitle>
            <span className="text-blue-500">💰</span>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              totalIncome - totalExpense >= 0 ? "text-blue-600" : "text-red-600"
            )}>
              {new Intl.NumberFormat('vi-VN').format(totalIncome - totalExpense)} ₫
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách giao dịch</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
          ) : filteredTransactions?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Chưa có giao dịch nào trong tháng này
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTransactions?.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                      style={{ backgroundColor: transaction.category?.color + '20' }}
                    >
                      {transaction.category?.icon || '💰'}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description || transaction.category?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.category?.name} • {transaction.wallet?.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "font-bold",
                      transaction.type === 'income' ? "text-green-600" : "text-red-600"
                    )}>
                      {transaction.type === 'income' ? '+' : '-'}{new Intl.NumberFormat('vi-VN').format(transaction.amount)} ₫
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(transaction.transaction_date).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}