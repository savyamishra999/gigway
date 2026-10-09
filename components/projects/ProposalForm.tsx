"use client"
interface ProposalFormProps { projectId: string; userId: string; onSuccess?: () => void; projectTitle?: string; projectDescription?: string }
// Preserve the component contract without a browser database write path.
export default function ProposalForm(_props: ProposalFormProps) {
  return <section role="status" className="rounded-card border border-brand-borderLight bg-white p-6 text-center shadow-soft"><h3 className="text-lg font-bold text-brand-midnight">Proposal submissions are temporarily paused</h3><p className="mt-3 text-sm leading-6 text-brand-slate">We are updating submission safety. No connects or payments will be deducted. You can continue browsing projects.</p></section>
}
