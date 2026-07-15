"use client"

import { useState } from "react"
import ApplyGateModal from "./ApplyGateModal"

interface Props {
  hasPlan: boolean
  onApply: () => void
  applicantsCount?: number
  label?: string
  className?: string
  disabled?: boolean
  redirectAfterPlan?: string
}

export default function ApplyButton({
  hasPlan,
  onApply,
  applicantsCount,
  label = "Apply Now",
  className = "",
  disabled = false,
  redirectAfterPlan,
}: Props) {
  const [showGate, setShowGate] = useState(false)

  const handleClick = () => {
    if (disabled) return
    if (!hasPlan) {
      setShowGate(true)
    } else {
      onApply()
    }
  }

  return (
    <>
      <ApplyGateModal
        open={showGate}
        onClose={() => setShowGate(false)}
        applicantsCount={applicantsCount}
        redirectAfterPlan={redirectAfterPlan}
      />
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`disabled:opacity-50 disabled:cursor-not-allowed transition-opacity hover:opacity-90 ${className}`}
      >
        {label}
      </button>
    </>
  )
}
