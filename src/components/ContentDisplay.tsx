import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Download, Printer, Copy, Check, FileText, Loader2, FileCode, RefreshCw, ChevronLeft, ChevronRight, Wand2, ChevronDown, Sparkles, AlertCircle } from 'lucide-react';
import { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType, ImageRun } from 'docx';
import { saveAs } from 'file-saver';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface ContentDisplayProps {
  title: string;
  content: string;
  imageUrl?: string;
  onSave?: () => void;
  onRegenerate?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onTransform?: (type: string) => void;
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
  onTransform,
  currentIndex = 0,
  totalCount = 1
}: ContentDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showTransformMenu, setShowTransformMenu] = useState(false);

  const transformOptions = [
    { id: 'quiz', label: 'Transformer en Quiz', icon: <Sparkles size={14} /> },
    { id: 'exercises', label: 'Transformer en Exercices', icon: <FileCode size={14} /> },
    { id: 'simplification', label: 'Simplifier le contenu', icon: <Wand2 size={14} /> },
    { id: 'revision_sheet', label: 'Créer une fiche mémo', icon: <FileText size={14} /> },
    { id: 'evaluation', label: 'Créer une évaluation', icon: <AlertCircle size={14} /> },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Veuillez autoriser les fenêtres surgissantes pour imprimer.");
      return;
    }

    const contentHtml = document.getElementById('printable-content')?.innerHTML || '';
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(style => style.outerHTML)
      .join('\n');

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          ${styles}
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&swap');
            body { 
              font-family: 'Inter', sans-serif;
              background: white !important; 
              padding: 40px;
              color: #111827;
            }
            .no-print { display: none !important; }
            #printable-content { max-width: 800px; margin: 0 auto; }
            img { max-width: 100%; height: auto; border-radius: 12px; margin: 24px 0; }
            pre { background: #f3f4f6; padding: 20px; border-radius: 12px; overflow-x: auto; font-family: monospace; }
            blockquote { border-left: 4px solid #10b981; padding-left: 20px; font-style: italic; color: #4b5563; margin: 20px 0; }
            table { border-collapse: collapse; width: 100%; margin: 24px 0; }
            th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
            th { background-color: #f9fafb; font-weight: bold; }
            .katex-display { margin: 1.5em 0; overflow-x: auto; overflow-y: hidden; }
            @media print {
              @page { margin: 2cm; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="prose prose-emerald max-w-none">
            ${contentHtml}
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 800);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportPDF = async () => {
    const element = document.getElementById('printable-content');
    if (!element || isExporting) return;

    setIsExporting(true);
    
    const opt = {
      margin: [10, 10, 10, 10] as [number, number, number, number],
      filename: `${title.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        letterRendering: true,
        onclone: (clonedDoc: any) => {
          const el = clonedDoc.getElementById('printable-content');
          if (el) {
            // Force a professional academic layout for PDF
            el.style.padding = '20px 40px';
            el.style.width = '750px'; // Perfect for A4 width
            el.style.margin = '0 auto';
            
            // Adjust title sizes for PDF
            const h1 = el.querySelector('h1');
            if (h1) h1.style.fontSize = '24pt';
            
            const allElements = el.getElementsByTagName('*');
            for (let i = 0; i < allElements.length; i++) {
              const item = allElements[i] as HTMLElement;
              const style = window.getComputedStyle(item);
              
              // Remove problematic colors
              if (style.color.includes('okl')) item.style.color = '#111827';
              if (style.backgroundColor.includes('okl')) item.style.backgroundColor = 'transparent';
              if (style.borderColor.includes('okl')) item.style.borderColor = '#e5e7eb';
              
              // Ensure text is not too large
              if (item.tagName === 'P' || item.tagName === 'LI') {
                item.style.fontSize = '11pt';
                item.style.lineHeight = '1.5';
              }
            }
          }
        }
      },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] as any }
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("PDF Export error:", error);
      alert("Erreur lors de l'export PDF. Veuillez réessayer.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportWord = async () => {
    try {
      const children: any[] = [
        new Paragraph({
          text: title,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
      ];

      // Add Image if exists
      if (imageUrl) {
        try {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const buffer = await blob.arrayBuffer();
          
          children.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: new Uint8Array(buffer),
                transformation: {
                  width: 550,
                  height: 300,
                },
              } as any),
            ],
            spacing: { after: 400 },
          }));
        } catch (imgError) {
          console.error("Could not include image in Word export:", imgError);
          // Continue without image
        }
      }

      const lines = content.split('\n');
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

      children.push(new Paragraph({
        children: [
          new TextRun({
            text: "\nNote: Les formules mathématiques complexes sont exportées au format texte. Pour un rendu mathématique parfait, utilisez l'export PDF.",
            italics: true,
          })
        ],
        spacing: { before: 480 }
      }));

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
            {onTransform && (
              <div className="relative">
                <button
                  onClick={() => setShowTransformMenu(!showTransformMenu)}
                  className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all flex items-center gap-2"
                  title="Transformer ce contenu"
                >
                  <Wand2 size={18} />
                  <span className="text-xs font-medium hidden sm:inline">Transformer</span>
                  <ChevronDown size={14} />
                </button>
                
                {showTransformMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowTransformMenu(false)}
                    />
                    <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-black/5 py-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                      {transformOptions.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => {
                            onTransform(opt.id);
                            setShowTransformMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-3 transition-colors"
                        >
                          <span className="text-emerald-500">{opt.icon}</span>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            {onRegenerate && (
              <ActionButton 
                icon={<RefreshCw size={18} />} 
                onClick={onRegenerate} 
                label="Régénérer" 
                variant="secondary"
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
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 whitespace-nowrap shadow-lg shadow-emerald-100 hover:shadow-emerald-200 active:scale-95"
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
              remarkPlugins={[remarkMath, remarkGfm]} 
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

function ActionButton({ icon, onClick, label, variant = 'secondary' }: { icon: React.ReactNode, onClick: () => void, label: string, variant?: 'primary' | 'secondary' }) {
  return (
    <button
      onClick={onClick}
      className={`p-2.5 rounded-xl transition-all flex items-center gap-2 font-medium text-xs ${
        variant === 'primary' 
          ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow-md' 
          : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-200 hover:text-emerald-600 hover:bg-emerald-50/50 shadow-sm'
      }`}
      title={label}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
