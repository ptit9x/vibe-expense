interface DateFieldProps {
  value: string
  onChange: (date: string) => void
  label?: string
}

export function DateField({ value, onChange, label = 'Date' }: DateFieldProps) {
  return (
    <div className="bg-white mt-2 px-5 py-4">
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">{label}</p>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-base text-gray-700 font-medium bg-transparent focus:outline-none"
      />
    </div>
  )
}
