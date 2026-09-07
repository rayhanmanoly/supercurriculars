'use client';

import { SWRConfig } from 'swr';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig 
      value={{
        // Global configuration
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        refreshInterval: 0, // Disable auto refresh by default
        dedupingInterval: 1000 * 60 * 2, // Default deduping interval
      }}
    >
      {children}
    </SWRConfig>
  );
}