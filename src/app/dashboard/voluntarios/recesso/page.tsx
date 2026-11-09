import { redirect } from 'next/navigation';

export default function RecessoPage() {
  redirect('/dashboard/voluntarios/escalas?tab=folgas');
}
