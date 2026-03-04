import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import AuthLayout from './layouts/AuthLayout'
import MainLayout from './layouts/MainLayout'

// Auth pages
import Login from './pages/Login'
import Register from './pages/Register'

// Money Keeper pages
import Dashboard from './pages/Dashboard'
import TransactionsPage from './pages/Transactions'
import AddTransactionPage from './pages/AddTransaction'
import WalletsPage from './pages/Wallets'
import ReportsPage from './pages/Reports'
import ExpenseReportPage from './pages/ExpenseReport'
import IncomeReportPage from './pages/IncomeReport'
import BudgetsPage from './pages/Budgets'
import LanguageSettingsPage from './pages/LanguageSettings'
import CurrencySettingsPage from './pages/CurrencySettings'
import ExportDataPage from './pages/ExportData'
import PasswordSettingsPage from './pages/PasswordSettings'
import SavingsPage from './pages/Savings'

// Error pages
import NotFound from './pages/NotFound'
import ServerError from './pages/ServerError'
import Forbidden from './pages/Forbidden'

import { Toaster } from '@/components/ui/sonner'
import './App.css'

function App() {
  return (
    <>
      <Router>
        <Routes>
          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Main App Routes */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/add-transaction" element={<AddTransactionPage />} />
            <Route path="/edit-transaction/:id" element={<AddTransactionPage />} />
            <Route path="/wallets" element={<WalletsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/reports/expense" element={<ExpenseReportPage />} />
            <Route path="/reports/income" element={<IncomeReportPage />} />
            <Route path="/settings/language" element={<LanguageSettingsPage />} />
            <Route path="/settings/currency" element={<CurrencySettingsPage />} />
            <Route path="/settings/export" element={<ExportDataPage />} />
            <Route path="/settings/password" element={<PasswordSettingsPage />} />
            <Route path="/budgets" element={<BudgetsPage />} />
            <Route path="/savings" element={<SavingsPage />} />
          </Route>

          {/* Error Pages */}
          <Route path="/403" element={<Forbidden />} />
          <Route path="/500" element={<ServerError />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </>
  )
}

export default App