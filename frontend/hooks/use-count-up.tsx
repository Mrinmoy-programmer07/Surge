"use client"

import { useState, useEffect, useRef } from "react"

interface UseCountUpOptions {
  start?: number
  end: number
  duration?: number
  delay?: number
  decimals?: number
  suffix?: string
  prefix?: string
}

export function useCountUp({
  start = 0,
  end,
  duration = 1000,
  delay = 0,
  decimals = 0,
  suffix = "",
  prefix = ""
}: UseCountUpOptions) {
  const [count, setCount] = useState(start)
  const [isAnimating, setIsAnimating] = useState(false)
  const countRef = useRef(start)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true)
      
      const animate = (timestamp: number) => {
        if (!startTimeRef.current) {
          startTimeRef.current = timestamp
        }

        const elapsed = timestamp - startTimeRef.current
        const progress = Math.min(elapsed / duration, 1)
        
        // Easing function (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3)
        
        const currentValue = start + (end - start) * easeOut
        countRef.current = currentValue
        setCount(currentValue)

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          setIsAnimating(false)
        }
      }

      requestAnimationFrame(animate)
    }, delay)

    return () => clearTimeout(timer)
  }, [start, end, duration, delay])

  const formattedValue = `${prefix}${count.toFixed(decimals)}${suffix}`

  return { value: count, formattedValue, isAnimating }
}

// Component version for easier use
export function CountUp({
  end,
  duration = 1000,
  delay = 0,
  decimals = 0,
  suffix = "",
  prefix = "",
  className = ""
}: UseCountUpOptions & { className?: string }) {
  const { formattedValue } = useCountUp({ end, duration, delay, decimals, suffix, prefix })

  return <span className={`count-up ${className}`}>{formattedValue}</span>
}
