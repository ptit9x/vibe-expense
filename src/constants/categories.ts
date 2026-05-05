// Fixed categories for the app - use i18n keys for names/subcategories

export const CATEGORIES = {
  expense: [
    {
      id: '1',
      nameKey: 'categories.food',
      icon: '🍔',
      color: '#FF6B6B',
      subcategoryKeys: ['categories.dailyExpense', 'categories.cafe', 'categories.supermarket'],
    },
    {
      id: '2',
      nameKey: 'categories.transport',
      icon: '🚗',
      color: '#4ECDC4',
      subcategoryKeys: ['categories.fuel', 'categories.grabBike', 'categories.bus', 'categories.metro'],
    },
    {
      id: '3',
      nameKey: 'categories.housing',
      icon: '🏠',
      color: '#45B7D1',
      subcategoryKeys: ['categories.rent', 'categories.utility', 'categories.internet', 'categories.maintenance'],
    },
    {
      id: '4',
      nameKey: 'categories.entertainment',
      icon: '🎮',
      color: '#96CEB4',
      subcategoryKeys: ['categories.game', 'categories.movie', 'categories.karaoke', 'categories.travel'],
    },
    {
      id: '5',
      nameKey: 'categories.shopping',
      icon: '🛒',
      color: '#FFEAA7',
      subcategoryKeys: ['categories.clothes', 'categories.shoes', 'categories.accessories', 'categories.cosmetics'],
    },
    {
      id: '6',
      nameKey: 'categories.health',
      icon: '💊',
      color: '#DDA0DD',
      subcategoryKeys: ['categories.medical', 'categories.medicine', 'categories.vitamin', 'categories.insurance'],
    },
    {
      id: '7',
      nameKey: 'categories.other',
      icon: '📦',
      color: '#95A5A6',
      subcategoryKeys: ['categories.other'],
    },
    {
      id: '8',
      nameKey: 'categories.lend',
      icon: '💵',
      color: '#E74C3C',
      subcategoryKeys: ['categories.lending'],
    },
    {
      id: '9',
      nameKey: 'categories.children',
      icon: '👶',
      color: '#F39C12',
      subcategoryKeys: ['categories.toys', 'categories.tuition', 'categories.schoolSupplies'],
    },
  ],
  income: [
    {
      id: '101',
      nameKey: 'categories.salary',
      icon: '💰',
      color: '#2ECC71',
      subcategoryKeys: ['categories.monthlySalary', 'categories.bonus', 'categories.allowance'],
    },
    {
      id: '102',
      nameKey: 'categories.gift',
      icon: '🎁',
      color: '#9B59B6',
      subcategoryKeys: ['categories.birthday', 'categories.lunarNewYear', 'categories.otherGift'],
    },
    {
      id: '103',
      nameKey: 'categories.investment',
      icon: '📈',
      color: '#3498DB',
      subcategoryKeys: ['categories.stocks', 'categories.savings', 'categories.realEstate'],
    },
  ],
} as const

export type CategoryType = keyof typeof CATEGORIES
export type Category = typeof CATEGORIES.expense[number] | typeof CATEGORIES.income[number]

export const TRANSACTION_TYPES = [
  { id: 'expense', labelKey: 'transaction.expenseDropdown', icon: '💸' },
  { id: 'income', labelKey: 'transaction.incomeDropdown', icon: '💰' },
  { id: 'lend', labelKey: 'transaction.lend', icon: '🤝' },
  { id: 'borrow', labelKey: 'transaction.borrow', icon: '📋' },
  { id: 'transfer', labelKey: 'transaction.transfer', icon: '🔄' },
]
