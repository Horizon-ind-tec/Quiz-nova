'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import { BrainCircuit, GraduationCap, FileText, Target, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import images from '@/app/lib/placeholder-images.json';

export default function LandingPage() {
  const { user } = useUser();
  const startHref = user ? '/dashboard' : '/signup';

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* --- Navigation --- */}
      <nav className="flex items-center justify-between px-6 py-4 border-b bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold tracking-tighter">QuizNova</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">Login</Link>
          <Button asChild size="sm">
            <Link href={startHref}>Get Started</Link>
          </Button>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 text-center lg:text-left relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest animate-bounce">
              <Sparkles className="h-3 w-3" /> Powered by Gemini 2.5
            </div>
            <h1 className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tighter">
              Master Any Subject with <span className="text-primary">AI Intelligence.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0">
              The ultimate study companion for students. Generate custom quizzes, get instant homework help, and create professional chapter notes in seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button asChild size="lg" className="h-14 px-8 text-lg rounded-full shadow-xl shadow-primary/20">
                <Link href={startHref}>Start Studying Now <ArrowRight className="ml-2" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full">
                <Link href="/plans">View Premium Plans</Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full opacity-50 animate-pulse" />
            <div className="relative rounded-2xl border-2 border-primary/10 shadow-2xl overflow-hidden aspect-[4/3] bg-muted">
              <Image 
                src={images.landing.hero.url} 
                alt="AI Learning" 
                fill 
                className="object-cover"
                data-ai-hint={images.landing.hero.hint}
              />
            </div>
          </div>
        </div>
      </section>

      {/* --- Features --- */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">One Platform, <span className="text-primary">Everything</span> You Need.</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Stop searching, start learning. Nova brings elite-level academic tools to your fingertips.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Target}
              title="Custom AI Quizzes"
              description="Generate assessments for any class, board, or subject. From MCQ to paper-style exams."
              color="bg-blue-500"
            />
            <FeatureCard 
              icon={GraduationCap}
              title="Homework Helper"
              description="Stuck on a problem? Scan your assignment and get step-by-step conceptual explanations."
              color="bg-indigo-600"
            />
            <FeatureCard 
              icon={FileText}
              title="Chapter Notes"
              description="Convert complex topics into easy-to-read, professional study notes optimized for revision."
              color="bg-violet-600"
            />
          </div>
        </div>
      </section>

      {/* --- Why Choose Us --- */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl font-black tracking-tight">Designed for the <br/><span className="text-primary">Modern Student.</span></h2>
            <div className="space-y-4 pt-4">
              <CheckItem text="Personalized adaptive learning paths" />
              <CheckItem text="Support for CBSE, ICSE, and State Boards" />
              <CheckItem text="JEE & NEET specialized preparation modes" />
              <CheckItem text="Detailed performance analytics & reports" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4 pt-12">
              <div className="bg-primary/5 p-8 rounded-2xl border flex flex-col items-center text-center">
                <span className="text-4xl font-black text-primary">98%</span>
                <span className="text-sm font-bold text-muted-foreground uppercase">Score Improvement</span>
              </div>
              <div className="bg-orange-500/5 p-8 rounded-2xl border flex flex-col items-center text-center">
                <span className="text-4xl font-black text-orange-600">24/7</span>
                <span className="text-sm font-bold text-muted-foreground uppercase">AI Availability</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-indigo-500/5 p-8 rounded-2xl border flex flex-col items-center text-center">
                <span className="text-4xl font-black text-indigo-600">10k+</span>
                <span className="text-sm font-bold text-muted-foreground uppercase">Daily Quizzes</span>
              </div>
              <div className="bg-green-500/5 p-8 rounded-2xl border flex flex-col items-center text-center">
                <span className="text-4xl font-black text-green-600">Elite</span>
                <span className="text-sm font-bold text-muted-foreground uppercase">Academic Tools</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="mt-auto py-12 px-6 border-t bg-card">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold tracking-tighter">QuizNova</span>
          </div>
          <p className="text-sm text-muted-foreground text-center">© {new Date().getFullYear()} QuizNova EduTech. Helping you achieve your achievements.</p>
          <div className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/plans" className="hover:text-primary transition-colors">Pricing</Link>
            <Link href="/login" className="hover:text-primary transition-colors">Support</Link>
            <Link href="#" className="hover:text-primary transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, color }: any) {
  return (
    <div className="bg-card p-8 rounded-2xl border hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
      <div className={`${color} w-12 h-12 rounded-xl flex items-center justify-center text-white mb-6 shadow-lg`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function CheckItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      </div>
      <span className="font-semibold text-foreground/80">{text}</span>
    </div>
  );
}
