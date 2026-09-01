import Link from "next/link";
import { BriefcaseBusiness, Layers, Package, Users } from "lucide-react";

const destinations = [
  { href: "/jobs", title: "Jobs", text: "Find full-time and professional opportunities.", Icon: BriefcaseBusiness },
  { href: "/projects", title: "Projects", text: "Find freelance and project work.", Icon: Layers },
  { href: "/gigs", title: "Gigs", text: "Offer or discover professional services.", Icon: Package },
  { href: "/freelancers", title: "Hire People", text: "Discover professionals and talent.", Icon: Users },
];
export default function WorkPage() { return <main className="min-h-screen bg-brand-ivory px-4 py-8 pb-24"><div className="mx-auto max-w-4xl"><p className="text-caption font-bold tracking-[.16em] text-brand-coral">WORK</p><h1 className="mt-2 text-h1 font-extrabold text-brand-midnight">Professional opportunities, clearly organized.</h1><p className="mt-3 max-w-2xl text-body-lg text-brand-slate">Find work, offer services, or build the team for your next project.</p><div className="mt-8 grid gap-4 sm:grid-cols-2">{destinations.map(({ href, title, text, Icon }) => <Link key={href} href={href} className="rounded-3xl border border-brand-borderLight bg-white p-5 shadow-soft transition hover:border-brand-indigo/35 hover:shadow-elevated"><Icon className="h-6 w-6 text-brand-indigo" /><h2 className="mt-5 text-h3 font-extrabold text-brand-midnight">{title}</h2><p className="mt-2 text-body-sm leading-6 text-brand-slate">{text}</p><span className="mt-5 inline-block text-caption font-bold text-brand-indigo">Explore {title}</span></Link>)}</div></div></main>; }
