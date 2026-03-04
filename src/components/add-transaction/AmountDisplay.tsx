interface AmountDisplayProps {
  value: string
  onChange: (value: string) => void
}

export function AmountDisplay({ value, onChange }: AmountDisplayProps) {
  return (
    <div className="bg-gradient-to-b from-blue-500 to-blue-600 px-5 pt-4 pb-6">
      <p className="text-white/60 text-sm mb-1 text-center">Số tiền</p>
      <div className="flex items-center justify-center">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          className="text-center text-5xl font-bold text-white placeholder-white/40 bg-transparent focus:outline-none"
        />
        <span className="text-2xl text-white/60 ml-1">đ</span>
      </div>
    </div>
  )
}