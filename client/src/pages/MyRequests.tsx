import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Calendar, Download, Clock, CheckCircle, Ticket, Heart, Bell, Search } from "lucide-react";
import { format, isBefore } from "date-fns";
import HeroSection from "@/components/HeroSection";
import { generateTicketPDF } from "@/lib/ticket-generator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { usePaymentStore } from "@/stores/usePaymentStore";

interface Booking {
    id: string;
    eventId: string;
    status: string;
    category: string;
    amount?: number;
    amountPaid?: number;
    pledged_amount?: number;
    is_pledge?: boolean;
    reminder_frequency?: 'DAILY' | 'EVERY_3_DAYS' | 'WEEKLY' | 'NONE';
    pledge_due_date?: string;
    installment_history?: Array<{ amount: number; date: string; method?: string; receipt?: string }>;
    guest_name?: string;
    guest_email?: string;
    guest_phone?: string;
    attendance_type?: 'ATTENDING' | 'DONATING_ONLY';
    delivery_method?: 'ONLINE_DELIVERY' | 'IN_PERSON_EVENT_DAY';
    item_contributions?: string[];
    volunteer_activities?: string[];
    mingle_notes?: string;
    seek_to_adopt?: boolean;
    wish_note?: string;
    payment_status?: string;
    createdAt: string;
    event: any;
}

function getCountdownText(targetDateStr?: string) {
    if (!targetDateStr) return "Open Deadline";
    const target = new Date(targetDateStr);
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    if (diff <= 0) return "Outreach Date Reached";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    return `${days}d ${hours}h ${mins}m remaining`;
}

