import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { getAcademySettings } from "@/lib/academy-settings";
import { formatPkr } from "@/lib/fees";

export type ChallanPdfData = {
  challanNo: string;
  periodMonth: string;
  dueDate: Date | string;
  items: { label: string; amount: number }[];
  subtotal: number;
  discount: number;
  lateFee: number;
  total: number;
  paidAmount?: number;
  student: { fullName: string; regNo: string; fatherName: string; classLevel: string; program?: { title?: string } | null };
};

const pageWidth = 595.28;
const left = 34;

export async function createChallanPdf(data: ChallanPdfData) {
  const academy = await getAcademySettings();
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([pageWidth, 841.89]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const qrPng = await QRCode.toBuffer(data.challanNo, { type: "png", width: 180, margin: 1 });
  const qr = await pdf.embedPng(qrPng);
  const dueDate = new Intl.DateTimeFormat("en-PK", { timeZone: "Asia/Karachi", dateStyle: "medium" }).format(new Date(data.dueDate));
  const studentClass = data.student.classLevel || data.student.program?.title || "—";
  const paymentLines = [
    [academy.payments.easyPaisa.accountTitle, academy.payments.easyPaisa.accountNumber].filter(Boolean).join(" / "),
    [academy.payments.jazzCash.accountTitle, academy.payments.jazzCash.accountNumber].filter(Boolean).join(" / "),
    [academy.payments.bankTransfer.bankName, academy.payments.bankTransfer.accountTitle].filter(Boolean).join(" / "),
    academy.payments.bankTransfer.iban,
  ].filter(Boolean);
  for (let copy = 0; copy < 3; copy++) {
    const top = 823 - copy * 270;
    const text = (value: string, x: number, y: number, size = 8, isBold = false) => {
      page.drawText(value.slice(0, 100), { x, y, size, font: isBold ? bold : regular, color: rgb(0.12, 0.18, 0.25) });
    };
    page.drawText("SRA", { x: left, y: top - 22, size: 18, font: bold, color: rgb(0.02, 0.39, 0.39) });
    text(academy.name, left + 42, top - 16, 13, true);
    text(`${["STUDENT COPY", "ACADEMY COPY", "BANK COPY"][copy]}  |  FEE CHALLAN`, left, top - 39, 9, true);
    text(`Challan: ${data.challanNo}`, left, top - 57, 9, true);
    text(`Month: ${data.periodMonth}     Due: ${dueDate}`, left + 220, top - 57, 9, true);
    text(`Student: ${data.student.fullName}`, left, top - 76, 9, true);
    text(`Reg. no: ${data.student.regNo}`, left + 295, top - 76, 9);
    text(`Father: ${data.student.fatherName}`, left, top - 93, 9);
    text(`Class: ${studentClass}`, left + 295, top - 93, 9);
    page.drawLine({ start: { x: left, y: top - 105 }, end: { x: pageWidth - left, y: top - 105 }, thickness: 0.7, color: rgb(0.78, 0.82, 0.85) });
    let rowY = top - 120;
    for (const item of data.items.slice(0, 4)) {
      text(item.label, left, rowY, 8);
      text(formatPkr(item.amount), 420, rowY, 8);
      rowY -= 13;
    }
    text("Subtotal", left, rowY, 8);
    text(formatPkr(data.subtotal), 420, rowY, 8);
    rowY -= 13;
    text("Concession", left, rowY, 8);
    text(`- ${formatPkr(data.discount)}`, 420, rowY, 8);
    rowY -= 13;
    if (data.lateFee > 0) {
      text("Late fee", left, rowY, 8);
      text(formatPkr(data.lateFee), 420, rowY, 8);
      rowY -= 13;
    }
    text(`Total: ${formatPkr(data.total)}     Paid: ${formatPkr(data.paidAmount || 0)}     Balance: ${formatPkr(Math.max(0, data.total - (data.paidAmount || 0)))}`, left, rowY, 9, true);
    text("Payment instructions", left, top - 196, 8, true);
    paymentLines.forEach((line, index) => text(line, left, top - 208 - index * 10, 6.5));
    page.drawImage(qr, { x: pageWidth - left - 58, y: top - 190, width: 52, height: 52 });
    text("Scan challan no.", pageWidth - left - 66, top - 198, 6);
    page.drawLine({
      start: { x: left, y: top - 254 },
      end: { x: pageWidth - left, y: top - 254 },
      thickness: 0.7,
      color: rgb(0.55, 0.6, 0.65),
      dashArray: [4, 3],
    });
  }
  return pdf.save();
}
