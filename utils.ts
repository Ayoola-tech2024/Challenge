
import { Question, StudySession } from './types';

declare const pdfjsLib: any;
declare const jspdf: any;

// Initialize PDF.js worker
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    if (typeof pdfjsLib === 'undefined') {
      throw new Error("PDF Intelligence Engine not loaded. Please check your connection.");
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = "";
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += pageText + "\n";
    }
    
    return fullText;
  } catch (error: any) {
    console.error("PDF extraction failed:", error);
    throw new Error(error.message || "Document analysis failed. Ensure the PDF is not encrypted or corrupt.");
  }
};

export const downloadSummaryPDF = (session: StudySession) => {
  const { jsPDF } = (window as any).jspdf;
  const doc = new jsPDF();
  const margin = 20;
  let cursorY = 20;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("EXAMPRO AI - SYNC REPORT", margin, cursorY);
  cursorY += 15;

  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text(session.title, margin, cursorY);
  cursorY += 20;

  // Summary Header
  doc.setTextColor(79, 70, 229); // Indigo
  doc.setFontSize(16);
  doc.text("EXECUTIVE SUMMARY", margin, cursorY);
  cursorY += 10;

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const summaryLines = doc.splitTextToSize(session.summary, 170);
  doc.text(summaryLines, margin, cursorY);
  cursorY += (summaryLines.length * 6) + 15;

  // Key Points
  doc.setTextColor(79, 70, 229);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("NEURAL KEYPOINTS", margin, cursorY);
  cursorY += 10;

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  session.keyPoints.forEach((point, i) => {
    const lines = doc.splitTextToSize(`${i + 1}. ${point}`, 170);
    doc.text(lines, margin, cursorY);
    cursorY += (lines.length * 6) + 5;
    if (cursorY > 270) { doc.addPage(); cursorY = 20; }
  });

  cursorY += 10;
  // Insight
  doc.setTextColor(79, 70, 229);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("DEEP INSIGHT", margin, cursorY);
  cursorY += 10;

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.text(doc.splitTextToSize(session.insights, 170), margin, cursorY);

  doc.save(`Summary_${session.title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
};

export const downloadQuizPDF = (session: StudySession) => {
  const { jsPDF } = (window as any).jspdf;
  const doc = new jsPDF();
  const margin = 20;
  let cursorY = 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("EXAMPRO AI - ASSESSMENT MATRIX", margin, cursorY);
  cursorY += 15;

  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text(session.title, margin, cursorY);
  cursorY += 20;

  doc.setTextColor(0, 0, 0);
  session.questions.forEach((q, i) => {
    if (cursorY > 250) { doc.addPage(); cursorY = 20; }
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    const qLines = doc.splitTextToSize(`${i + 1}. ${q.question}`, 170);
    doc.text(qLines, margin, cursorY);
    cursorY += (qLines.length * 6) + 5;

    doc.setFont("helvetica", "normal");
    q.options.forEach((opt, oi) => {
      doc.text(`   ${String.fromCharCode(65 + oi)}) ${opt}`, margin, cursorY);
      cursorY += 6;
    });

    cursorY += 4;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 185, 129); // Emerald
    doc.text(`   Correct Answer: ${String.fromCharCode(65 + q.correctIndex)}`, margin, cursorY);
    cursorY += 6;

    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 100, 100);
    const exLines = doc.splitTextToSize(`   Explanation: ${q.explanation}`, 160);
    doc.text(exLines, margin + 5, cursorY);
    cursorY += (exLines.length * 5) + 10;
    
    doc.setTextColor(0, 0, 0);
  });

  doc.save(`Quiz_${session.title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
