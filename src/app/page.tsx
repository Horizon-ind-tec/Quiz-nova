import { redirect } from 'next/navigation';

export default function RootPage() {
  // Automatically redirect from root to the dashboard as requested.
  redirect('/dashboard');
}
