import { useCallback, useRef, useState } from 'react'

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>
  threshold?: number
}

interface UsePullToRefreshReturn {
  isPulling: boolean
  isRefreshing: boolean
  pullDistance: number
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void
    onTouchMove: (e: React.TouchEvent) => void
    onTouchEnd: () => void
  }
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [isPulling, setIsPulling] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)

  const startY = useRef(0)
  const currentY = useRef(0)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    // Only activate when scrolled to top
    if (window.scrollY > 0) return
    startY.current = e.touches[0].clientY
    currentY.current = startY.current
  }, [])

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (isRefreshing) return
      if (window.scrollY > 0) {
        setIsPulling(false)
        setPullDistance(0)
        return
      }

      currentY.current = e.touches[0].clientY
      const distance = currentY.current - startY.current

      if (distance > 0) {
        setIsPulling(true)
        // Apply rubber-band resistance
        const resistance = 0.4
        const pulled = Math.min(distance * resistance, threshold * 1.5)
        setPullDistance(pulled)
      }
    },
    [isRefreshing, threshold]
  )

  const onTouchEnd = useCallback(async () => {
    if (!isPulling) return

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true)
      setPullDistance(threshold)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
        setIsPulling(false)
      }
    } else {
      setPullDistance(0)
      setIsPulling(false)
    }
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh])

  return {
    isPulling,
    isRefreshing,
    pullDistance,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  }
}
