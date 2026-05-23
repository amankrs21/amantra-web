import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ size = 24 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 size={size} className="animate-spin" style={{ color: 'var(--accent-blue)' }} />
    </div>
  );
}

export function SkeletonCards({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton h-32 rounded-2xl" />
      ))}
    </div>
  );
}
