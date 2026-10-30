import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Smartphone, Banknote, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentSelectionProps {
    amount: number;
    currency?: string;
    onSelect: (method: 'mpesa' | 'cash' | 'stripe' | 'paypal', details?: { phoneNumber?: string }) => void;
    isProcessing?: boolean;
    defaultPhone?: string;
    stkStatus?: 'idle' | 'prompted' | 'polling' | 'success' | 'failed';
    stkMessage?: string;
}

export default function PaymentSelection({
    amount,
    currency = "KES",
    onSelect,
    isProcessing,
    defaultPhone = "",
    stkStatus = 'idle',
    stkMessage
}: PaymentSelectionProps) {
    const [selectedTab, setSelectedTab] = useState<'mpesa' | 'cash' | 'stripe' | 'paypal'>('mpesa');
    const [phone, setPhone] = useState(defaultPhone || "");
    const [phoneError, setPhoneError] = useState("");

    const handleTriggerMpesa = () => {
        const cleaned = phone.replace(/[\s\+\-\(\)]/g, '');
        if (!cleaned || cleaned.length < 9) {
            setPhoneError("Please enter a valid Safaricom phone number (e.g. 0712345678)");
            return;
        }
        setPhoneError("");
        onSelect('mpesa', { phoneNumber: phone });
    };

    return (
        <div className="space-y-6">
            {/* Amount Banner */}
            <div className="text-center p-4 rounded-2xl bg-[#2E5E43]/10 border border-[#2E5E43]/20">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contribution Amount</p>
                <p className="text-3xl sm:text-4xl font-black text-[#2E5E43] dark:text-[#CCB88B] mt-1">
                    {currency} {Number(amount || 0).toLocaleString()}
                </p>
            </div>

            {/* Selection Options */}
            <div className="space-y-3">
                {/* 1. M-PESA STK PUSH */}
                <div
                    className={cn(
                        "rounded-2xl border-2 transition-all overflow-hidden",
                        selectedTab === 'mpesa'
                            ? "border-[#2E5E43] bg-[#2E5E43]/5 shadow-sm"
                            : "border-border hover:border-[#CCB88B]/60 bg-card"
                    )}
                >
                    <button
                        type="button"
                        onClick={() => setSelectedTab('mpesa')}
                        className="w-full p-4 flex items-center justify-between text-left"
                    >
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                                <Smartphone className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-base text-foreground">Lipa Na M-Pesa (STK Push)</h4>
                                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                        Instant Prompt
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Send prompt to your Safaricom phone; enter PIN to complete
                                </p>
                            </div>
                        </div>
                        {selectedTab === 'mpesa' && (
                            <CheckCircle2 className="h-5 w-5 text-[#2E5E43] shrink-0" />
                        )}
                    </button>

                    {selectedTab === 'mpesa' && (
                        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-[#2E5E43]/15">
                            <div className="space-y-1.5">
                                <Label htmlFor="mpesa-phone" className="text-xs font-bold text-foreground">
                                    Safaricom Phone Number:
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="mpesa-phone"
                                        type="tel"
                                        placeholder="07XX XXX XXX or 254..."
                                        value={phone}
                                        onChange={(e) => {
                                            setPhone(e.target.value);
                                            setPhoneError("");
                                        }}
                                        disabled={isProcessing || stkStatus === 'polling'}
                                        className="h-11 rounded-xl text-sm"
                                    />
                                    <Button
                                        type="button"
                                        onClick={handleTriggerMpesa}
                                        disabled={isProcessing || stkStatus === 'polling'}
                                        className="bg-[#2E5E43] hover:bg-[#234934] text-white font-bold h-11 px-5 rounded-xl shrink-0"
                                    >
                                        {stkStatus === 'polling' ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Waiting for PIN...
                                            </>
                                        ) : (
                                            "Send STK Push"
                                        )}
                                    </Button>
                                </div>
                                {phoneError && (
                                    <p className="text-xs text-red-500 font-medium">{phoneError}</p>
                                )}
                            </div>

                            {stkMessage && (
                                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
                                    {stkMessage}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 2. CASH ON EVENT DAY / PAY ON ARRIVAL */}
                <div
                    className={cn(
                        "rounded-2xl border-2 transition-all overflow-hidden",
                        selectedTab === 'cash'
                            ? "border-[#2E5E43] bg-[#2E5E43]/5 shadow-sm"
                            : "border-border hover:border-[#CCB88B]/60 bg-card"
                    )}
                >
                    <button
                        type="button"
                        onClick={() => setSelectedTab('cash')}
                        className="w-full p-4 flex items-center justify-between text-left"
                    >
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                                <Banknote className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-base text-foreground">Pay on Arrival (Cash on Event Day)</h4>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                        In-Person
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Confirm attendance now, bring your cash pledge to reception on event day
                                </p>
                            </div>
                        </div>
                        {selectedTab === 'cash' && (
                            <CheckCircle2 className="h-5 w-5 text-[#2E5E43] shrink-0" />
                        )}
                    </button>

                    {selectedTab === 'cash' && (
                        <div className="px-4 pb-4 pt-1 border-t border-[#2E5E43]/15">
                            <Button
                                type="button"
                                onClick={() => onSelect('cash')}
                                disabled={isProcessing}
                                className="w-full bg-[#CCB88B] hover:bg-[#bfa979] text-[#2E5E43] font-black h-11 rounded-xl"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Confirming Pledge...
                                    </>
                                ) : (
                                    "Confirm Cash Pledge on Arrival"
                                )}
                            </Button>
                        </div>
                    )}
                </div>

                {/* 3. CREDIT / DEBIT CARD (STRIPE) */}
                <div
                    className={cn(
                        "rounded-2xl border-2 transition-all overflow-hidden",
                        selectedTab === 'stripe'
                            ? "border-[#2E5E43] bg-[#2E5E43]/5 shadow-sm"
                            : "border-border hover:border-[#CCB88B]/60 bg-card"
                    )}
                >
                    <button
                        type="button"
                        onClick={() => setSelectedTab('stripe')}
                        className="w-full p-4 flex items-center justify-between text-left"
                    >
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-xl bg-slate-700 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                                <CreditCard className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-base text-foreground">Debit / Credit Card (Visa, MasterCard)</h4>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Secure online card checkout powered by Stripe
                                </p>
                            </div>
                        </div>
                        {selectedTab === 'stripe' && (
                            <CheckCircle2 className="h-5 w-5 text-[#2E5E43] shrink-0" />
                        )}
                    </button>

                    {selectedTab === 'stripe' && (
                        <div className="px-4 pb-4 pt-1 border-t border-[#2E5E43]/15">
                            <Button
                                type="button"
                                onClick={() => onSelect('stripe')}
                                disabled={isProcessing}
                                className="w-full bg-[#2E5E43] hover:bg-[#234934] text-white font-bold h-11 rounded-xl"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Redirecting to Stripe...
                                    </>
                                ) : (
                                    `Proceed with Card (${currency} ${Number(amount || 0).toLocaleString()})`
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Trust and Safety Alert */}
            <div className="bg-muted/60 border border-border p-3.5 rounded-2xl flex gap-3 text-muted-foreground text-xs leading-relaxed">
                <AlertCircle className="h-4 w-4 text-[#CCB88B] shrink-0 mt-0.5" />
                <p>
                    All contributions directly sponsor hot meals, learning stationery, and outreach logistics for children’s homes and street families in Kenya. Official receipts generated immediately.
                </p>
            </div>
        </div>
    );
}
