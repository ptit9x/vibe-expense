interface DescriptionFieldProps {
  value: string
  onChange: (text: string) => void
  placeholder?: string
}

export function DescriptionField({ value, onChange, placeholder = 'Add a note...' }: DescriptionFieldProps) {
  return (
    <div className="bg-white mt-2 px-5 py-4">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full py-3 text-base text-gray-700 placeholder-gray-300 bg-transparent border-b border-gray-100 focus:outline-none focus:border-blue-400"
      />
    </div>
  )
}
