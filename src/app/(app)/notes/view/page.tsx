
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { ArrowLeft, Loader2, FileDown, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type NotesDetails = {
    class: string;
    subject: string;
    board?: string;
    chapter: string;
};

export default function ViewNotesPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [generatedNotes] = useLocalStorage<string | null>('lastGeneratedNotes', null);
    const [notesDetails] = useLocalStorage<NotesDetails | null>('lastNotesDetails', null);
    const [isClient, setIsClient] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [copied, setCopied] = useState(false);
    const paperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsClient(true);
    }, []);
    
    useEffect(() => {
        if (isClient && !generatedNotes) {
            router.replace('/notes');
        }
    }, [isClient, generatedNotes, router]);

    const copyToClipboard = () => {
        if (!generatedNotes) return;
        navigator.clipboard.writeText(generatedNotes);
        setCopied(true);
        toast({ title: "Copied to clipboard" });
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadPdf = async () => {
        if (!paperRef.current || !notesDetails) return;
        setIsDownloading(true);
        
        try {
            const html2canvas = (await import('html2canvas')).default;
            const { jsPDF } = await import('jspdf');

            const element = paperRef.current;
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight,
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width / 2, canvas.height / 2],
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${notesDetails.subject}_${notesDetails.chapter}_Notes.pdf`);
            
            toast({ title: "PDF Downloaded", description: "Your study notes are ready." });
        } catch (error) {
            console.error('PDF Generation Error:', error);
            toast({ variant: 'destructive', title: 'Download Failed', description: 'Could not generate PDF.' });
        } finally {
            setIsDownloading(false);
        }
    };

    const renderFormattedLine = (line: string) => {
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    if (!isClient || !generatedNotes || !notesDetails) {
        return (
             <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col bg-muted/20 min-h-screen">
            <Header title="AI Study Notes" />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between gap-2">
                    <Button variant="ghost" onClick={() => router.push('/notes')} className="shrink-0">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={copyToClipboard} className="flex items-center gap-2">
                            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
                        </Button>
                        <Button size="sm" onClick={downloadPdf} disabled={isDownloading} className="flex items-center gap-2 bg-red-600 hover:bg-red-700">
                            {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                            Download PDF
                        </Button>
                    </div>
                </div>
                
                {/* --- PROFESSIONAL PAPER VIEW --- */}
                <div ref={paperRef} className="bg-white max-w-4xl mx-auto border-2 border-gray-300 rounded-sm shadow-xl p-0 overflow-hidden font-sans text-gray-900">
                    {/* Header Banner */}
                    <div className="bg-red-600 text-white py-2 px-4 text-center font-bold text-xs uppercase tracking-widest">
                        QuizNova Learning helps you achieve your achievements
                    </div>

                    <div className="p-6 sm:p-10">
                        {/* Title Section */}
                        <div className="text-center border-2 border-dashed border-gray-400 p-6 mb-8">
                            <h1 className="text-2xl sm:text-3xl font-black text-red-600 uppercase tracking-tighter leading-none mb-1">
                                {notesDetails.subject} - {notesDetails.class}
                            </h1>
                            <h2 className="text-xl sm:text-2xl font-bold text-blue-700 mb-2">Comprehensive Study Notes</h2>
                            <p className="text-lg font-black uppercase border-t border-b border-gray-300 py-1 inline-block mt-2">
                                CHAPTER: {notesDetails.chapter}
                            </p>
                            
                            <div className="flex justify-between items-center mt-6 text-sm font-bold text-gray-600 uppercase">
                                <span>Board: {notesDetails.board || 'All Boards'}</span>
                                <span>Academic Session: {new Date().getFullYear()}</span>
                            </div>

                            {/* Important Instructions Box */}
                            <div className="text-left mt-6 bg-gray-50 border border-gray-300 p-4 rounded-md">
                                <h3 className="font-bold text-red-600 border-b-2 border-red-600 pb-1 inline-block text-sm mb-3 uppercase">CHAPTER OVERVIEW:</h3>
                                <ul className="list-disc list-inside text-xs sm:text-sm space-y-1.5 font-medium text-gray-700">
                                    <li>These notes are generated by AI based on standard curriculum guidelines.</li>
                                    <li>Focus on bold terms and highlighted formulas for maximum efficiency.</li>
                                    <li>Use the summary section for quick revision before assessments.</li>
                                    <li>Branding: www.QuizNova.com - Your AI Study Companion.</li>
                                </ul>
                            </div>
                        </div>

                        {/* Content Sections */}
                        <div className="space-y-8">
                            {generatedNotes.split('\n').map((line, index) => {
                                const trimmed = line.trim();
                                if (trimmed === '') return <div key={index} className="h-4" />;

                                if (trimmed.startsWith('# ')) {
                                    return null; // Skip main title as we rendered it above
                                }
                                
                                if (trimmed.startsWith('## ')) {
                                    return (
                                        <div key={index} className="mt-8 mb-4">
                                            <h2 className="text-center font-black text-lg bg-blue-700 text-white py-2 px-4 rounded-sm uppercase tracking-wider">
                                                {renderFormattedLine(trimmed.replace('## ', ''))}
                                            </h2>
                                        </div>
                                    );
                                }
                                
                                if (trimmed.startsWith('### ')) {
                                    return (
                                        <h3 key={index} className="font-black text-blue-800 border-l-4 border-blue-600 pl-3 my-4 uppercase text-md">
                                            {renderFormattedLine(trimmed.replace('### ', ''))}
                                        </h3>
                                    );
                                }

                                // Handle lists or points
                                if (trimmed.startsWith('- ') || trimmed.match(/^\d+\./)) {
                                    return (
                                        <div key={index} className="flex gap-3 my-2 text-sm sm:text-base leading-relaxed pl-2">
                                            <span className="text-blue-600 font-bold shrink-0">{trimmed.startsWith('-') ? '•' : trimmed.split('.')[0] + '.'}</span>
                                            <p className="flex-1 text-gray-800">{renderFormattedLine(trimmed.replace(/^[- \d.]+\s*/, ''))}</p>
                                        </div>
                                    )
                                }
                                
                                return (
                                    <p key={index} className="text-sm sm:text-base leading-relaxed text-gray-800 my-2">
                                        {renderFormattedLine(line)}
                                    </p>
                                );
                            })}
                        </div>

                        {/* Professional Footer */}
                        <div className="mt-16 pt-6 border-t-2 border-gray-200 text-center">
                            <p className="text-xs font-black text-blue-700 uppercase tracking-widest mb-1">Generated by QuizNova AI Engine</p>
                            <p className="text-[10px] text-gray-500 font-bold">For more study materials, visit: <span className="text-red-600">www.QuizNova.com</span></p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
