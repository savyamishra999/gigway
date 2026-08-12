interface LiveStatsProps {
  professionals: number
  services: number
  jobs: number
  projects: number
}

export default function LiveStats({ professionals, services, jobs, projects }: LiveStatsProps) {
  const stats = [
    { value: professionals, label: "Professionals" },
    { value: services,      label: "Services" },
    { value: jobs,          label: "Jobs" },
    { value: projects,      label: "Projects" },
  ]

  return (
    <section className="bg-white border-y border-brand-borderLight">
      <div className="container mx-auto max-w-7xl px-4 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {stats.map(stat => (
            <div key={stat.label} className="text-center">
              <p className="text-h2 font-extrabold text-brand-midnight">{stat.value.toLocaleString("en-IN")}</p>
              <p className="text-brand-slate text-body-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
