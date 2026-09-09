import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { TripDetails, ApiResponse } from '@/types';

type ViewState = "FORM" | "TIERS" | "CUSTOMIZE";
type SwapItemType = 'hotel' | 'restaurant' | 'activity' | 'transport' | null;
type ModalMode = 'swap' | 'add';

interface PlanStore {
  view: ViewState;
  setView: (view: ViewState) => void;
  
  apiResponse: ApiResponse | null;
  setApiResponse: (response: ApiResponse | null) => void;
  
  loading: boolean;
  setLoading: (loading: boolean) => void;
  
  tripDetails: TripDetails;
  setTripDetails: (details: Partial<TripDetails>) => void;
  
  customizedPlan: any;
  setCustomizedPlan: (plan: any) => void;
  
  swapModalOpen: boolean;
  setSwapModalOpen: (open: boolean) => void;
  
  itemToSwap: SwapItemType;
  setItemToSwap: (item: SwapItemType) => void;
  
  modalMode: ModalMode;
  setModalMode: (mode: ModalMode) => void;
  
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
      
      tripDetails: { budget: 0, travellers: 0, days: 0, destination: "" },
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
