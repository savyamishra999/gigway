"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import FreelancerDashboard from "./FreelancerDashboard"
import ClientDashboard from "./ClientDashboard"

export default function BothDashboard({ userId }: { userId: string }) {
  const [activeTab, setActiveTab] = useState("freelancer")

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-8">
        <TabsTrigger value="freelancer">Browse Jobs</TabsTrigger>
        <TabsTrigger value="client">My Jobs</TabsTrigger>
      </TabsList>
      <TabsContent value="freelancer">
        <FreelancerDashboard userId={userId} />
      </TabsContent>
      <TabsContent value="client">
        <ClientDashboard userId={userId} />
      </TabsContent>
    </Tabs>
  )
}