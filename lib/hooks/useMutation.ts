import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export function useMutation(key?: string) {
  const router = useRouter();

  const mutate = useCallback(async (url?: string) => {
    if (url) {
      router.refresh();
    }
  }, [router]);

  return mutate;
}
