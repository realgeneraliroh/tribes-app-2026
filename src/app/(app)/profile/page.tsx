
import { redirect } from 'next/navigation';

export default function ProfilePage() {
  // Your own profile is your wall — redirect there
  redirect('/my-wall');
  return null; 
}
