import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import {
    Heart,
    Calendar,
    MapPin,
    PackageCheck,
    CheckCircle2,
    Users,
    Utensils,
    Gamepad2,
    Smile,
    HeartHandshake,
    Coins,
    Loader2,
    Bell,
    Clock,
    UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { generateTicketPDF } from "@/lib/ticket-generator";

interface EventDonationModalProps {
    event: any | null;
    isOpen: boolean;
    onClose: () => void;
    onProceedToPayment?: (bookingData: {
        id: string;
        amount: number;
        title: string;
        currency?: string;
        guestName?: string;
        guestEmail?: string;
        guestPhone?: string;
        isInstallment?: boolean;
        pledgedAmount?: number;
    }) => void;
}

export default function EventDonationModal({
    event,
    isOpen,
    onClose,
    onProceedToPayment
}: EventDonationModalProps) {
    const { user, profile } = useAuth();
    const [, setLocation] = useLocation();
    const { toast } = useToast();

    // Guest Supporter Details (used when !user)
    const [guestName, setGuestName] = useState<string>("");
    const [guestPhone, setGuestPhone] = useState<string>("");
    const [guestEmail, setGuestEmail] = useState<string>("");

    // Mode: ATTENDING vs DONATING_ONLY
    const [attendanceType, setAttendanceType] = useState<"ATTENDING" | "DONATING_ONLY">("DONATING_ONLY");

    // Accepted Item contributions
    const contributionOptions = [
        { id: "Money", label: "Money / Finances", icon: "💵" },
        { id: "Food", label: "Food & Dry Rations", icon: "🍲" },
        { id: "Clothing", label: "Clothing & Blankets", icon: "👕" },
        { id: "Learning materials", label: "Books & Stationery", icon: "📚" },
        { id: "Electronics", label: "Electronics", icon: "⚡" },
        { id: "Laptops", label: "Laptops", icon: "💻" },
        { id: "Phones", label: "Phones", icon: "📱" },
        { id: "Computers", label: "Computers / Desktops", icon: "🖥️" },
        { id: "Shoes", label: "Shoes & Footwear", icon: "👟" },
        { id: "Utensils", label: "Utensils & Cookware", icon: "🍽️" },
        { id: "Self", label: "Self (Presence & Time)", icon: "🤝" }
    ];

    const [selectedContributions, setSelectedContributions] = useState<string[]>(["Money"]);

    // Delivery method
    const [deliveryMethod, setDeliveryMethod] = useState<"IN_PERSON_EVENT_DAY" | "ONLINE_DELIVERY">("IN_PERSON_EVENT_DAY");

    // Financial contribution mode: ONLINE (Instant Full Donation), PLEDGE (Pay in Bits with Reminders), or CASH_EVENT_DAY
    const [moneyPaymentMethod, setMoneyPaymentMethod] = useState<"ONLINE" | "PLEDGE" | "CASH_EVENT_DAY">("ONLINE");
    const [donationAmount, setDonationAmount] = useState<number>(1000);

    // Pledge ("Pay in Bits") state
    const [pledgedAmount, setPledgedAmount] = useState<number>(5000);
    const [initialBitAmount, setInitialBitAmount] = useState<number>(1000);
    const [reminderFrequency, setReminderFrequency] = useState<"DAILY" | "EVERY_3_DAYS" | "WEEKLY">("EVERY_3_DAYS");

    // Event Day Volunteer Roles
    const [volunteerActivities, setVolunteerActivities] = useState<string[]>(["Work in kitchen"]);
    const [mingleNotes, setMingleNotes] = useState<string>("");
    const [seekToAdopt, setSeekToAdopt] = useState<boolean>(false);

    // Well wishes message
    const [wishNote, setWishNote] = useState<string>("");

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (event) {
            if (event.defaultDonationAmount && Number(event.defaultDonationAmount) > 0) {
                setDonationAmount(Number(event.defaultDonationAmount));
                setPledgedAmount(Math.max(Number(event.defaultDonationAmount), 2000));
            }
            if (event.defaultMode === 'PLEDGE') {
                setSelectedContributions((prev) => prev.includes("Money") ? prev : ["Money", ...prev]);
                setMoneyPaymentMethod("PLEDGE");
            } else if (event.defaultMode === 'DIRECT') {
                setSelectedContributions((prev) => prev.includes("Money") ? prev : ["Money", ...prev]);
                setMoneyPaymentMethod("ONLINE");
            }
        }
    }, [event]);

    if (!event) return null;

    const eventDateObj = event.date ? new Date(event.date) : new Date(Date.now() + 14 * 86400000);
    const diffMs = Math.max(0, eventDateObj.getTime() - Date.now());
    const countdownDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const countdownHours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);

    const toggleContribution = (item: string) => {
        let updated: string[];
        if (selectedContributions.includes(item)) {
            updated = selectedContributions.filter((c) => c !== item);
        } else {
            updated = [...selectedContributions, item];
        }
        setSelectedContributions(updated);

        const hasPhysical = updated.some((c) => c !== "Money" && c !== "Self");
        if (hasPhysical) {
            setDeliveryMethod("IN_PERSON_EVENT_DAY");
        }
    };

    const toggleVolunteerActivity = (role: string) => {
        if (volunteerActivities.includes(role)) {
            setVolunteerActivities(volunteerActivities.filter((r) => r !== role));
        } else {
            setVolunteerActivities([...volunteerActivities, role]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate Guest fields when not signed in
        if (!user) {
            if (!guestName.trim() || !guestPhone.trim()) {
                toast({
                    title: "Your Contact Details Required",
                    description: "Please enter your Full Name and Phone Number so we can issue your receipt and send outreach updates.",
                    variant: "destructive"
                });
                return;
            }
        }

        const hasMoney = selectedContributions.includes("Money");
        const isPledge = hasMoney && moneyPaymentMethod === "PLEDGE";
        const isCashOnArrival = hasMoney && moneyPaymentMethod === "CASH_EVENT_DAY";
        const isDirectOnline = hasMoney && moneyPaymentMethod === "ONLINE";

        if (isPledge && pledgedAmount <= 0) {
            toast({
                title: "Invalid Pledge Amount",
                description: "Please enter a valid total pledge amount in KES.",
                variant: "destructive"
            });
            return;
        }

        const amountToPayNow = isDirectOnline
            ? Math.max(0, Number(donationAmount))
            : isPledge
                ? Math.max(0, Number(initialBitAmount))
                : isCashOnArrival
                    ? Math.max(0, Number(donationAmount))
                    : 0;

        const shouldOpenCheckout = (isDirectOnline && amountToPayNow > 0) || (isPledge && amountToPayNow > 0);
        const finalStatus = shouldOpenCheckout ? "PENDING" : isPledge ? "PLEDGED" : "CONFIRMED";
        const paymentStatus = shouldOpenCheckout
            ? "PENDING"
            : isPledge
                ? "PARTIAL_PLEDGE"
                : isCashOnArrival
                    ? "PENDING_CASH_ON_ARRIVAL"
                    : "PAID";
        const paymentMethod = shouldOpenCheckout
            ? "MPESA"
            : isPledge
                ? "PLEDGE"
                : isCashOnArrival
                    ? "CASH_EVENT_DAY"
                    : "VOLUNTEER_PLEDGE";

        setIsSubmitting(true);
        try {
            const payload = {
                userId: user?.id || null,
                eventId: event.id || null,
                guest_name: !user ? guestName.trim() : (profile?.name || null),
                guest_email: !user ? (guestEmail.trim() || null) : (user?.email || null),
                guest_phone: !user ? guestPhone.trim() : (profile?.phone || null),
                category: attendanceType === "ATTENDING" ? "ATTENDEE_CONTRIBUTOR" : "DONOR_SUPPORTER",
                amountPaid: shouldOpenCheckout ? amountToPayNow : (isCashOnArrival ? amountToPayNow : 0),
                pledged_amount: isPledge ? Number(pledgedAmount) : 0,
                is_pledge: isPledge,
                reminder_frequency: isPledge ? reminderFrequency : "NONE",
                pledge_due_date: isPledge ? eventDateObj.toISOString() : null,
                status: finalStatus,
                payment_status: paymentStatus,
                payment_method: paymentMethod,
                attendance_type: attendanceType,
                delivery_method: deliveryMethod,
                item_contributions: selectedContributions,
                volunteer_activities: attendanceType === "ATTENDING" ? volunteerActivities : [],
                mingle_notes: mingleNotes.trim() || null,
                seek_to_adopt: seekToAdopt,
                wish_note: wishNote.trim() || null
            };

            let createdBooking: any = null;

            // Create via backend endpoint (supports both guest & authenticated users)
            const response = await fetch("/api/bookings/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const resJson = await response.json();
                createdBooking = resJson.booking;
            } else {
                // Fallback direct Supabase insert
                const { data: directBooking, error: directError } = await supabase
                    .from("Booking")
                    .insert(payload)
                    .select()
                    .single();
                if (directError) throw directError;
                createdBooking = directBooking;
            }

            const donorDisplayName = profile?.name || guestName.trim() || user?.email?.split('@')[0] || "Valued Supporter";
            const donorDisplayEmail = user?.email || guestEmail.trim() || "";
            const donorDisplayPhone = profile?.phone || guestPhone.trim() || "";

            if (shouldOpenCheckout && onProceedToPayment) {
                onProceedToPayment({
                    id: createdBooking.id,
                    amount: amountToPayNow,
                    title: isPledge
                        ? `Pledge Installment Bit: ${event.title}`
                        : `Charity Contribution: ${event.title}`,
                    currency: "KES",
                    guestName: donorDisplayName,
                    guestEmail: donorDisplayEmail,
                    guestPhone: donorDisplayPhone,
                    isInstallment: isPledge,
                    pledgedAmount: isPledge ? Number(pledgedAmount) : undefined
                });
                onClose();
            } else {
                generateTicketPDF({
                    eventTitle: event.title || "The Voice of Hope Charity Outreach",
                    eventDate: format(eventDateObj, 'PPPP'),
                    eventLocation: event.location || "Nairobi, Kenya",
                    userName: donorDisplayName,
                    userEmail: donorDisplayEmail,
                    category: isPledge
                        ? `Pledge Registered (KES ${Number(pledgedAmount).toLocaleString()})`
                        : attendanceType === "ATTENDING"
                            ? "In-Person Attendee & Volunteer"
                            : "Remote Donor & Well-Wisher",
                    amountPaid: amountToPayNow,
                    bookingId: createdBooking.id
                });

                toast({
                    title: isPledge
                        ? `Pledge of KES ${Number(pledgedAmount).toLocaleString()} Recorded! 🔔`
                        : isCashOnArrival
                            ? "Attendance & Cash Pledge Confirmed! 🤝"
                            : "Registration Confirmed! ❤️",
                    description: isPledge
                        ? `Countdown: ${countdownDays}d ${countdownHours}h left! You will receive ${reminderFrequency.toLowerCase().replace(/_/g, ' ')} reminders and can pay in bits anytime in My Bookings & Pledges.`
                        : "Your official pass/receipt has been downloaded. Thank you for standing with The Voice of Hope Kenya!"
                });
                onClose();
            }
        } catch (err: any) {
            console.error("Booking submission error:", err);
            toast({
                title: "Error Recording Details",
                description: err.message || "Something went wrong. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const hasPhysicalItems = selectedContributions.some((c) => c !== "Money" && c !== "Self");

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto bg-card border-border shadow-2xl p-6 sm:p-8 rounded-3xl">
                <DialogHeader className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#b8240d] animate-pulse"></span>
                        <span className="text-xs font-bold uppercase tracking-widest text-primary">
                            The Voice of Hope Kenya — Charity Outreach & Giving
                        </span>
                    </div>
                    <DialogTitle className="text-2xl sm:text-3xl font-black text-foreground">
                        {event.title || "Support Our Charity Outreach"}
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm text-muted-foreground flex flex-wrap items-center gap-3 pt-1">
                        <span className="inline-flex items-center gap-1 font-medium text-foreground">
                            <Calendar className="w-4 h-4 text-primary" />
                            {format(eventDateObj, "PPP")}
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 font-medium text-foreground">
                            <MapPin className="w-4 h-4 text-[#b8240d]" />
                            {event.location || "Nairobi, Kenya"}
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 font-bold text-[#b8240d]">
                            <Clock className="w-3.5 h-3.5" />
                            {countdownDays}d {countdownHours}h left
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    {/* Guest Supporter Details (When not logged in — No account required) */}
                    {!user && (
                        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                                    <UserCheck className="w-4 h-4" />
                                    Quick Guest Details (Donate Without Creating an Account)
                                </Label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onClose();
                                        setLocation(`/auth?redirectTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
                                    }}
                                    className="text-[11px] font-bold text-primary underline hover:opacity-80"
                                >
                                    Have an account? Sign in
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-foreground">Full Name *</Label>
                                    <Input
                                        required
                                        value={guestName}
                                        onChange={(e) => setGuestName(e.target.value)}
                                        placeholder="e.g. Jane Wanjiku"
                                        className="h-10 text-xs bg-background"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-foreground">Phone (M-Pesa / SMS) *</Label>
                                    <Input
                                        required
                                        type="tel"
                                        value={guestPhone}
                                        onChange={(e) => setGuestPhone(e.target.value)}
                                        placeholder="07XX XXX XXX"
                                        className="h-10 text-xs bg-background"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-foreground">Email (Optional)</Label>
                                    <Input
                                        type="email"
                                        value={guestEmail}
                                        onChange={(e) => setGuestEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="h-10 text-xs bg-background"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Primary Step: Participation Choice */}
                    <div className="space-y-3">
                        <Label className="text-sm font-bold text-foreground">
                            1. How would you love to participate?
                        </Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div
                                onClick={() => setAttendanceType("DONATING_ONLY")}
                                className={cn(
                                    "p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between",
                                    attendanceType === "DONATING_ONLY"
                                        ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                                        : "border-border hover:border-primary/40 bg-card"
                                )}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="w-10 h-10 rounded-xl bg-[#b8240d] text-white flex items-center justify-center font-bold">
                                        <Heart className="w-5 h-5 fill-white" />
                                    </div>
                                    {attendanceType === "DONATING_ONLY" && (
                                        <CheckCircle2 className="w-5 h-5 text-primary" />
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-bold text-base text-foreground">
                                        Donate or Make a Pledge
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                        Give any amount now or pledge to pay in bits with regular countdown reminders.
                                    </p>
                                </div>
                            </div>

                            <div
                                onClick={() => setAttendanceType("ATTENDING")}
                                className={cn(
                                    "p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between",
                                    attendanceType === "ATTENDING"
                                        ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                                        : "border-border hover:border-primary/40 bg-card"
                                )}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    {attendanceType === "ATTENDING" && (
                                        <CheckCircle2 className="w-5 h-5 text-primary" />
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-bold text-base text-foreground">
                                        Attend & Volunteer in Person
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                        Join us on outreach day to cook in the kitchen, mentor youth, play games, and share gifts.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 2: What would you love to contribute? */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-bold text-foreground">
                                2. Select contributions you'd love to make:
                            </Label>
                            <span className="text-[11px] text-muted-foreground">Multiple selections allowed</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {contributionOptions.map((item) => {
                                const isSelected = selectedContributions.includes(item.id);
                                return (
                                    <button
                                        type="button"
                                        key={item.id}
                                        onClick={() => toggleContribution(item.id)}
                                        className={cn(
                                            "p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 text-left transition-all",
                                            isSelected
                                                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                                : "border-border bg-muted/30 hover:bg-muted text-foreground"
                                        )}
                                    >
                                        <span className="text-base">{item.icon}</span>
                                        <span className="truncate">{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Step 3: Financial Donation or Pledge Details */}
                    {selectedContributions.includes("Money") && (
                        <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 space-y-4">
                            <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                <Coins className="w-4 h-4 text-primary" />
                                3. Choose How You Would Like to Give (Kenya Shillings - KES)
                            </Label>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                <button
                                    type="button"
                                    onClick={() => setMoneyPaymentMethod("ONLINE")}
                                    className={cn(
                                        "p-3 rounded-xl border font-bold flex flex-col items-center justify-center gap-1 transition-all",
                                        moneyPaymentMethod === "ONLINE"
                                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                            : "bg-card border-border text-foreground hover:bg-muted"
                                    )}
                                >
                                    <span>Donate Full Amount Now</span>
                                    <span className="text-[10px] opacity-80 font-normal">M-Pesa / Card / PayPal</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMoneyPaymentMethod("PLEDGE")}
                                    className={cn(
                                        "p-3 rounded-xl border font-bold flex flex-col items-center justify-center gap-1 transition-all",
                                        moneyPaymentMethod === "PLEDGE"
                                            ? "bg-[#b8240d] text-white border-[#b8240d] shadow-sm"
                                            : "bg-card border-border text-foreground hover:bg-muted"
                                    )}
                                >
                                    <span>Make a Pledge (Pay in Bits)</span>
                                    <span className="text-[10px] opacity-80 font-normal">Installments + Reminders</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMoneyPaymentMethod("CASH_EVENT_DAY")}
                                    className={cn(
                                        "p-3 rounded-xl border font-bold flex flex-col items-center justify-center gap-1 transition-all",
                                        moneyPaymentMethod === "CASH_EVENT_DAY"
                                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                            : "bg-card border-border text-foreground hover:bg-muted"
                                    )}
                                >
                                    <span>Cash on Outreach Day</span>
                                    <span className="text-[10px] opacity-80 font-normal">Pay at Venue Reception</span>
                                </button>
                            </div>

                            {moneyPaymentMethod === "PLEDGE" ? (
                                <div className="space-y-4 pt-2 border-t border-border">
                                    <div className="p-3 rounded-xl bg-card border border-border flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Bell className="w-4 h-4 text-[#b8240d] animate-bounce" />
                                            <span className="text-xs font-bold text-foreground">
                                                Pledge Countdown to Outreach Day:
                                            </span>
                                        </div>
                                        <span className="text-xs font-black text-[#b8240d] px-2.5 py-1 rounded-full bg-[#b8240d]/10">
                                            {countdownDays} Days, {countdownHours} Hrs Left
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-foreground">Total Amount You Are Pledging (KES):</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {[2000, 5000, 10000, 25000, 50000].map((amt) => (
                                                <button
                                                    type="button"
                                                    key={amt}
                                                    onClick={() => {
                                                        setPledgedAmount(amt);
                                                        if (initialBitAmount > amt) setInitialBitAmount(Math.round(amt / 4));
                                                    }}
                                                    className={cn(
                                                        "flex-1 min-w-[75px] py-2 rounded-xl border text-xs font-bold transition-all",
                                                        pledgedAmount === amt
                                                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                                            : "bg-card border-border text-foreground hover:bg-muted"
                                                    )}
                                                >
                                                    KES {amt.toLocaleString()}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-semibold text-foreground">Custom Total Pledge (KES)</Label>
                                            <Input
                                                type="number"
                                                min={100}
                                                value={pledgedAmount}
                                                onChange={(e) => setPledgedAmount(Number(e.target.value))}
                                                className="h-10 font-bold bg-background"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs font-semibold text-foreground">
                                                First Bit to Pay Today (KES) <span className="text-[10px] text-muted-foreground">(0 to pay later)</span>
                                            </Label>
                                            <Input
                                                type="number"
                                                min={0}
                                                max={pledgedAmount}
                                                value={initialBitAmount}
                                                onChange={(e) => setInitialBitAmount(Number(e.target.value))}
                                                className="h-10 font-bold bg-background"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-foreground">
                                            Regular Countdown Reminder Frequency:
                                        </Label>
                                        <div className="grid grid-cols-3 gap-2 text-xs">
                                            {[
                                                { id: "DAILY", label: "Daily Reminder" },
                                                { id: "EVERY_3_DAYS", label: "Every 3 Days" },
                                                { id: "WEEKLY", label: "Weekly Reminder" }
                                            ].map((freq) => (
                                                <button
                                                    type="button"
                                                    key={freq.id}
                                                    onClick={() => setReminderFrequency(freq.id as any)}
                                                    className={cn(
                                                        "py-2 px-3 rounded-xl border font-bold transition-all",
                                                        reminderFrequency === freq.id
                                                            ? "bg-[#b8240d] text-white border-[#b8240d]"
                                                            : "bg-card border-border text-foreground hover:bg-muted"
                                                    )}
                                                >
                                                    {freq.label}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-[11px] text-muted-foreground">
                                            We will send you gentle countdown reminders so you can pay your pledge in smaller bits at your convenience before the outreach date.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2 pt-1">
                                    <div className="flex flex-wrap gap-2">
                                        {[500, 1000, 2500, 5000, 10000].map((amt) => (
                                            <button
                                                type="button"
                                                key={amt}
                                                onClick={() => setDonationAmount(amt)}
                                                className={cn(
                                                    "flex-1 min-w-[70px] py-2 rounded-xl border text-xs font-bold transition-all",
                                                    donationAmount === amt
                                                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                                        : "bg-card border-border text-foreground hover:bg-muted"
                                                )}
                                            >
                                                KES {amt.toLocaleString()}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-2 pt-1">
                                        <span className="text-xs font-medium text-muted-foreground">Enter Any Amount You Wish (KES):</span>
                                        <Input
                                            type="number"
                                            min={10}
                                            value={donationAmount}
                                            onChange={(e) => setDonationAmount(Number(e.target.value))}
                                            className="h-10 w-40 text-sm font-bold bg-background"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 4: Physical Items Notice */}
                    {hasPhysicalItems && (
                        <div className="p-3.5 rounded-2xl bg-muted/40 border border-border flex items-start gap-3">
                            <PackageCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                                <h5 className="font-bold text-xs sm:text-sm text-foreground">
                                    Physical Items Delivery Method
                                </h5>
                                <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                                    Your donated items (food, clothes, books, electronics) are scheduled to be <strong>delivered in person on outreach day</strong> or coordinated with our Nairobi HQ team.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Volunteer Activities (Only if ATTENDING) */}
                    {attendanceType === "ATTENDING" && (
                        <div className="space-y-3 p-4 rounded-2xl bg-muted/40 border border-border">
                            <Label className="text-sm font-bold text-foreground flex items-center gap-2">
                                <Users className="w-4 h-4 text-primary" />
                                Volunteer Activities on Outreach Day
                            </Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {[
                                    { id: "Work in kitchen", label: "Work in the kitchen (Cook together)", icon: Utensils },
                                    { id: "Play games", label: "Play games & outdoor sports", icon: Gamepad2 },
                                    { id: "Mingle with kids", label: "Mingle & Mentor children", icon: Smile }
                                ].map((act) => {
                                    const active = volunteerActivities.includes(act.id);
                                    return (
                                        <button
                                            type="button"
                                            key={act.id}
                                            onClick={() => toggleVolunteerActivity(act.id)}
                                            className={cn(
                                                "p-3 rounded-xl border text-left font-semibold flex items-center gap-2 transition-all",
                                                active
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "bg-card border-border text-foreground hover:bg-muted"
                                            )}
                                        >
                                            <act.icon className="w-4 h-4 shrink-0" />
                                            <span>{act.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {volunteerActivities.includes("Mingle with kids") && (
                                <div className="space-y-1.5 pt-1">
                                    <Label className="text-xs font-semibold text-foreground">
                                        Specify what you would love to do with the kids:
                                    </Label>
                                    <Input
                                        value={mingleNotes}
                                        onChange={(e) => setMingleNotes(e.target.value)}
                                        placeholder="E.g., storytelling, art & craft, tutoring, singing, life skills mentorship..."
                                        className="h-9 text-xs bg-background"
                                    />
                                </div>
                            )}

                            <div className="pt-2">
                                <label className="flex items-start gap-2.5 cursor-pointer p-2.5 rounded-xl border border-dashed border-primary/40 bg-primary/5">
                                    <input
                                        type="checkbox"
                                        checked={seekToAdopt}
                                        onChange={(e) => setSeekToAdopt(e.target.checked)}
                                        className="mt-0.5 rounded text-primary focus:ring-primary"
                                    />
                                    <div>
                                        <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                            <HeartHandshake className="w-3.5 h-3.5 text-primary" />
                                            Seek to Adopt (Adoption Inquiry)
                                        </p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            Check this box if you are interested in learning about legal child adoption or foster guardianship procedures during our visit.
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Step 6: Well Wishes & Heartfelt Message */}
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-foreground">
                            {attendanceType === "ATTENDING"
                                ? "Heartfelt Note or Prayer (Optional)"
                                : "Words of Encouragement & Well Wishes"}
                        </Label>
                        <Textarea
                            rows={2}
                            value={wishNote}
                            onChange={(e) => setWishNote(e.target.value)}
                            placeholder="Write an encouraging message or blessing for the children, elderly, and street families..."
                            className="resize-none text-xs sm:text-sm bg-background"
                        />
                    </div>

                    {/* Organizer Support Contact Card */}
                    <div className="p-3.5 rounded-2xl bg-muted/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                            <p className="font-bold text-foreground">Need Assistance or Custom Delivery?</p>
                            <p className="text-muted-foreground">
                                The Voice of Hope Support:{" "}
                                <a href="tel:+254798182108" className="text-primary font-semibold underline">
                                    +254 798 182 108
                                </a>{" "}
                                /{" "}
                                <a href="tel:+254798332690" className="text-primary font-semibold underline">
                                    +254 798 332 690
                                </a>
                            </p>
                        </div>
                        <div className="shrink-0 flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5 text-[#b8240d]" />
                            <span>HQ Nairobi, Kenya</span>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-[#b8240d] hover:bg-[#991d0a] text-white font-bold px-8 h-12 rounded-xl shadow-lg transition-all hover:scale-105"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : selectedContributions.includes("Money") && moneyPaymentMethod === "PLEDGE" ? (
                                initialBitAmount > 0
                                    ? `Pledge KES ${pledgedAmount.toLocaleString()} & Pay First Bit (KES ${initialBitAmount.toLocaleString()})`
                                    : `Confirm Pledge of KES ${pledgedAmount.toLocaleString()} (Pay in Bits)`
                            ) : selectedContributions.includes("Money") && moneyPaymentMethod === "ONLINE" && donationAmount > 0 ? (
                                `Proceed to Checkout (KES ${donationAmount.toLocaleString()})`
                            ) : selectedContributions.includes("Money") && moneyPaymentMethod === "CASH_EVENT_DAY" ? (
                                `Confirm Cash on Arrival (KES ${donationAmount.toLocaleString()})`
                            ) : attendanceType === "ATTENDING" ? (
                                "Confirm Outreach Attendance"
                            ) : (
                                "Submit Contribution & Wishes"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
