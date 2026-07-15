"use client"

import { useEffect, useState } from "react"

interface Props {
  targetTime?: Date
  resetHours?: number
  className?: string
}

function getTimeLeft(target: Date): { h: number; m: number; s: number } {
  const diff = Math.max(0, target.getTime() - Date.now())
  const totalSeconds = Math.floor(diff / 1000)
  return {
    h: Math.floor(totalSeconds / 3600),
    m: Math.floor((totalSeconds % 3600) / 60),
    s: totalSeconds % 60,
  }
}

function pad(n: number) {
  return String(n).padStart(2, "0")
}

function makeTarget(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000)
}

export default function CountdownTimer({ targetTime, resetHours = 24, className = "" }: Props) {
  const [target, setTarget] = useState<Date>(() => targetTime ?? makeTarget(resetHours))
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(target))

  useEffect(() => {
    if (targetTime) setTarget(targetTime)
  }, [targetTime])

  useEffect(() => {
    const tick = () => {
      const left = getTimeLeft(target)
      setTimeLeft(left)
      if (left.h === 0 && left.m === 0 && left.s === 0) {
        const next = makeTarget(resetHours)
        setTarget(next)
      }
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [target, resetHours])

  const isUrgent = timeLeft.h === 0

  return (
    <span
      className={`font-mono font-bold tabular-nums ${
        isUrgent ? "text-red-400" : "text-orange-400"
      } ${className}`}
    >
      {pad(timeLeft.h)}:{pad(timeLeft.m)}:{pad(timeLeft.s)}
    </span>
  )
}
