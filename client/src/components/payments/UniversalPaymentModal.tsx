import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePaymentStore } from "@/stores/usePaymentStore";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import PaymentSelection from "./PaymentSelection";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { supabase } from "@/lib/supabase";
import { generateTicketPDF } from "@/lib/ticket-generator";
import { format } from "date-fns";
import { queryClient } from "@/lib/queryClient";

export default function UniversalPaymentModal() {
    const { isOpen, paymentData, isProcessing, closePayment, setIsProcessing } = usePaymentStore();
    const { user, profile } = useAuth();
    const { toast } = useToast();

    // STK Push state
    const [stkStatus, setStkStatus] = useState<'idle' | 'prompted' | 'polling' | 'success' | 'failed'>('idle');
    const [stkMessage, setStkMessage] = useState<string>("");
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        };
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setStkStatus('idle');
            setStkMessage("");
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        }
    }, [isOpen]);

    if (!isOpen || !paymentData) return null;

    // 1. M-PESA STK PUSH HANDLER
    const handleMpesaSTKPush = async (phoneNumber?: string) => {
        if (!phoneNumber) return;
        setIsProcessing(true);
        setStkStatus('prompted');
        setStkMessage("Contacting Safaricom Daraja... Please keep your phone unlocked.");

        try {
            const response = await fetch('/api/mpesa/stkpush', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phoneNumber,
                    amount: paymentData.amount,
                    bookingId: paymentData.bookingId,
                    userId: user?.id || null,
                    description: paymentData.title || 'Charity Donation'
                })
            });

            const result = await response.json();
            if (!response.ok || result.error) {
                throw new Error(result.error || 'Failed to initiate M-Pesa STK Push');
            }

            const checkoutRequestId = result.checkoutRequestId;
            setStkStatus('polling');
            setStkMessage(result.customerMessage || "PIN prompt sent to your phone! Please enter your M-Pesa PIN to complete payment.");

            let attempts = 0;
            const maxAttempts = 24;

            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

            pollIntervalRef.current = setInterval(async () => {
                attempts += 1;
                try {
                    const qRes = await fetch(`/api/mpesa/query/${checkoutRequestId}`);
                    const qData = await qRes.json();

                    if (qData.status === 'COMPLETED') {
                        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                        setStkStatus('success');
                        setIsProcessing(false);
                        await handlePaymentSuccess(paymentData.bookingId, paymentData.type, qData.receipt, 'MPESA');
                    } else if (qData.status === 'FAILED') {
                        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                        setStkStatus('failed');
                        setIsProcessing(false);
                        setStkMessage(qData.reason || "Payment was not completed. Please try again or choose another method.");
                    } else if (attempts >= maxAttempts) {
                        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                        setStkStatus('idle');
                        setIsProcessing(false);
                        setStkMessage("Polling timed out. If you received a confirmation SMS, your receipt will synchronize in My Bookings & Pledges shortly.");
                    }
                } catch (pollErr) {
                    console.log('STK Poll check error:', pollErr);
                }
            }, 2500);

        } catch (error: any) {
            console.error('M-Pesa STK error:', error);
            setStkStatus('failed');
            setIsProcessing(false);
            setStkMessage(error.message || "Failed to trigger M-Pesa STK Push.");
            toast({
                title: "M-Pesa Error",
                description: error.message || "Could not send STK prompt. Please check your phone number.",
                variant: "destructive"
            });
        }
    };

    // 2. CASH PAY ON ARRIVAL HANDLER
    const handlePayOnArrival = async () => {
        setIsProcessing(true);
        try {
            const response = await fetch('/api/booking/pay-on-arrival', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId: paymentData.bookingId,
                    userId: user?.id || null,
                    amount: paymentData.amount
                })
            });

            const result = await response.json();
            if (!response.ok || result.error) {
                throw new Error(result.error || 'Failed to confirm cash on arrival pledge');
            }

            await handlePaymentSuccess(paymentData.bookingId, paymentData.type, undefined, 'CASH_EVENT_DAY');
        } catch (error: any) {
            toast({
                title: "Error Recording Pledge",
                description: error.message || "Could not confirm cash pledge.",
                variant: "destructive"
            });
            setIsProcessing(false);
        }
    };

    // 3. STRIPE CARD HANDLER
    const handleStripePayment = async () => {
        setIsProcessing(true);
        try {
            const currentPath = window.location.pathname + window.location.search;
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId: paymentData.eventId || null,
                    category: paymentData.category || 'ATTENDEE_CONTRIBUTOR',
                    amount: paymentData.amount,
                    currency: paymentData.currency || 'kes',
                    userId: user?.id || null,
                    email: user?.email || paymentData.guestEmail || undefined,
                    bookingId: paymentData.bookingId,
                    type: paymentData.type,
                    isInstallment: paymentData.isInstallment || false,
                    returnUrl: paymentData.returnUrl || currentPath
                }),
            });
            const session = await response.json();
            if (session.error) throw new Error(session.error);

            if (session.url) {
                window.location.href = session.url;
            } else {
                throw new Error("Stripe checkout session URL is missing");
            }
        } catch (error: any) {
            toast({
                title: "Card Payment Error",
                description: error.message || "Failed to initiate card checkout session.",
                variant: "destructive"
            });
            setIsProcessing(false);
        }
    };

    // SUCCESS FINALIZER & TICKET GENERATOR
    const handlePaymentSuccess = async (
        bookingId: string,
        type: string,
        receiptNumber?: string,
        method: string = 'ONLINE'
    ) => {
        setIsProcessing(true);
        try {
            const { data: booking } = await supabase
                .from('Booking')
                .select('*, Event(*)')
                .eq('id', bookingId)
                .maybeSingle();

            generateTicketPDF({
                eventTitle: booking?.Event?.title || paymentData.title || "The Voice of Hope Charity Outreach",
                eventDate: booking?.Event?.date ? format(new Date(booking.Event.date), 'PPPP') : format(new Date(), 'PPPP'),
                eventLocation: booking?.Event?.location || "Nairobi, Kenya",
                userName: profile?.name || paymentData.guestName || booking?.guest_name || user?.email?.split('@')[0] || "Valued Supporter",
                userEmail: user?.email || paymentData.guestEmail || booking?.guest_email || "",
                category: booking?.category || (paymentData.isInstallment ? "Pledge Installment Bit" : "Supporter Contribution"),
                amountPaid: Number(booking?.amountPaid || paymentData.amount),
                bookingId: booking?.id || bookingId
            });

            toast({
                title: method === 'CASH_EVENT_DAY' ? "Pledge Confirmed! 🤝" : "Contribution Confirmed! ❤️",
                description:
                    method === 'CASH_EVENT_DAY'
                        ? "Your outreach pass has been generated. You may bring your cash donation on outreach day."
                        : `Your payment was verified${receiptNumber ? ` (Ref: ${receiptNumber})` : ''}. Your official receipt & pass has been downloaded!`
            });

            queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
            queryClient.invalidateQueries({ queryKey: ['upcoming-events'] });
            closePayment();
        } catch (err: any) {
            console.error("Success finalizer error:", err);
            closePayment();
        } finally {
            setIsProcessing(false);
        }
    };

    const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || "test";
    const usdAmountForPaypal = Math.max(1, Math.round(paymentData.amount / 130)).toString();

    return (
        <Dialog open={isOpen} onOpenChange={() => !isProcessing && closePayment()}>
            <DialogContent className="sm:max-w-lg rounded-3xl max-h-[92vh] overflow-y-auto bg-card border-border shadow-2xl p-6 sm:p-8">
                <DialogHeader className="text-center">
                    <DialogTitle className="text-2xl sm:text-3xl font-extrabold text-foreground">
                        {paymentData.title || "Confirm Your Contribution"}
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm text-muted-foreground pt-1">
                        {paymentData.isInstallment
                            ? `Paying an installment bit of KES ${Number(paymentData.amount).toLocaleString()} toward your pledge.`
                            : (paymentData.description || "Choose your preferred payment method to complete your donation or outreach booking.")}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 pt-3">
                    <PaymentSelection
                        amount={paymentData.amount}
                        currency={paymentData.currency || "KES"}
                        defaultPhone={profile?.phone || paymentData.guestPhone || ""}
                        isProcessing={isProcessing}
                        stkStatus={stkStatus}
                        stkMessage={stkMessage}
                        onSelect={(method, details) => {
                            if (method === 'mpesa') {
                                handleMpesaSTKPush(details?.phoneNumber);
                            } else if (method === 'cash') {
                                handlePayOnArrival();
                            } else if (method === 'stripe') {
                                handleStripePayment();
                            }
                        }}
                    />

                    {/* PayPal Fallback Option */}
                    <div className="relative pt-2">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border"></span>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-3 text-muted-foreground font-bold tracking-wider">
                                Or International PayPal
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-[11px] text-muted-foreground text-center">
                            PayPal checkout processes in USD (Approx. ${usdAmountForPaypal} USD)
                        </p>
                        <PayPalScriptProvider options={{ clientId: paypalClientId, currency: "USD" }}>
                            <PayPalButtons
                                style={{ layout: 'vertical', shape: 'pill', label: 'pay' }}
                                disabled={isProcessing}
                                createOrder={(_data, actions) => {
                                    return actions.order.create({
                                        intent: 'CAPTURE',
                                        purchase_units: [{
                                            description: `Charity Donation: ${paymentData.bookingId}`,
                                            amount: {
                                                currency_code: 'USD',
                                                value: usdAmountForPaypal
                                            },
                                            custom_id: paymentData.bookingId
                                        }]
                                    });
                                }}
                                onApprove={async (data, actions) => {
                                    if (actions.order) {
                                        await actions.order.capture();
                                        try {
                                            await fetch('/api/verify-paypal-order', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    orderId: data.orderID,
                                                    bookingId: paymentData.bookingId,
                                                    type: paymentData.type,
                                                    amount: paymentData.amount,
                                                    userId: user?.id || null
                                                })
                                            });
                                        } catch (verifyErr) {
                                            console.error("PayPal backend verify error:", verifyErr);
                                        }
                                        await handlePaymentSuccess(paymentData.bookingId, paymentData.type, data.orderID, 'PAYPAL');
                                    }
                                }}
                                onError={(err) => {
                                    console.error("PayPal Error:", err);
                                    toast({
                                        title: "PayPal Transaction Cancelled",
                                        description: "The PayPal window was closed or failed. Please try again or use M-Pesa.",
                                        variant: "destructive"
                                    });
                                }}
                            />
                        </PayPalScriptProvider>
                    </div>

                    <Button
                        variant="ghost"
                        className="w-full text-muted-foreground hover:text-foreground font-semibold"
                        onClick={closePayment}
                        disabled={isProcessing}
                    >
                        Close & Return
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
