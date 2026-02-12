import { redirect } from 'next/navigation';

/**
 * Root page component that handles the immediate redirect to the dashboard hub.
 * This is the unified entry point for QuizNova.
 */
export default function RootPage() {
  redirect('/dashboard');
}
