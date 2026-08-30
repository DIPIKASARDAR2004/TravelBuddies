import { create } from 'zustand';

type ViewState = "FORM" | "TIERS" | "CUSTOMIZE";
type SwapItemType = 'hotel' | 'restaurant' | 'activity' | 'transport' | null;

interface TripDetails {
  budget: number;
  travellers: number;
  days: number;
  destination: string;
}

interface PlanStore {
  view: ViewState;
  setView: (view: ViewState) => void;
  
  apiResponse: any;
  setApiResponse: (response: any) => void;
  
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
  
  modalError: string;
  setModalError: (error: string) => void;
  
  resetStore: () => void;
}

export const usePlanStore = create<PlanStore>((set) => ({
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
  
  modalError: "",
  setModalError: (modalError) => set({ modalError }),
  
  resetStore: () => set({
    view: "FORM",
    apiResponse: null,
    loading: false,
    tripDetails: { budget: 0, travellers: 0, days: 0, destination: "" },
    customizedPlan: null,
    swapModalOpen: false,
    itemToSwap: null,
    modalError: ""
  })
}));
