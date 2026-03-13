import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Download, Printer, Copy, Check, FileText, Loader2, FileCode, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

interface ContentDisplayProps {
  title: string;
  content: string;
  imageUrl?: string;
  onSave?: () => void;
  onRegenerate?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  currentIndex?: number;
  totalCount?: number;
}

export default function ContentDisplay({ 
  title, 
  content, 
  imageUrl,
  onSave, 
  onRegenerate,
  onPrevious,
  onNext,
  currentIndex = 0,
  totalCount = 1
}: ContentDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch (error) {
      console.error("Print error:", error);
      // Fallback for some environments
      document.execCommand('print', false);
    }
  };

  const handleExportPDF = async () => {
    const element = document.getElementById('printable-content');
    if (!element || isExporting) return;

    setIsExporting(true);
    try {
      const canvas = await html2canvas(element, { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = pdfWidth;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      
      let heightLeft = imgHeight;
      let position = 0;
      
      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
      
      // Add subsequent pages if content is longer than one page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      
      pdf.save(`${title.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error("PDF Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportWord = async () => {
    try {
      const lines = content.split('\n');
      const children: any[] = [
        new Paragraph({
          text: title,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 400 },
        }),
      ];

      lines.forEach((line) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
          children.push(new Paragraph({ text: "" }));
          return;
        }

        if (trimmedLine.startsWith('### ')) {
          children.push(new Paragraph({ text: trimmedLine.replace('### ', ''), heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }));
        } else if (trimmedLine.startsWith('## ')) {
          children.push(new Paragraph({ text: trimmedLine.replace('## ', ''), heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 } }));
        } else if (trimmedLine.startsWith('# ')) {
          children.push(new Paragraph({ text: trimmedLine.replace('# ', ''), heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }));
        } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
          children.push(new Paragraph({ text: trimmedLine.substring(2), bullet: { level: 0 }, spacing: { after: 100 } }));
        } else {
          children.push(new Paragraph({ text: trimmedLine, spacing: { after: 150 } }));
        }
      });

      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: {
                top: 1440,
                bottom: 1440,
                left: 1080,
                right: 1080,
              },
            },
          },
          children: children,
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${title.replace(/\s+/g, '_')}.docx`);
    } catch (error) {
      console.error("Word Export error:", error);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-4 rounded-2xl border border-black/5 shadow-sm gap-4 no-print">
        <h3 className="font-semibold text-gray-900 truncate w-full sm:max-w-md">{title}</h3>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1 sm:gap-2">
            {onRegenerate && (
              <ActionButton 
                icon={<RefreshCw size={18} />} 
                onClick={onRegenerate} 
                label="Régénérer" 
              />
            )}
            {totalCount > 1 && (
              <div className="flex items-center bg-gray-100 rounded-lg px-1">
                <button 
                  onClick={onPrevious}
                  disabled={currentIndex === 0}
                  className="p-1 text-gray-500 disabled:opacity-30"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-[10px] font-mono px-1">{currentIndex + 1}/{totalCount}</span>
                <button 
                  onClick={onNext}
                  disabled={currentIndex === totalCount - 1}
                  className="p-1 text-gray-500 disabled:opacity-30"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
            <ActionButton icon={copied ? <Check size={18} /> : <Copy size={18} />} onClick={handleCopy} label={copied ? "Copié" : "Copier"} />
            <ActionButton icon={<Printer size={18} />} onClick={handlePrint} label="Imprimer" />
            <ActionButton 
              icon={isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />} 
              onClick={handleExportPDF} 
              label={isExporting ? "Export..." : "PDF"} 
            />
            <ActionButton 
              icon={<FileCode size={18} />} 
              onClick={handleExportWord} 
              label="Word" 
            />
          </div>
          {onSave && (
            <button 
              onClick={onSave}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <FileText size={18} />
              <span className="hidden sm:inline">Sauvegarder</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
        <div id="printable-content" className="p-6 lg:p-12 prose prose-emerald max-w-none prose-sm sm:prose-base print:p-0">
          <div className="mb-6 lg:mb-8 pb-6 lg:pb-8 border-b border-gray-100 print:border-gray-300">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{title}</h1>
            <div className="flex justify-between items-center">
              <p className="text-[10px] lg:text-sm text-gray-400 font-mono uppercase tracking-widest">Généré par EduAfrica AI</p>
              <p className="hidden print:block text-[10px] text-gray-400 font-mono">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
          <div className="print:text-justify">
            {imageUrl && (
              <div className="mb-8 rounded-xl overflow-hidden border border-black/5 shadow-sm">
                <img src={imageUrl} alt={title} className="w-full h-auto object-cover max-h-[400px]" referrerPolicy="no-referrer" />
              </div>
            )}
            <ReactMarkdown 
              remarkPlugins={[remarkMath]} 
              rehypePlugins={[rehypeKatex]}
            >
              {content}
            </ReactMarkdown>
          </div>
          <div className="hidden print:block mt-12 pt-8 border-t border-gray-100 text-center">
            <p className="text-[10px] text-gray-300 font-mono italic">EduAfrica AI - L'assistant intelligent pour les enseignants africains</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ icon, onClick, label }: { icon: React.ReactNode, onClick: () => void, label: string }) {
  return (
    <button
      onClick={onClick}
      className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all flex items-center gap-2"
      title={label}
    >
      {icon}
      <span className="text-xs font-medium hidden sm:inline">{label}</span>
    </button>
  );
}
