import { Download } from 'lucide-react'

export default function ExportData() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-b from-blue-500 to-blue-600 px-5 pt-4 pb-6">
        <h1 className="text-xl font-semibold text-white">Xuất dữ liệu</h1>
      </div>
      
      <div className="bg-white mt-2 px-5 py-4">
        <p className="text-sm text-gray-500 mb-4">Xuất dữ liệu chi tiêu của bạn ra file</p>
        
        <div className="space-y-3">
          <button className="w-full flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Download className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-left">
              <p className="text-gray-900 font-medium">Xuất Excel (.xlsx)</p>
              <p className="text-gray-400 text-xs">Phù hợp với Google Sheets</p>
            </div>
          </button>
          
          <button className="w-full flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Download className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-left">
              <p className="text-gray-900 font-medium">Xuất CSV (.csv)</p>
              <p className="text-gray-400 text-xs">Định dạng cơ bản</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
