import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/your-comms'); // Changed from /dashboard
  return null; 
}
