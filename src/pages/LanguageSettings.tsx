export default function LanguageSettings() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-b from-blue-500 to-blue-600 px-5 pt-4 pb-6">
        <h1 className="text-xl font-semibold text-white">Ngôn ngữ</h1>
      </div>
      
      <div className="bg-white mt-2 px-5 py-4">
        <p className="text-sm font-medium text-gray-500 mb-3">Chọn ngôn ngữ</p>
        <div className="space-y-3">
          <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <span className="text-gray-900 font-medium">Tiếng Việt</span>
            <span className="text-blue-500">✓</span>
          </button>
          <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <span className="text-gray-900 font-medium">English</span>
          </button>
        </div>
      </div>
    </div>
  )
}
