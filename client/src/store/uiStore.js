import { create } from 'zustand';

const initialTheme = localStorage.getItem('kolab_theme') || 'dark';

if (initialTheme === 'dark') {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

const useUIStore = create((set) => ({
  // Di layar kecil (HP) sidebar mulai tertutup agar tidak menutupi halaman
  sidebarOpen: typeof window === 'undefined' ? true : window.innerWidth >= 1024,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  theme: initialTheme,
  toggleTheme: () =>
    set((state) => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('kolab_theme', nextTheme);
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { theme: nextTheme };
    }),

  toasts: [],
  addToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { id: Date.now(), ...toast }],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

export default useUIStore;
