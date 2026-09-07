"use client";

import { useSyncExternalStore } from "react";

const subscribe = (): (() => void) => () => {};
const getSnapshot = (): boolean => true;
const getServerSnapshot = (): boolean => false;

/**
 * `false` during SSR and the first client render, `true` afterwards.
 *
 * For values the server cannot possibly know — `prefers-reduced-motion`, a
 * viewport size, anything in localStorage. Rendering those directly produces a
 * hydration mismatch and React throws the tree away.
 *
 * useSyncExternalStore rather than the usual `useEffect(() => setMounted(true))`
 * because React 19 correctly objects to setting state synchronously in an
 * effect body; this hook is the sanctioned way to express exactly the same idea.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