export default function MyRequests() {
    const { user, profile } = useAuth();
    const { toast } = useToast();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [installmentAmounts, setInstallmentAmounts] = useState<Record<string, string>>({});
    const [guestQuery, setGuestQuery] = useState("");
    const [guestLookingUp, setGuestLookingUp] = useState(false);
    const { openPayment } = usePaymentStore();
    const [, setLocation] = useLocation();

    useEffect(() => {
        if (user) {
            fetchData();
        } else {
            setLoading(false);
        }

        const params = new URLSearchParams(window.location.search);
        const status = params.get('status');
        const bookingId = params.get('bookingId');
        const type = params.get('type') || 'event';

        if (status === 'success' && bookingId) {
            handleSuccessfulPayment(bookingId, type);
            window.history.replaceState({}, '', window.location.pathname);
            if (user) fetchData();
        } else if (status === 'cancelled') {
            toast({
                title: "Payment Cancelled",
                description: "Your transaction was not completed. You can finalize it anytime below.",
                variant: "destructive"
            });
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [user]);

    const fetchData = async () => {
        try {
            const { data: bData, error: bError } = await supabase
                .from('Booking')
                .select('*, event:Event(*)')
                .eq('userId', user?.id)
                .order('createdAt', { ascending: false });

            if (bError) throw bError;
            setBookings(bData || []);
        } catch (error) {
            console.error("Error fetching bookings & pledges:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleGuestLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!guestQuery.trim()) return;
        setGuestLookingUp(true);
        try {
            const res = await fetch(`/api/pledges/lookup?query=${encodeURIComponent(guestQuery.trim())}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Lookup failed");
            setBookings(data.bookings || []);
            if (!data.bookings?.length) {
                toast({
                    title: "No Matching Records",
                    description: "No bookings or pledges found for that phone number, email, or reference ID.",
                });
            }
        } catch (err: any) {
            toast({ title: "Lookup Error", description: err.message, variant: "destructive" });
        } finally {
            setGuestLookingUp(false);
        }
    };

    const handleSuccessfulPayment = async (bookingId: string, type: string = 'event') => {
        try {
            if (type === 'event' || type === 'donation' || type === 'pledge_installment') {
                const { data: booking, error: bookingError } = await supabase
                    .from('Booking')
                    .select('*, event:Event(*)')
                    .eq('id', bookingId)
                    .maybeSingle();

                if (!bookingError && booking) {
                    generateTicketPDF({
                        eventTitle: booking.event?.title || "The Voice of Hope Charity Outreach",
                        eventDate: booking.event?.date ? format(new Date(booking.event.date), 'PPPP') : format(new Date(), 'PPPP'),
                        eventLocation: booking.event?.location || "Nairobi, Kenya",
                        userName: profile?.name || booking.guest_name || user?.email?.split('@')[0] || "Supporter",
                        userEmail: user?.email || booking.guest_email || '',
                        category: booking.category,
                        amountPaid: Number(booking.amountPaid),
                        bookingId: booking.id
                    });
                }

                toast({ title: "Contribution Processed!", description: "Your receipt has been generated and your pledge/booking updated." });
            }
        } catch (error: any) {
            console.error("Error generating receipt:", error);
        }
    };

    const handleDownloadTicket = (booking: Booking) => {
        generateTicketPDF({
            eventTitle: booking.event?.title || "The Voice of Hope Charity Outreach",
            eventDate: booking.event?.date ? format(new Date(booking.event.date), 'PPPP') : format(new Date(), 'PPPP'),
            eventLocation: booking.event?.location || "Nairobi, Kenya",
            userName: profile?.name || booking.guest_name || user?.email?.split('@')[0] || "Supporter",
            userEmail: user?.email || booking.guest_email || "",
            category: booking.category,
            amountPaid: Number(booking.amountPaid || booking.amount || 0),
            bookingId: booking.id,
            attendanceType: booking.attendance_type,
            deliveryMethod: booking.delivery_method,
            itemContributions: booking.item_contributions
        });
    };

    const activePledges = bookings.filter((b) => b.is_pledge && Number(b.pledged_amount) > Number(b.amountPaid || 0));

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <HeroSection
                backgroundImageUrl="/images/hero_Events.gif"
                title="My Outreach Bookings & Pledges"
                subtitle="Track your charity outreach participation, pay pledge installments in bits, and download receipts."
            />

            <div className="container mx-auto px-4 py-16 space-y-16">
                {/* Guest / Quick Lookup Banner if not signed in or looking up another pledge */}
                <Card className="border border-border bg-card shadow-sm rounded-3xl">
                    <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                                <Search className="w-5 h-5 text-primary" />
                                Find a Guest Pledge or Donation
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Donated or made a pledge without an account? Enter your phone number, email, or booking ID to view your countdown and pay your next installment bit.
                            </p>
                        </div>
                        <form onSubmit={handleGuestLookup} className="flex w-full md:w-auto gap-2">
                            <Input
                                value={guestQuery}
                                onChange={(e) => setGuestQuery(e.target.value)}
                                placeholder="Phone (07...), Email, or Booking ID"
                                className="min-w-[240px] bg-background"
                            />
                            <Button type="submit" disabled={guestLookingUp} className="bg-primary text-primary-foreground font-bold shrink-0">
                                {guestLookingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lookup"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Active Pledges (Payment in Bits) Section */}
                {activePledges.length > 0 && (
                    <section>
                        <div className="flex items-center gap-3 mb-8">
                            <Bell className="h-8 w-8 text-[#b8240d]" />
                            <div>
                                <h2 className="text-3xl font-bold text-foreground">Active Pledges (Pay in Bits)</h2>
                                <p className="text-sm text-muted-foreground">Contribute any installment amount toward your pledge before the outreach countdown ends.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {activePledges.map((pledge) => {
                                const totalPledged = Number(pledge.pledged_amount || 0);
                                const paidSoFar = Number(pledge.amountPaid || 0);
                                const remaining = Math.max(0, totalPledged - paidSoFar);
                                const progressPct = totalPledged > 0 ? Math.min(100, Math.round((paidSoFar / totalPledged) * 100)) : 0;
                                const dueDate = pledge.pledge_due_date || pledge.event?.date;
                                const nextBitInput = installmentAmounts[pledge.id] ?? String(Math.min(remaining, Math.max(500, Math.round(remaining / 2))));

                                return (
                                    <Card key={`pledge-${pledge.id}`} className="border-2 border-primary/20 bg-card shadow-lg rounded-3xl overflow-hidden">
                                        <CardHeader className="p-6 pb-3 bg-primary/5 border-b border-border">
                                            <div className="flex justify-between items-start gap-4">
                                                <div>
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#b8240d]/10 text-[#b8240d] mb-2">
                                                        <Clock className="w-3.5 h-3.5" /> {getCountdownText(dueDate)}
                                                    </span>
                                                    <CardTitle className="text-xl font-bold text-foreground">
                                                        {pledge.event?.title || "Charity Outreach Pledge"}
                                                    </CardTitle>
                                                </div>
                                                <span className="text-xs font-bold uppercase px-2.5 py-1 rounded-lg bg-card border border-border text-muted-foreground">
                                                    Reminders: {pledge.reminder_frequency || 'WEEKLY'}
                                                </span>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-6 space-y-5">
                                            <div>
                                                <div className="flex justify-between text-sm font-bold mb-2">
                                                    <span className="text-muted-foreground">Paid: <strong className="text-foreground">KES {paidSoFar.toLocaleString()}</strong></span>
                                                    <span className="text-primary">Target: KES {totalPledged.toLocaleString()} ({progressPct}%)</span>
                                                </div>
                                                <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary transition-all duration-500 rounded-full"
                                                        style={{ width: `${progressPct}%` }}
                                                    />
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    Remaining Balance: <strong className="text-[#b8240d]">KES {remaining.toLocaleString()}</strong>
                                                </p>
                                            </div>

                                            {Array.isArray(pledge.installment_history) && pledge.installment_history.length > 0 && (
                                                <div className="p-3 rounded-2xl bg-muted/40 border border-border text-xs space-y-1">
                                                    <p className="font-bold text-foreground mb-1">Recent Installment Bits Paid:</p>
                                                    {pledge.installment_history.slice(-3).map((inst, idx) => (
                                                        <div key={idx} className="flex justify-between text-muted-foreground">
                                                            <span>Bit #{idx + 1} ({inst.method || 'Payment'})</span>
                                                            <span className="font-semibold text-foreground">KES {Number(inst.amount).toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="pt-2 border-t border-border space-y-3">
                                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                                                    Pay Next Installment Bit (KES)
                                                </label>
                                                <div className="flex gap-3">
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        max={remaining}
                                                        value={nextBitInput}
                                                        onChange={(e) => setInstallmentAmounts((prev) => ({ ...prev, [pledge.id]: e.target.value }))}
                                                        className="font-bold bg-background"
                                                    />
                                                    <Button
                                                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shrink-0 px-6"
                                                        onClick={() => {
                                                            const bitAmount = Math.max(1, Number(nextBitInput) || remaining);
                                                            openPayment({
                                                                amount: bitAmount,
                                                                bookingId: pledge.id,
                                                                type: 'pledge_installment',
                                                                eventId: pledge.eventId,
                                                                title: `Pledge Installment: ${pledge.event?.title || 'Outreach'}`,
                                                                currency: 'KES',
                                                                returnUrl: '/my-requests',
                                                                isInstallment: true,
                                                                pledgedAmount: totalPledged,
                                                                guestName: pledge.guest_name,
                                                                guestEmail: pledge.guest_email,
                                                                guestPhone: pledge.guest_phone
                                                            });
                                                        }}
                                                    >
                                                        <Heart className="w-4 h-4 mr-2 fill-current" />
                                                        Pay Bit Now
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* All Event Bookings & Donations Section */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <Calendar className="h-8 w-8 text-primary" />
                        <h2 className="text-3xl font-bold text-foreground">My Outreach Bookings & Contributions</h2>
                    </div>

                    {bookings.length === 0 ? (
                        <div className="bg-card rounded-3xl p-12 text-center border border-dashed border-border">
                            <p className="text-muted-foreground">No outreach bookings or donations found yet.</p>
                            <Button asChild variant="link" className="mt-2 text-primary font-bold">
                                <Link href="/upcoming-events">Browse Upcoming Outreaches</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {bookings.map((booking) => (
                                <Card key={booking.id} className="overflow-hidden border border-border bg-card shadow-lg hover:shadow-xl transition-all group">
                                    <div className="aspect-video relative overflow-hidden bg-muted">
                                        <img
                                            src={booking.event?.heroImageUrl || booking.event?.imageUrls?.[0] || "/images/IMG-20261026-WA0026.jpg"}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            alt={booking.event?.title || "Outreach"}
                                        />
                                        <div className={cn(
                                            "absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg",
                                            booking.status === 'CONFIRMED' ? "bg-emerald-600 text-white" :
                                                booking.status === 'PLEDGED' ? "bg-[#04047a] text-white" : "bg-amber-500 text-white"
                                        )}>
                                            {booking.status}
                                        </div>
                                    </div>
                                    <CardHeader className="p-6">
                                        <CardTitle className="text-xl font-bold line-clamp-1 text-foreground">
                                            {booking.event?.title || "General Charity Contribution"}
                                        </CardTitle>
                                        {booking.event?.date && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                                                <Calendar className="h-4 w-4 text-primary" />
                                                {format(new Date(booking.event.date), 'PPP')}
                                            </div>
                                        )}
                                    </CardHeader>
                                    <CardContent className="p-6 pt-0 space-y-3">
                                        <div className="flex justify-between items-center text-xs">
                                            <div>
                                                <p className="text-muted-foreground">Participation</p>
                                                <p className="font-bold text-primary">
                                                    {booking.attendance_type === 'ATTENDING' ? 'Attending in Person' : 'Remote Donation & Wishes'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-muted-foreground">{booking.is_pledge ? 'Paid / Pledged' : 'Contribution'}</p>
                                                <p className="font-bold text-foreground">
                                                    KES {Number(booking.amountPaid || 0).toLocaleString()}
                                                    {booking.is_pledge && Number(booking.pledged_amount) > 0
                                                        ? ` / ${Number(booking.pledged_amount).toLocaleString()}`
                                                        : ''}
                                                </p>
                                            </div>
                                        </div>

                                        {booking.item_contributions && booking.item_contributions.length > 0 && (
                                            <div className="text-xs">
                                                <p className="text-muted-foreground font-medium">Contributed Items:</p>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {booking.item_contributions.map((it: string, i: number) => (
                                                        <span key={i} className="px-2 py-0.5 rounded-md bg-primary/10 text-[10px] font-semibold text-primary">
                                                            {it}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {booking.delivery_method && (
                                            <p className="text-[11px] text-muted-foreground">
                                                Delivery: <span className="font-semibold text-foreground">{booking.delivery_method === 'ONLINE_DELIVERY' ? 'Courier / Online Delivery' : 'Bringing on Outreach Day (In-Person)'}</span>
                                            </p>
                                        )}

                                        <div className="pt-2 border-t border-border flex justify-end items-center gap-2">
                                            {booking.status === 'CONFIRMED' || Number(booking.amountPaid) > 0 ? (
                                                <Button size="sm" onClick={() => handleDownloadTicket(booking)} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                                                    <Download className="h-4 w-4" /> Receipt / Pass
                                                </Button>
                                            ) : null}
                                            {booking.status === 'PENDING' && (
                                                booking.event?.date && isBefore(new Date(booking.event.date), new Date()) ? (
                                                    <span className="text-[10px] font-bold text-red-500 uppercase bg-red-500/10 px-2 py-1 rounded-md">Closed</span>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="gap-2 border-primary text-primary hover:bg-primary/10"
                                                        onClick={() => setLocation(`/upcoming-events?id=${booking.eventId}&resume=true&bookingId=${booking.id}`)}
                                                    >
                                                        <Ticket className="h-4 w-4" /> Complete Checkout
                                                    </Button>
                                                )
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
