import { create } from 'zustand';

export interface PaymentData {
    amount: number;
    currency?: string;
    bookingId: string;
    type: 'event' | 'donation' | 'pledge_installment';
    eventId?: string;
    category?: string;
    title?: string;
    description?: string;
    returnUrl?: string;
    guestName?: string;
    guestEmail?: string;
    guestPhone?: string;
    isInstallment?: boolean;
    pledgedAmount?: number;
}

interface PaymentStore {
    isOpen: boolean;
    paymentData: PaymentData | null;
    isProcessing: boolean;
    openPayment: (data: PaymentData) => void;
    closePayment: () => void;
    setIsProcessing: (isProcessing: boolean) => void;
}

export const usePaymentStore = create<PaymentStore>((set) => ({
    isOpen: false,
    paymentData: null,
    isProcessing: false,
    openPayment: (data) => set({ isOpen: true, paymentData: data, isProcessing: false }),
    closePayment: () => set({ isOpen: false, paymentData: null, isProcessing: false }),
    setIsProcessing: (isProcessing) => set({ isProcessing }),
}));
