/**
 * emergencyLetterPdf.ts — Module 7: Protection Vault
 *
 * Renders the EmergencyLetter model to an A4 PDF with jsPDF.
 * jsPDF is imported dynamically so its ~350 KB only loads when the user
 * actually downloads the letter.
 *
 * Built-in PDF fonts cover Latin-1 only; every string passes through
 * toPdfSafe(). UnlockInstructions offers a plain-text download when the
 * letter contains characters the PDF cannot draw.
 */

import type { jsPDF as JsPDF } from 'jspdf'
import type { EmergencyLetter, LetterField } from './emergencyLetter'
import { toPdfSafe } from './emergencyLetter'

const PAGE_W = 210
const PAGE_H = 297
const MARGIN = 18
const CONTENT_W = PAGE_W - MARGIN * 2
const LABEL_W = 34

// KIN brand tokens (tailwind.config: navy / teal-deep / muted)
const NAVY: [number, number, number] = [16, 42, 67]
const TEAL: [number, number, number] = [15, 134, 118]
const MUTED: [number, number, number] = [107, 114, 128]

export async function renderLetterPdf(letter: EmergencyLetter): Promise<JsPDF> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = MARGIN

  function ensureSpace(h: number) {
    if (y + h > PAGE_H - MARGIN) {
      doc.addPage()
      y = MARGIN
    }
  }

  function paragraph(text: string, size = 10, color = NAVY, style: 'normal' | 'bold' = 'normal', x = MARGIN, w = CONTENT_W) {
    doc.setFont('helvetica', style)
    doc.setFontSize(size)
    doc.setTextColor(...color)
    const lines = doc.splitTextToSize(toPdfSafe(text), w) as string[]
    const lh = size * 0.45
    for (const line of lines) {
      ensureSpace(lh)
      doc.text(line, x, y)
      y += lh
    }
  }

  function rule(color = TEAL, weight = 0.3) {
    ensureSpace(4)
    doc.setDrawColor(...color)
    doc.setLineWidth(weight)
    doc.line(MARGIN, y, PAGE_W - MARGIN, y)
    y += 5
  }

  function sectionTitle(text: string) {
    y += 2
    ensureSpace(12)
    paragraph(text, 11, TEAL, 'bold')
    y += 1
  }

  function fields(items: LetterField[], indent = 4) {
    for (const f of items) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      const valueLines = doc.splitTextToSize(toPdfSafe(f.value), CONTENT_W - indent - LABEL_W) as string[]
      ensureSpace(valueLines.length * 4.5)
      doc.setTextColor(...MUTED)
      doc.text(toPdfSafe(f.label), MARGIN + indent, y)
      doc.setTextColor(...NAVY)
      valueLines.forEach((line, i) => doc.text(line, MARGIN + indent + LABEL_W, y + i * 4.5))
      y += valueLines.length * 4.5 + 0.5
    }
  }

  // Header
  paragraph(letter.title, 16, NAVY, 'bold')
  y += 1
  paragraph(letter.subtitle, 9, MUTED)
  y += 2
  rule(TEAL, 0.8)
  fields(letter.holder, 0)
  y += 3

  // Notice box
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  const noticeLines = doc.splitTextToSize(toPdfSafe(letter.notice), CONTENT_W - 8) as string[]
  const boxH = noticeLines.length * 4.5 + 6
  ensureSpace(boxH + 4)
  doc.setFillColor(254, 243, 226)
  doc.roundedRect(MARGIN, y, CONTENT_W, boxH, 2, 2, 'F')
  doc.setTextColor(146, 64, 14)
  noticeLines.forEach((line, i) => doc.text(line, MARGIN + 4, y + 6 + i * 4.5))
  y += boxH + 6

  // Policies
  sectionTitle('Insurance policies')
  if (letter.policies.length === 0) {
    paragraph('No policies recorded in vault yet.', 10, MUTED)
  }
  for (const p of letter.policies) {
    ensureSpace(10)
    paragraph(p.heading, 10.5, NAVY, 'bold')
    y += 1
    fields(p.fields)
    y += 3
  }

  // Nominees
  if (letter.nominees.length > 0) {
    rule()
    sectionTitle('Nominee contacts')
    for (const n of letter.nominees) {
      ensureSpace(10)
      paragraph(n.heading, 10.5, NAVY, 'bold')
      y += 1
      fields(n.fields)
      y += 3
    }
  }

  // Claim steps
  rule()
  sectionTitle('Steps to file a claim')
  letter.claimSteps.forEach((s, i) => {
    paragraph(`${i + 1}.`, 10, TEAL, 'bold')
    y -= 4.5
    paragraph(s, 10, NAVY, 'normal', MARGIN + 6, CONTENT_W - 6)
    y += 1.5
  })

  // Disclaimer
  y += 2
  rule(MUTED, 0.2)
  paragraph('Disclaimer', 9, MUTED, 'bold')
  y += 0.5
  for (const line of letter.disclaimer) paragraph(line, 8.5, MUTED)

  // Page numbers
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...MUTED)
    doc.text(`KIN Emergency Access Letter  -  Page ${i} of ${pages}`, PAGE_W / 2, PAGE_H - 8, { align: 'center' })
  }

  return doc
}
