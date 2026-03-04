import { DollarSign } from 'lucide-react'

export default function CurrencySettings() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-b from-blue-500 to-blue-600 px-5 pt-4 pb-6">
        <h1 className="text-xl font-semibold text-white">Thiết lập tiền tệ</h1>
      </div>
      
      <div className="bg-white mt-2 px-5 py-4">
        <p className="text-sm font-medium text-gray-500 mb-3">Chọn đơn vị tiền tệ</p>
        <div className="space-y-3">
          <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-green-500" />
              <span className="text-gray-900 font-medium">VND - Vietnamese Dong</span>
            </div>
            <span className="text-blue-500">✓</span>
          </button>
          <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-lg">$</span>
              <span className="text-gray-900 font-medium">USD - US Dollar</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
