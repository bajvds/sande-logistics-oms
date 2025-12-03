'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AutoRefreshProps {
  intervalSeconds?: number;
  showIndicator?: boolean;
}

export function AutoRefresh({ intervalSeconds = 30, showIndicator = true }: AutoRefreshProps) {
  const router = useRouter();
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(intervalSeconds);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const countdown = setInterval(() => {
      setSecondsUntilRefresh((prev) => {
        if (prev <= 1) {
          router.refresh();
          return intervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [router, intervalSeconds, isPaused]);

  if (!showIndicator) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`} />
      {isPaused ? (
        <button 
          onClick={() => setIsPaused(false)}
          className="hover:text-foreground"
        >
          Auto-refresh gepauzeerd - Klik om te hervatten
        </button>
      ) : (
        <button 
          onClick={() => setIsPaused(true)}
          className="hover:text-foreground"
        >
          Refresh over {secondsUntilRefresh}s
        </button>
      )}
    </div>
  );
}


