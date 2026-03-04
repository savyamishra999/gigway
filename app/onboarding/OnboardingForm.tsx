"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Briefcase, Users, RefreshCw } from "lucide-react"

const roles = [
  {
    id: "freelancer",
    title: "I'm a Freelancer",
    description: "I want to find work and earn money",
    icon: Briefcase,
    color: "from-blue-400 to-blue-600",
  },
  {
    id: "client",
    title: "I'm a Client",
    description: "I want to hire freelancers for my projects",
    icon: Users,
    color: "from-[#FFD700] to-[#FFA500]",
  },
  {
    id: "both",
    title: "I'm Both",
    description: "I want to hire and work as a freelancer",
    icon: RefreshCw,
    color: "from-green-400 to-green-600",
  },
]

export default function OnboardingForm({ userId }: { userId: string }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async () => {
    if (!selected) return
    setLoading(true)

    const { error } = await supabase
      .from("profiles")
      .update({ user_type: selected })
      .eq("id", userId)

    setLoading(false)
    if (error) {
      alert("Error updating role. Please try again.")
    } else {
      router.push("/profile/edit") // After role selection, go to profile edit
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        {roles.map((role) => {
          const Icon = role.icon
          return (
            <Card
              key={role.id}
              className={`relative cursor-pointer p-6 border-2 transition-all ${
                selected === role.id
                  ? "border-[#FFD700] bg-white/20"
                  : "border-white/10 bg-white/5 hover:border-white/20"
              }`}
              onClick={() => setSelected(role.id)}
            >
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${role.color} flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{role.title}</h3>
              <p className="text-sm text-gray-400">{role.description}</p>
            </Card>
          )
        })}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!selected || loading}
        className="w-full py-6 text-lg font-semibold bg-[#FFD700] hover:bg-[#FFD700]/90 text-black"
      >
        {loading ? "Saving..." : "Continue →"}
      </Button>
    </div>
  )
}