import { Suspense } from 'react';
import Calculator from '@/components/Calculator';

export default function Home() {
  return (
    <main className="min-h-screen py-8 px-4">
      <Suspense fallback={
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-2xl mx-auto text-center">
          Loading calculator...
        </div>
      }>
        <Calculator />
      </Suspense>
    </main>
  );
}
