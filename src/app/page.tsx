import { Suspense } from 'react';
import Calculator from '@/components/Calculator';

function LoadingSkeleton() {
  return (
    <div className="max-w-6xl mx-auto animate-pulse">
      <div className="text-center mb-10">
        <div className="h-8 w-64 bg-slate-700/50 rounded-full mx-auto mb-4" />
        <div className="h-12 w-96 bg-slate-700/50 rounded-lg mx-auto mb-4" />
        <div className="h-6 w-80 bg-slate-700/30 rounded mx-auto" />
      </div>
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 bg-slate-800/50 rounded-2xl p-6 h-[600px]" />
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-800/50 rounded-2xl p-6 h-[300px]" />
          <div className="bg-slate-800/50 rounded-2xl p-6 h-[200px]" />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen py-10 px-4 md:px-6 lg:px-8">
      <Suspense fallback={<LoadingSkeleton />}>
        <Calculator />
      </Suspense>
    </main>
  );
}
