"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import PostGateModal from "./PostGateModal"

interface Props {
  hasPlan: boolean
  href: string          // where to go when plan is active
  label?: string
  className?: string
  redirectAfterPlan?: string
}

export default function PostGateButton({
  hasPlan,
  href,
  label = "Post Now",
  className = "",
  redirectAfterPlan,
}: Props) {
  const [showGate, setShowGate] = useState(false)
  const router = useRouter()

  const handleClick = () => {
    if (!hasPlan) {
      setShowGate(true)
    } else {
      router.push(href)
    }
  }

  return (
    <>
      <PostGateModal
        open={showGate}
        onClose={() => setShowGate(false)}
        redirectAfterPlan={redirectAfterPlan ?? href}
      />
      <button
        onClick={handleClick}
        className={`transition-opacity hover:opacity-90 ${className}`}
      >
        {label}
      </button>
    </>
  )
}
