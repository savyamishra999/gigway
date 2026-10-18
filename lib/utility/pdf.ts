import { jsPDF } from "jspdf"
import type { ResumeReport } from "./catalog"
export function resumePdf(report: ResumeReport, title: string): ArrayBuffer {
  const pdf=new jsPDF();let y=20
  const line=(text:string,bold=false)=>{
    pdf.setFont("helvetica",bold?"bold":"normal");pdf.setFontSize(bold?13:10)
    const clean=text.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"').replace(/[\u2013\u2014]/g,"-").replace(/\u2022/g,"-").replace(/\u2026/g,"...")
    if (/[^\x20-\x7E\n]/.test(clean)) throw Error("PDF requires an English report")
    for(const part of pdf.splitTextToSize(clean,175)){
      if(y>275){pdf.addPage();y=20}
      pdf.text(part,18,y);y+=6
    }y+=3
  }
  line("GigWay Resume Report",true);line(/^[\x20-\x7E]*$/.test(title)?title:"Saved resume analysis");line(`Resume readiness: ${report.overallScore}/100`,true)
  line("AI guidance based on pasted text. This is not an ATS certification or a hiring guarantee.")
  const sections:[string,string[]][]=[["Strengths",report.strengths],["Improvements",report.improvements],["Missing sections",report.missingSections],["Skills analysis",report.skillsAnalysis],["Formatting",report.formatting],["Recommended actions",report.recommendedActions]]
  for(const[heading,items]of sections){line(heading,true);for(const item of items)line("- "+item)}
  return pdf.output("arraybuffer")
}
