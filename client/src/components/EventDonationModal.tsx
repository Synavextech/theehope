import { useState } from "react";
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
    Loader2
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

    // Mode: ATTENDING vs DONATING_ONLY
    const [attendanceType, setAttendanceType] = useState<"ATTENDING" | "DONATING_ONLY">("ATTENDING");

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

    const [selectedContributions, setSelectedContributions] = useState<string[]>(["Self"]);

    // Delivery method: automatically defaults to in-person delivery on event day
    const [deliveryMethod, setDeliveryMethod] = useState<"IN_PERSON_EVENT_DAY" | "ONLINE_DELIVERY">("IN_PERSON_EVENT_DAY");

    // Financial donation details in Kenya Shillings (KES)
    const [moneyPaymentMethod, setMoneyPaymentMethod] = useState<"ONLINE" | "CASH_EVENT_DAY">("ONLINE");
    const [donationAmount, setDonationAmount] = useState<number>(1000);

    // Event Day Volunteer Roles
    const [volunteerActivities, setVolunteerActivities] = useState<string[]>(["Work in kitchen"]);
    const [mingleNotes, setMingleNotes] = useState<string>("");
    const [seekToAdopt, setSeekToAdopt] = useState<boolean>(false);

    // Well wishes message
    const [wishNote, setWishNote] = useState<string>("");

    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!event) return null;

    const toggleContribution = (item: string) => {
        let updated: string[];
        if (selectedContributions.includes(item)) {
            updated = selectedContributions.filter((c) => c !== item);
        } else {
            updated = [...selectedContributions, item];
        }
        setSelectedContributions(updated);

        // Rule: If selected items are physical items, automatically adopt to be delivered on event day
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

        if (!user) {
            toast({
                title: "Sign in Required",
                description: "Please sign in or create an account to record your attendance or donation.",
                variant: "destructive"
            });
            setLocation(`/auth?redirectTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
            return;
        }

        setIsSubmitting(true);
        try {
            const hasMoney = selectedContributions.includes("Money");
            const shouldPayOnline = hasMoney && moneyPaymentMethod === "ONLINE" && donationAmount > 0;
            const isCashOnArrival = hasMoney && moneyPaymentMethod === "CASH_EVENT_DAY";
            const finalAmount = hasMoney ? donationAmount : 0;
            const finalStatus = shouldPayOnline ? "PENDING" : "CONFIRMED";
            const paymentStatus = shouldPayOnline ? "PENDING" : isCashOnArrival ? "PENDING_CASH_ON_ARRIVAL" : "PAID";
            const paymentMethod = shouldPayOnline ? "MPESA" : isCashOnArrival ? "CASH_EVENT_DAY" : "VOLUNTEER_PLEDGE";

            const { data: booking, error } = await supabase
                .from("Booking")
                .insert({
                    userId: user.id,
                    eventId: event.id,
                    category: attendanceType === "ATTENDING" ? "ATTENDEE_CONTRIBUTOR" : "DONOR_SUPPORTER",
                    amountPaid: finalAmount,
                    currency: "KES",
                    status: finalStatus,
                    payment_status: paymentStatus,
                    payment_method: paymentMethod,
                    mode: "PHYSICAL",
                    attendance_type: attendanceType,
                    delivery_method: deliveryMethod,
                    item_contributions: selectedContributions,
                    volunteer_activities: attendanceType === "ATTENDING" ? volunteerActivities : [],
                    mingle_notes: mingleNotes.trim() || null,
                    seek_to_adopt: seekToAdopt,
                    wish_note: wishNote.trim() || null
                })
                .select()
                .single();

            if (error) throw error;

            if (shouldPayOnline && onProceedToPayment) {
                // Open M-Pesa / Card checkout modal
                onProceedToPayment({
                    id: booking.id,
                    amount: finalAmount,
                    title: `Charity Contribution: ${event.title}`,
                    currency: "KES"
                });
                onClose();
            } else {
                // Cash pledge or in-kind / presence donation: Generate confirmation ticket PDF immediately
                generateTicketPDF({
                    eventTitle: event.title,
                    eventDate: format(new Date(event.date), 'PPPP'),
                    eventLocation: event.location,
                    userName: profile?.name || user?.email?.split('@')[0] || "Contributor",
                    userEmail: user?.email || "",
                    category: attendanceType === "ATTENDING" ? "In-Person Attendee & Volunteer" : "Remote Donor & Well-Wisher",
                    amountPaid: finalAmount,
                    bookingId: booking.id
                });

                toast({
                    title: isCashOnArrival ? "Attendance & Cash Pledge Confirmed! 🤝" : "Registration Confirmed! ❤️",
                    description:
                        attendanceType === "ATTENDING"
                            ? "Your event pass has been downloaded. We can't wait to cook and spend quality time with you on event day!"
                            : "Thank you for your generous contribution and loving wishes for our community!"
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
                        <span className="w-2.5 h-2.5 rounded-full bg-[#2E5E43] animate-pulse"></span>
                        <span className="text-xs font-bold uppercase tracking-widest text-[#2E5E43] dark:text-[#CCB88B]">
                            The Voice of strength Kenya — Charity Outreach
                        </span>
                    </div>
                    <DialogTitle className="text-2xl sm:text-3xl font-black text-foreground">
                        {event.title}
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm text-muted-foreground flex flex-wrap items-center gap-3 pt-1">
                        <span className="inline-flex items-center gap-1 font-medium text-foreground">
                            <Calendar className="w-4 h-4 text-[#2E5E43] dark:text-[#CCB88B]" />
                            {format(new Date(event.date), "PPP")}
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 font-medium text-foreground">
                            <MapPin className="w-4 h-4 text-[#CCB88B]" />
                            {event.location}
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    {/* Primary Step: Attendance Choice */}
                    <div className="space-y-3">
                        <Label className="text-sm font-bold text-foreground">
                            1. How would you love to participate?
                        </Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div
                                onClick={() => setAttendanceType("ATTENDING")}
                                className={cn(
                                    "p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between",
                                    attendanceType === "ATTENDING"
                                        ? "border-[#2E5E43] bg-[#2E5E43]/5 ring-2 ring-[#2E5E43]/20 shadow-sm"
                                        : "border-border hover:border-[#CCB88B]/60 bg-card"
                                )}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="w-10 h-10 rounded-xl bg-[#2E5E43] text-white flex items-center justify-center font-bold">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    {attendanceType === "ATTENDING" && (
                                        <CheckCircle2 className="w-5 h-5 text-[#2E5E43]" />
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-bold text-base text-foreground">
                                        I will attend in person
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                        Join us on event day to cook in the kitchen, mentor youth, play games, and distribute gifts directly.
                                    </p>
                                </div>
                            </div>

                            <div
                                onClick={() => setAttendanceType("DONATING_ONLY")}
                                className={cn(
                                    "p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between",
                                    attendanceType === "DONATING_ONLY"
                                        ? "border-[#2E5E43] bg-[#2E5E43]/5 ring-2 ring-[#2E5E43]/20 shadow-sm"
                                        : "border-border hover:border-[#CCB88B]/60 bg-card"
                                )}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="w-10 h-10 rounded-xl bg-[#CCB88B] text-[#2E5E43] flex items-center justify-center font-bold">
                                        <Heart className="w-5 h-5 fill-[#2E5E43]" />
                                    </div>
                                    {attendanceType === "DONATING_ONLY" && (
                                        <CheckCircle2 className="w-5 h-5 text-[#2E5E43]" />
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-bold text-base text-foreground">
                                        I want to donate & wish you well
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                        Cannot be there in person, but sending financial support or supplies along with a message of hope.
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
                                                ? "border-[#2E5E43] bg-[#2E5E43] text-white shadow-sm"
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

                    {/* Step 3: Financial Donation Details (If Money is selected) */}
                    {selectedContributions.includes("Money") && (
                        <div className="p-4 rounded-2xl bg-[#2E5E43]/5 border border-[#2E5E43]/20 space-y-3">
                            <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                <Coins className="w-4 h-4 text-[#2E5E43] dark:text-[#CCB88B]" />
                                Voluntary Financial Contribution (Kenya Shillings - KES)
                            </Label>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <button
                                    type="button"
                                    onClick={() => setMoneyPaymentMethod("ONLINE")}
                                    className={cn(
                                        "p-2.5 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all",
                                        moneyPaymentMethod === "ONLINE"
                                            ? "bg-[#2E5E43] text-white border-[#2E5E43]"
                                            : "bg-card border-border text-foreground hover:bg-muted"
                                    )}
                                >
                                    <span>Lipa Na M-Pesa / Online Card</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMoneyPaymentMethod("CASH_EVENT_DAY")}
                                    className={cn(
                                        "p-2.5 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all",
                                        moneyPaymentMethod === "CASH_EVENT_DAY"
                                            ? "bg-[#2E5E43] text-white border-[#2E5E43]"
                                            : "bg-card border-border text-foreground hover:bg-muted"
                                    )}
                                >
                                    <span>Pay on Arrival (Cash on Event Day)</span>
                                </button>
                            </div>

                            {/* Preset Buttons in KES */}
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
                                                    ? "bg-[#CCB88B] text-[#2E5E43] border-[#CCB88B] shadow-sm"
                                                    : "bg-card border-border text-foreground hover:bg-muted"
                                            )}
                                        >
                                            KES {amt.toLocaleString()}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                    <span className="text-xs font-medium text-muted-foreground">Custom Amount (KES):</span>
                                    <Input
                                        type="number"
                                        min={50}
                                        value={donationAmount}
                                        onChange={(e) => setDonationAmount(Number(e.target.value))}
                                        className="h-9 w-36 text-sm font-bold"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Automatic Delivery Notice for Physical Items */}
                    {hasPhysicalItems && (
                        <div className="p-3.5 rounded-2xl bg-muted/40 border border-[#CCB88B]/40 flex items-start gap-3">
                            <PackageCheck className="w-5 h-5 text-[#2E5E43] shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                                <h5 className="font-bold text-xs sm:text-sm text-foreground">
                                    Physical Items Delivery Method
                                </h5>
                                <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                                    Your donated items (food, clothes, books, electronics) are automatically scheduled to be <strong>delivered in person on event day</strong> at the venue. If you need courier pickup assistance prior to the event, organizers will contact you.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Event Day Volunteer Activities (Only if ATTENDING) */}
                    {attendanceType === "ATTENDING" && (
                        <div className="space-y-3 p-4 rounded-2xl bg-muted/40 border border-border">
                            <Label className="text-sm font-bold text-foreground flex items-center gap-2">
                                <Users className="w-4 h-4 text-[#2E5E43]" />
                                Volunteer Activities on Event Day (What would you like to do?)
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
                                                    ? "bg-[#2E5E43] text-white border-[#2E5E43]"
                                                    : "bg-card border-border text-foreground hover:bg-muted"
                                            )}
                                        >
                                            <act.icon className="w-4 h-4 shrink-0" />
                                            <span>{act.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Mingle specification */}
                            {volunteerActivities.includes("Mingle with kids") && (
                                <div className="space-y-1.5 pt-1">
                                    <Label className="text-xs font-semibold text-foreground">
                                        Specify what you would love to do with the kids:
                                    </Label>
                                    <Input
                                        value={mingleNotes}
                                        onChange={(e) => setMingleNotes(e.target.value)}
                                        placeholder="E.g., storytelling, art & craft, tutoring, singing, life skills mentorship..."
                                        className="h-9 text-xs"
                                    />
                                </div>
                            )}

                            {/* Seek to Adopt checkbox */}
                            <div className="pt-2">
                                <label className="flex items-start gap-2.5 cursor-pointer p-2.5 rounded-xl border border-dashed border-[#CCB88B] bg-[#CCB88B]/10">
                                    <input
                                        type="checkbox"
                                        checked={seekToAdopt}
                                        onChange={(e) => setSeekToAdopt(e.target.checked)}
                                        className="mt-0.5 rounded text-[#2E5E43] focus:ring-[#2E5E43]"
                                    />
                                    <div>
                                        <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                            <HeartHandshake className="w-3.5 h-3.5 text-[#2E5E43]" />
                                            Seek to Adopt (Adoption Inquiry)
                                        </p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            Check this box if you are open to or interested in child adoption / legal foster guardianship procedures during our visit.
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
                            rows={3}
                            value={wishNote}
                            onChange={(e) => setWishNote(e.target.value)}
                            placeholder="Write an encouraging message or blessing for the children, elderly, and street families..."
                            className="resize-none text-xs sm:text-sm"
                        />
                    </div>

                    {/* Organizer Support Contact Card */}
                    <div className="p-3.5 rounded-2xl bg-muted/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                            <p className="font-bold text-foreground">Need Assistance or Custom Delivery?</p>
                            <p className="text-muted-foreground">
                                TheVoiceOfHope Support:{" "}
                                <a href="tel:+254798182108" className="text-[#2E5E43] dark:text-[#CCB88B] font-semibold underline">
                                    +254 798 182 108
                                </a>{" "}
                                /{" "}
                                <a href="tel:+254798332690" className="text-[#2E5E43] dark:text-[#CCB88B] font-semibold underline">
                                    +254 798 332 690
                                </a>
                            </p>
                        </div>
                        <div className="shrink-0 flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5 text-[#CCB88B]" />
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
                            className="bg-[#2E5E43] hover:bg-[#234934] text-white font-bold px-8 h-12 rounded-xl shadow-lg border border-[#CCB88B]/40 transition-all hover:scale-105"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : selectedContributions.includes("Money") && moneyPaymentMethod === "ONLINE" && donationAmount > 0 ? (
                                `Proceed to Donate KES ${donationAmount.toLocaleString()}`
                            ) : selectedContributions.includes("Money") && moneyPaymentMethod === "CASH_EVENT_DAY" ? (
                                `Confirm Cash Pledge (KES ${donationAmount.toLocaleString()})`
                            ) : attendanceType === "ATTENDING" ? (
                                "Confirm Event Attendance & Presence"
                            ) : (
                                "Submit Donation & Wishes"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
