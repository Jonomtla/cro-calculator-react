import { Suspense } from 'react';
import Calculator from '@/components/Calculator';

function LoadingSkeleton() {
  return (
    <div className="max-w-6xl mx-auto animate-pulse">
      <div className="text-center mb-10">
        <div className="h-10 w-40 bg-[#9abbd8]/30 rounded-lg mx-auto mb-4" />
        <div className="h-12 w-80 bg-[#9abbd8]/20 rounded-lg mx-auto mb-4" />
        <div className="h-6 w-96 bg-[#9abbd8]/10 rounded mx-auto" />
      </div>
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 bg-white/50 border-2 border-[#9abbd8]/20 rounded-2xl p-6 h-[700px]" />
        <div className="lg:col-span-3 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/50 border-2 border-[#9abbd8]/20 rounded-2xl p-5 h-[180px]" />
            <div className="bg-white/50 border-2 border-[#9abbd8]/20 rounded-2xl p-5 h-[180px]" />
          </div>
          <div className="bg-white/50 border-2 border-[#9abbd8]/20 rounded-2xl p-6 h-[280px]" />
          <div className="bg-white/50 border-2 border-[#9abbd8]/20 rounded-2xl p-6 h-[200px]" />
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
