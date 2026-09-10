import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  PlannerApiResponse,
  PlannerItemType,
  PlannerModalMode,
  PlannerPackage,
  PlannerView,
  TripDetails,
} from '@/types';

interface PlanStore {
  view: PlannerView;
  setView: (view: PlannerView) => void;
  
  apiResponse: PlannerApiResponse | null;
  setApiResponse: (response: PlannerApiResponse | null) => void;
  
  loading: boolean;
  setLoading: (loading: boolean) => void;
  
  tripDetails: TripDetails;
  setTripDetails: (details: Partial<TripDetails>) => void;
  
  customizedPlan: PlannerPackage | null;
  setCustomizedPlan: (plan: PlannerPackage | null) => void;
  
  swapModalOpen: boolean;
  setSwapModalOpen: (open: boolean) => void;
  
  itemToSwap: PlannerItemType | null;
  setItemToSwap: (item: PlannerItemType | null) => void;
  
  modalMode: PlannerModalMode;
  setModalMode: (mode: PlannerModalMode) => void;
  
  modalError: string;
  setModalError: (error: string) => void;
  
  resetStore: () => void;
}

export const usePlanStore = create<PlanStore>()(
  persist(
    (set) => ({
      view: "FORM",
      setView: (view) => set({ view }),
      
      apiResponse: null,
      setApiResponse: (apiResponse) => set({ apiResponse }),
      
      loading: false,
      setLoading: (loading) => set({ loading }),
      
      tripDetails: { budget: 0, travellers: 0, days: 0, destination: "", isSafetyTrip: false },
      setTripDetails: (details) => set((state) => ({ 
        tripDetails: { ...state.tripDetails, ...details } 
      })),
      
      customizedPlan: null,
      setCustomizedPlan: (customizedPlan) => set({ customizedPlan }),
      
      swapModalOpen: false,
      setSwapModalOpen: (swapModalOpen) => set({ swapModalOpen }),
      
      itemToSwap: null,
      setItemToSwap: (itemToSwap) => set({ itemToSwap }),
      
      modalMode: 'swap',
      setModalMode: (modalMode) => set({ modalMode }),
      
      modalError: "",
      setModalError: (modalError) => set({ modalError }),
      
      resetStore: () => set({
        view: "FORM",
        apiResponse: null,
        loading: false,
        tripDetails: { budget: 0, travellers: 0, days: 0, destination: "", isSafetyTrip: false },
        customizedPlan: null,
        swapModalOpen: false,
        itemToSwap: null,
        modalMode: 'swap',
        modalError: ""
      })
    }),
    {
      name: 'plan-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ 
        view: state.view,
        apiResponse: state.apiResponse,
        tripDetails: state.tripDetails,
        customizedPlan: state.customizedPlan
      })
    }
  )
);
