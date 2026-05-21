import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface UIState {
  sidebarOpen: boolean;
  notifications: Notification[];
  activeModal: string | null;
  soundEnabled: boolean;
  toggleSidebar: () => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  toggleSound: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarOpen: true,
      notifications: [],
      activeModal: null,
      soundEnabled: true,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      addNotification: (notification) => {
        const id = crypto.randomUUID();
        const newNotif = { ...notification, id };
        set({ notifications: [...get().notifications, newNotif] });
        setTimeout(() => {
          set({ notifications: get().notifications.filter((n) => n.id !== id) });
        }, 5000);
      },
      removeNotification: (id) =>
        set({ notifications: get().notifications.filter((n) => n.id !== id) }),
      openModal: (modalId) => set({ activeModal: modalId }),
      closeModal: () => set({ activeModal: null }),
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({ soundEnabled: state.soundEnabled }),
    }
  )
);
