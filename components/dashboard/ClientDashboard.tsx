"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { FolderPlus, Eye } from "lucide-react"

interface ClientDashboardProps {
  userId: string
  initialProjects: any[] // आप चाहें तो एक proper type भी बना सकते हैं
}

export default function ClientDashboard({ userId, initialProjects }: ClientDashboardProps) {
  const totalProjects = initialProjects?.length || 0
  const openProjects = initialProjects?.filter(p => p.status === "open").length || 0
  const totalProposals = initialProjects?.reduce(
    (acc, p) => acc + (p.proposals?.[0]?.count || 0),
    0
  ) || 0

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardContent className="p-6">
            <p className="text-sm text-gray-400">Total Projects</p>
            <p className="text-3xl font-bold text-white">{totalProjects}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardContent className="p-6">
            <p className="text-sm text-gray-400">Open Projects</p>
            <p className="text-3xl font-bold text-yellow-400">{openProjects}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardContent className="p-6">
            <p className="text-sm text-gray-400">Proposals Received</p>
            <p className="text-3xl font-bold text-green-400">{totalProposals}</p>
          </CardContent>
        </Card>
      </div>

      {/* Post New Project Button */}
      <div className="flex justify-end">
        <Link href="/projects/new">
          <Button className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black">
            <FolderPlus className="mr-2 h-4 w-4" /> Post New Project
          </Button>
        </Link>
      </div>

      {/* My Projects List */}
      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-white">My Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {!initialProjects || initialProjects.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              You haven't posted any projects yet.
            </p>
          ) : (
            <div className="space-y-4">
              {initialProjects.map((project) => (
                <div
                  key={project.id}
                  className="p-4 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-white">{project.title}</h3>
                      <p className="text-sm text-gray-400 mt-1">Budget: ₹{project.budget}</p>
                      <p className="text-sm text-gray-400">Category: {project.category}</p>
                    </div>
                    <Badge
                      className={
                        project.status === "open"
                          ? "bg-green-500"
                          : project.status === "in_progress"
                          ? "bg-yellow-500"
                          : "bg-gray-500"
                      }
                    >
                      {project.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-sm text-gray-400">
                      Proposals: {project.proposals?.[0]?.count || 0}
                    </span>
                    <Link href={`/projects/${project.id}/proposals`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-white border-white/20"
                      >
                        <Eye className="mr-2 h-4 w-4" /> View Proposals
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}