
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { ArrowLeft, Loader2, Copy, Check, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
    const [copied, setCopied] = useState(false);

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
        toast({ title: "Copied to clipboard", description: "You can now paste the notes anywhere." });
        setTimeout(() => setCopied(false), 2000);
    };

    const renderFormattedLine = (line: string) => {
        // Simple formatter to handle **bold** text within a line
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i}>{part.slice(2, -2)}</strong>;
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
            <Header title="Study Notes Viewer" />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between">
                    <Button variant="ghost" onClick={() => router.push('/notes')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Generator
                    </Button>
                    <Button variant="outline" size="sm" onClick={copyToClipboard} className="flex items-center gap-2">
                        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        {copied ? 'Copied' : 'Copy All'}
                    </Button>
                </div>
                
                <div className="bg-white max-w-4xl mx-auto p-8 border rounded-lg shadow-lg">
                    <div className="text-center mb-8 pb-6 border-b">
                        <div className="flex justify-center mb-2">
                            <FileText className="h-10 w-10 text-indigo-600" />
                        </div>
                        <h1 className="text-3xl font-bold uppercase tracking-tight text-indigo-900">
                            {notesDetails.chapter}
                        </h1>
                        <div className="flex flex-wrap justify-center gap-2 mt-3">
                            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Class {notesDetails.class}</span>
                            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase">{notesDetails.subject}</span>
                            {notesDetails.board && (
                                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase">{notesDetails.board} Board</span>
                            )}
                        </div>
                    </div>

                    <div className="prose prose-sm max-w-none whitespace-pre-wrap font-sans">
                      {generatedNotes.split('\n').map((line, index) => {
                          if (line.trim() === '') return <br key={index} />;

                          if (line.startsWith('# ')) {
                              return null; // Skip main title as we rendered it above
                          }
                          if (line.startsWith('## ')) {
                              return <h2 key={index} className="font-bold text-xl text-indigo-800 border-l-4 border-indigo-600 pl-3 my-6">{renderFormattedLine(line.replace('## ', ''))}</h2>
                          }
                          if (line.startsWith('### ')) {
                              return <h3 key={index} className="font-bold text-lg text-gray-800 mt-4 mb-2">{renderFormattedLine(line.replace('### ', ''))}</h3>
                          }
                          
                          return <p key={index} className="!my-2 leading-relaxed text-gray-700">{renderFormattedLine(line)}</p>
                      })}
                    </div>

                    <div className="mt-12 pt-6 border-t text-center">
                        <p className="text-xs text-muted-foreground font-bold italic">Generated by QuizNova AI - Your personal learning companion.</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
