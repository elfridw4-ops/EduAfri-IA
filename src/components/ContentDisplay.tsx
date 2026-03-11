import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Download, Printer, Copy, Check, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface ContentDisplayProps {
  title: string;
  content: string;
  onSave?: () => void;
}

export default function ContentDisplay({ title, content, onSave }: ContentDisplayProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    const element = document.getElementById('printable-content');
    if (!element) return;

    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${title.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-black/5 shadow-sm">
        <h3 className="font-semibold text-gray-900 truncate max-w-md">{title}</h3>
        <div className="flex items-center gap-2">
          <ActionButton icon={copied ? <Check size={18} /> : <Copy size={18} />} onClick={handleCopy} label={copied ? "Copié" : "Copier"} />
          <ActionButton icon={<Printer size={18} />} onClick={handlePrint} label="Imprimer" />
          <ActionButton icon={<Download size={18} />} onClick={handleExportPDF} label="PDF" />
          {onSave && (
            <button 
              onClick={onSave}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <FileText size={18} />
              Sauvegarder
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
        <div id="printable-content" className="p-12 prose prose-emerald max-w-none">
          <div className="mb-8 pb-8 border-b border-gray-100">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
            <p className="text-sm text-gray-400 font-mono uppercase tracking-widest">Généré par EduAfrica AI</p>
          </div>
          <ReactMarkdown>{content}</ReactMarkdown>
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
