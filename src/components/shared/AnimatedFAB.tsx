import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { motion } from 'framer-motion'

interface AnimatedFABProps {
  to: string
  ariaLabel: string
  className?: string
}

export function AnimatedFAB({ to, ariaLabel, className }: AnimatedFABProps) {
  return (
    <Link to={to} aria-label={ariaLabel} className={className}>
      <motion.div
        className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30"
        whileTap={{ scale: 0.85 }}
        whileHover={{ scale: 1.08, boxShadow: '0 10px 35px rgba(99,102,241,0.4)' }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      >
        {/* Idle pulse ring */}
        <motion.div
          className="absolute inset-0 rounded-full bg-indigo-400/30"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <Plus className="relative z-10 h-7 w-7 text-white" />
      </motion.div>
    </Link>
  )
}
