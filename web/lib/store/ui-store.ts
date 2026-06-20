import { create } from "zustand";

/**
 * Lightweight global UI state — chrome only (not server data, which lives in
 * TanStack Query). Sidebar collapse + the ⌘K command menu, used from L1.
 */
interface UiState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (value: boolean) => void;
  commandOpen: boolean;
  setCommandOpen: (value: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
  commandOpen: false,
  setCommandOpen: (value) => set({ commandOpen: value }),
}));
