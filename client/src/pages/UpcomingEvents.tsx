import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, MapPin, Users, Bell, HelpCircle, ArrowRight, CheckCircle, Heart, Sparkles, Video } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isAfter, isToday } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import HeroSection from "@/components/HeroSection";
import Testimonials from "@/components/Testimonials";
import JoinUs from "@/components/JoinUs";
import EventDonationModal from "@/components/EventDonationModal";
import { useLocation } from "wouter";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { generateTicketPDF } from "@/lib/ticket-generator";
import { Input } from "@/components/ui/input";
import { usePaymentStore } from "@/stores/usePaymentStore";

function getYouTubeEmbedUrl(url?: string): string | null {
    if (!url) return null;
    try {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
            return `https://www.youtube.com/embed/${match[2]}`;
        }
    } catch {
        return null;
    }
    return null;
}

export default function UpcomingEvents() {
    const { user, isLoading } = useAuth();
    const { toast } = useToast();
    const [, setLocation] = useLocation();
    const [bookingEvent, setBookingEvent] = useState<any | null>(null);
    const { openPayment } = usePaymentStore();
    const [, setIsPaymentProcessing] = useState(false);
    const [, setResumingBookingId] = useState<string | null>(null);
    const [currentImageIdx, setCurrentImageIdx] = useState(0);
    const [quickCustomAmount, setQuickCustomAmount] = useState<string>("1000");

    // Countdown state
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

    // Parse event ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlEventId = urlParams.get('id');
    const paymentStatus = urlParams.get('status');
    const bookingIdFromUrl = urlParams.get('bookingId');

    const { data: events, isLoading: eventsLoading, error: fetchError } = useQuery({
        queryKey: ["events"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('Event')
                .select('*')
                .order('date', { ascending: true });
            if (error) {
                console.error("[Events] Supabase Fetch Error:", error);
                throw error;
            }
            return data;
        },
        retry: 1,
    });

    useEffect(() => {
        if (fetchError) {
            toast({
                title: "Failed to load events",
                description: "There was a problem connecting to the database. Please refresh or check your connection.",
                variant: "destructive"
            });
        }
    }, [fetchError, toast]);

    // Check for successful payment redirect
    useEffect(() => {
        if (paymentStatus === 'success' && bookingIdFromUrl) {
            const searchParams = new URLSearchParams(window.location.search);
            const type = searchParams.get('type') || 'event';
            handleSuccessfulPayment(bookingIdFromUrl, type);
            const newUrl = window.location.pathname + (urlEventId ? `?id=${urlEventId}` : '');
            window.history.replaceState({}, '', newUrl);
        } else if (paymentStatus === 'cancelled') {
            toast({ title: "Payment Cancelled", description: "Your transaction was not completed.", variant: "destructive" });
        }
    }, [paymentStatus, bookingIdFromUrl, urlEventId]);

    // Handle Resume Request
    useEffect(() => {
        const resume = urlParams.get('resume');
        const bookingId = urlParams.get('bookingId');

        if (resume === 'true' && urlEventId && events) {
            const event = events.find((e: any) => e.id === urlEventId);
            if (event) {
                setBookingEvent(event);
                if (bookingId) {
                    setResumingBookingId(bookingId);
                }
            }
        }
    }, [events, urlEventId]);

    async function handleSuccessfulPayment(bookingId: string, type: string = 'event') {
        setIsPaymentProcessing(true);
        try {
            if (type === 'event' || type === 'donation' || type === 'pledge_installment') {
                const { data: booking, error: bookingError } = await supabase
                    .from('Booking')
                    .select('*, Event(*)')
                    .eq('id', bookingId)
                    .maybeSingle();

                if (!bookingError && booking) {
                    generateTicketPDF({
                        eventTitle: booking.Event?.title || 'The Voice of Hope Charity Outreach',
                        eventDate: booking.Event?.date ? format(new Date(booking.Event.date), 'PPPP') : format(new Date(), 'PPPP'),
                        eventLocation: booking.Event?.location || 'Nairobi, Kenya',
                        userName: user?.name || booking.guest_name || 'Valued Supporter',
                        userEmail: user?.email || booking.guest_email || '',
                        category: booking.category,
                        amountPaid: Number(booking.amountPaid),
                        bookingId: booking.id
                    });
                }

                toast({ title: "Contribution Confirmed!", description: "Your official receipt & pass has been generated. Thank you for supporting The Voice of Hope!" });
            }
        } catch (error: any) {
            console.error("Error generating receipt or verifying booking:", error);
            toast({ title: "Receipt Notice", description: "Your contribution has been recorded.", variant: "default" });
        } finally {
            setIsPaymentProcessing(false);
        }
    }

    const upcomingEvents = useMemo(() => {
        if (!events) return [];
        const now = new Date();
        return (events as any[]).filter(event => {
            const eventDate = new Date(event.date);
            return isAfter(eventDate, now) || isToday(eventDate);
        });
    }, [events]);

    const selectedEvent = useMemo(() => {
        if (!urlEventId || !events) return null;
        return events.find((e: any) => e.id === urlEventId);
    }, [urlEventId, events]);

    useEffect(() => {
        if (!selectedEvent) return;

        const timer = setInterval(() => {
            const eventDate = new Date(selectedEvent.date);
            const now = new Date();
            const difference = eventDate.getTime() - now.getTime();

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                });
            } else {
                setTimeLeft(null);
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [selectedEvent]);

    // Media Gallery Shuffle Effect
    useEffect(() => {
        if (!selectedEvent?.imageUrls?.length) return;

        const interval = setInterval(() => {
            setCurrentImageIdx(prev => (prev + 1) % selectedEvent.imageUrls.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [selectedEvent?.imageUrls?.length]);

    if (eventsLoading || isLoading) return <div className="flex justify-center py-40"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;

    const embedVideoUrl = getYouTubeEmbedUrl(selectedEvent?.youtube_video_url);

    const mainContent = (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            {selectedEvent ? (
                <div className="flex flex-col min-h-screen">
                    {/* 1. Hero Section */}
                    <section className="relative min-h-[80vh] flex items-center pt-20 overflow-hidden bg-slate-950">
                        <div className="absolute inset-0 opacity-50">
                            <img src={selectedEvent.heroImageUrl || selectedEvent.imageUrls?.[0] || "/images/IMG-20261026-WA0026.jpg"} className="w-full h-full object-cover" alt={selectedEvent.title} />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-black/30" />

                        <div className="container mx-auto px-4 relative z-10 text-white py-12">
                            <div className="w-full max-w-4xl">
                                {selectedEvent.theme && (
                                    <span className="inline-block px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-[#CCB88B]/40 text-[#CCB88B] font-bold mb-6">
                                        {selectedEvent.theme}
                                    </span>
                                )}
                                <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight tracking-tight">
                                    {selectedEvent.title}
                                </h1>
                                <p className="text-lg md:text-xl text-slate-200 mb-8 leading-relaxed">
                                    {selectedEvent.description}
                                </p>
                                <div className="flex flex-wrap gap-6 text-base md:text-lg mb-6">
                                    <div className="flex items-center gap-2"><Calendar className="text-[#CCB88B]" /> {format(new Date(selectedEvent.date), 'PPPP')}</div>
                                    <div className="flex items-center gap-2"><MapPin className="text-[#b8240d]" /> {selectedEvent.location}</div>
                                </div>

                                {/* Charity Target and Organizer Contacts Strip */}
                                <div className="flex flex-wrap gap-4 text-sm mb-6">
                                    {Number(selectedEvent.target_amount) > 0 && (
                                        <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#CCB88B] block">Outreach Target Goal</span>
                                            <span className="text-xl font-black text-white">KES {Number(selectedEvent.target_amount).toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#CCB88B] block">Organizer Support Contact</span>
                                        <span className="text-sm font-bold text-white">{selectedEvent.organizer_contact || "+254 798 182 108 / +254 798 332 690"}</span>
                                    </div>
                                </div>

                                {/* Accepted Contributions */}
                                {selectedEvent.accepted_contributions && selectedEvent.accepted_contributions.length > 0 && (
                                    <div className="mb-8">
                                        <span className="text-xs font-bold uppercase tracking-wider text-[#CCB88B] block mb-2.5">
                                            Accepted Contributions & Donations:
                                        </span>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedEvent.accepted_contributions.map((c: string, idx: number) => (
                                                <span key={idx} className="px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-white border border-white/20">
                                                    {c}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Countdown Timer */}
                                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 md:p-8 max-w-2xl">
                                    <h3 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-2">
                                        <Bell className="text-[#CCB88B] animate-bounce" /> Time Remaining Until Outreach Day
                                    </h3>
                                    {timeLeft ? (
                                        <div className="grid grid-cols-4 gap-4">
                                            {[
                                                { label: 'Days', value: timeLeft.days },
                                                { label: 'Hrs', value: timeLeft.hours },
                                                { label: 'Min', value: timeLeft.minutes },
                                                { label: 'Sec', value: timeLeft.seconds }
                                            ].map((unit, idx) => (
                                                <div key={idx} className="flex flex-col items-center">
                                                    <span className="text-3xl md:text-5xl font-black tracking-tighter">{unit.value.toString().padStart(2, '0')}</span>
                                                    <span className="text-xs uppercase tracking-widest text-slate-300 mt-1">{unit.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-2xl font-bold text-amber-400">Outreach Day Reached</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 2. Participation Categories & Open Contribution / Pledge Box */}
                    <section className="py-20 bg-card border-y border-border">
                        <div className="container mx-auto px-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                                <div>
                                    <h2 className="text-3xl font-black mb-8 flex items-center gap-3 text-foreground">
                                        <span className="w-2 h-10 bg-primary rounded-full" />
                                        Ways to Participate & Support
                                    </h2>
                                    <div className="space-y-4">
                                        {[
                                            {
                                                title: "Hands-on Attendee & Volunteer",
                                                desc: "Join in person to cook in the kitchen, play outdoor games, and mentor youth and elders directly.",
                                                contribution: "Donate Any Amount or Items",
                                                mode: "In-Person Presence"
                                            },
                                            {
                                                title: "Remote Well-Wisher & Donor",
                                                desc: "Cannot attend in person, but sending monetary contributions, books, food, or clothes with well-wishes.",
                                                contribution: "Open Donation (No Account Required)",
                                                mode: "Remote / Global Support"
                                            },
                                            {
                                                title: "Pledge & Pay in Bits (Installments)",
                                                desc: "Commit a target pledge amount today and pay comfortably in smaller bits with helpful countdown reminders before the outreach.",
                                                contribution: "Flexible Installment Pledge",
                                                mode: "Countdown Reminder Alerts"
                                            },
                                            {
                                                title: "Partner & Community Sponsor",
                                                desc: "Organizations and groups supporting outreach logistics, equipment, medical packs, or dry rations.",
                                                contribution: "Partnership Contribution",
                                                mode: "Institutional Partner"
                                            }
                                        ].map((cat, i) => (
                                            <div key={i} className="p-6 rounded-2xl border border-border bg-muted/30 hover:border-primary/40 transition-all group">
                                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                                                    <div>
                                                        <h4 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{cat.title}</h4>
                                                        <p className="text-muted-foreground text-xs leading-relaxed max-w-sm mt-1">{cat.desc}</p>
                                                    </div>
                                                    <div className="sm:text-right shrink-0">
                                                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                                                            {cat.contribution}
                                                        </span>
                                                        <p className="text-[11px] text-muted-foreground mt-1">{cat.mode}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Direct Open Donation & Make a Pledge Card */}
                                <div className="p-8 rounded-3xl border-2 border-primary/20 bg-background shadow-xl space-y-6">
                                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                                        <Sparkles className="w-3.5 h-3.5" /> Open Heart Giving • Guest or Member
                                    </div>
                                    <h3 className="text-2xl md:text-3xl font-black text-foreground">
                                        Donate Any Amount or Make a Pledge
                                    </h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        No fixed seat tiers or proposals required. Simply choose or enter the amount you are willing to give—or make a pledge to pay in bits with regular countdown reminders—and proceed straight to checkout (even without creating an account).
                                    </p>

                                    <div className="space-y-3">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                                            Quick Select Amount (KES)
                                        </label>
                                        <div className="grid grid-cols-4 gap-2.5">
                                            {["500", "1000", "2500", "5000"].map((preset) => (
                                                <button
                                                    key={preset}
                                                    type="button"
                                                    onClick={() => setQuickCustomAmount(preset)}
                                                    className={`py-2.5 px-3 rounded-xl font-bold text-xs border transition-all ${
                                                        quickCustomAmount === preset
                                                            ? "bg-primary text-primary-foreground border-primary shadow-md"
                                                            : "bg-card text-foreground border-border hover:border-primary/40"
                                                    }`}
                                                >
                                                    KES {Number(preset).toLocaleString()}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="pt-2">
                                            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                                                Or Enter Your Own Custom Amount (KES)
                                            </label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={quickCustomAmount}
                                                onChange={(e) => setQuickCustomAmount(e.target.value)}
                                                placeholder="Enter any amount in KES"
                                                className="h-12 text-lg font-bold bg-card border-border"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                        <Button
                                            size="lg"
                                            className="w-full h-14 rounded-2xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                                            onClick={() => setBookingEvent({ ...selectedEvent, defaultDonationAmount: Number(quickCustomAmount) || 0, defaultMode: 'DIRECT' })}
                                        >
                                            <Heart className="mr-2 h-5 w-5 fill-current" />
                                            Donate & Checkout
                                        </Button>
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            className="w-full h-14 rounded-2xl font-bold border-2 border-primary text-primary hover:bg-primary/10"
                                            onClick={() => setBookingEvent({ ...selectedEvent, defaultDonationAmount: Number(quickCustomAmount) || 5000, defaultMode: 'PLEDGE' })}
                                        >
                                            <Bell className="mr-2 h-5 w-5" />
                                            Make a Pledge (Pay in Bits)
                                        </Button>
                                    </div>

                                    <p className="text-[11px] text-center text-muted-foreground">
                                        Supports M-Pesa STK Push, Card (Stripe), PayPal, and Cash on Outreach Day. No account login required.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Optional YouTube Outreach Video */}
                    {embedVideoUrl && (
                        <section className="py-16 bg-muted/30 border-b border-border">
                            <div className="container mx-auto px-4 max-w-4xl">
                                <div className="text-center mb-8">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase mb-2">
                                        <Video className="w-3.5 h-3.5" /> Mission Highlight Video
                                    </div>
                                    <h2 className="text-3xl font-bold text-foreground">Watch Our Outreach Story</h2>
                                </div>
                                <div className="aspect-video rounded-3xl overflow-hidden shadow-2xl border border-border bg-black">
                                    <iframe
                                        src={embedVideoUrl}
                                        title={selectedEvent.title}
                                        className="w-full h-full"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                            </div>
                        </section>
                    )}

                    {/* 3. Activities Section */}
                    {selectedEvent.activities?.length > 0 && (
                        <section className="py-24 bg-muted/20">
                            <div className="container mx-auto px-4">
                                <h2 className="text-4xl font-bold mb-16 text-center text-foreground">Outreach Itinerary</h2>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                    {selectedEvent.activities.map((day: any) => (
                                        <div key={day.day} className="space-y-6">
                                            <div className="bg-card p-6 rounded-2xl shadow-sm border-l-4 border-primary border border-border">
                                                <h3 className="text-2xl font-bold text-foreground">Day {day.day}</h3>
                                                <p className="text-primary font-semibold">{day.date}</p>
                                            </div>
                                            <div className="space-y-4">
                                                {day.items?.map((item: any, idx: number) => (
                                                    <div key={idx} className="bg-card p-6 rounded-2xl border border-border hover:border-primary/30 transition-colors">
                                                        <h4 className="font-bold text-lg mb-2 text-foreground">{item.title}</h4>
                                                        <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* 4. Outreach Participation & Contribution CTA */}
                    <section className="py-24 bg-[#04047a] dark:bg-slate-900 text-white text-center border-y border-white/10">
                        <div className="container mx-auto px-4">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[#CCB88B] text-xs font-bold uppercase tracking-wider mb-4">
                                <Heart className="w-4 h-4 text-[#CCB88B] fill-[#CCB88B]" />
                                Make a Tangible Difference
                            </div>
                            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
                                How Would You Love to Support?
                            </h2>
                            <p className="text-lg md:text-xl text-slate-200 max-w-3xl mx-auto mb-14 leading-relaxed">
                                Whether you walk with us into the children's home to cook together and mentor, donate any amount you are willing to give, or make a pledge to pay in bits—every gesture transforms lives!
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                                {/* Attend in Person */}
                                <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border-2 border-white/20 flex flex-col justify-between text-left hover:border-[#CCB88B] transition-all">
                                    <div>
                                        <div className="w-12 h-12 rounded-2xl bg-white/10 border-2 border-[#CCB88B] text-white flex items-center justify-center font-bold mb-4 shadow-lg">
                                            <Users className="w-6 h-6 text-[#CCB88B]" />
                                        </div>
                                        <h3 className="text-2xl font-bold mb-2">Attend & Volunteer in Person</h3>
                                        <p className="text-slate-200 text-sm leading-relaxed mb-6">
                                            Join our hands-on mission on the outreach day. Cook together in the kitchen, play outdoor games with children, mentor, or contribute items and any financial gift you wish.
                                        </p>
                                    </div>
                                    <Button
                                        size="lg"
                                        className="w-full bg-white text-[#04047a] hover:bg-slate-100 font-bold h-14 rounded-2xl shadow-lg text-base"
                                        onClick={() => setBookingEvent(selectedEvent)}
                                    >
                                        <CheckCircle className="mr-2 h-5 w-5 text-[#04047a]" />
                                        Mark Attendance & Volunteer
                                    </Button>
                                </div>

                                {/* Donate or Make a Pledge */}
                                <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border-2 border-[#CCB88B] flex flex-col justify-between text-left hover:border-white transition-all">
                                    <div>
                                        <div className="w-12 h-12 rounded-2xl bg-[#CCB88B] text-[#04047a] flex items-center justify-center font-bold mb-4 shadow-lg">
                                            <Heart className="w-6 h-6 fill-[#04047a]" />
                                        </div>
                                        <h3 className="text-2xl font-bold mb-2">Donate Now or Make a Pledge</h3>
                                        <p className="text-slate-200 text-sm leading-relaxed mb-6">
                                            Donate any amount right away (with or without an account) or make a pledge to pay in smaller bits with periodic countdown reminders leading up to the event.
                                        </p>
                                    </div>
                                    <Button
                                        size="lg"
                                        className="w-full bg-[#b8240d] hover:bg-[#9a1e0b] text-white font-black h-14 rounded-2xl shadow-lg text-base"
                                        onClick={() => setBookingEvent(selectedEvent)}
                                    >
                                        <Heart className="mr-2 h-5 w-5 fill-white" />
                                        Donate or Pledge in Bits
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 5. Key Features */}
                    {selectedEvent.features?.length > 0 && (
                        <section className="py-24 bg-muted/30">
                            <div className="container mx-auto px-4">
                                <h2 className="text-3xl font-bold mb-12 text-center text-foreground">Outreach Highlights</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {selectedEvent.features.map((feature: string, idx: number) => (
                                        <div key={idx} className="p-6 bg-card rounded-2xl shadow-sm border border-border flex flex-col items-center text-center">
                                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 font-bold">
                                                {idx + 1}
                                            </div>
                                            <h4 className="font-bold leading-tight text-foreground">{feature}</h4>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* 6. Speakers / Coordinators Section */}
                    {selectedEvent.speakers?.length > 0 && (
                        <section className="py-24 bg-background">
                            <div className="container mx-auto px-4">
                                <div className="text-center max-w-2xl mx-auto mb-16">
                                    <h2 className="text-4xl font-bold mb-4 text-foreground">Outreach Coordinators & Guests</h2>
                                    <p className="text-muted-foreground">Meet the community leaders and coordinators guiding this mission.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                    {selectedEvent.speakers.map((s: any, idx: number) => (
                                        <div key={idx} className="group relative overflow-hidden rounded-3xl bg-card border border-border">
                                            <div className="aspect-[3/4] overflow-hidden">
                                                <img
                                                    src={s.imageUrl || "/images/event.png"}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    alt={s.name}
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(s.name)}`;
                                                    }}
                                                />
                                            </div>
                                            <div className="p-8 space-y-2">
                                                <h4 className="text-2xl font-bold text-foreground">{s.name}</h4>
                                                <p className="text-primary font-bold">{s.role}</p>
                                                <p className="text-sm text-muted-foreground line-clamp-3">{s.bio}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* 7. User Journey */}
                    {selectedEvent.journey?.arrival && (
                        <section className="py-24 bg-slate-900 text-white">
                            <div className="container mx-auto px-4">
                                <h2 className="text-4xl font-bold mb-16 text-center">In Preparation for the Outreach</h2>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                    <div className="p-10 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10">
                                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-3"><MapPin className="text-[#CCB88B]" /> Arrival & Logistics</h3>
                                        <p className="text-slate-300 leading-relaxed whitespace-pre-line">{selectedEvent.journey.arrival}</p>
                                    </div>
                                    <div className="p-10 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10">
                                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-3"><Bell className="text-[#CCB88B]" /> What to Expect</h3>
                                        <p className="text-slate-300 leading-relaxed whitespace-pre-line">{selectedEvent.journey.expectations}</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* 8. FAQ Section */}
                    {selectedEvent.faqs?.length > 0 && (
                        <section className="py-24 bg-background">
                            <div className="container mx-auto px-4">
                                <h2 className="text-4xl font-bold mb-16 text-center text-foreground">Frequently Asked Questions</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {selectedEvent.faqs.map((faq: any, idx: number) => (
                                        <div key={idx} className="p-8 bg-card rounded-3xl hover:shadow-xl transition-shadow border border-border hover:border-primary/30">
                                            <div className="flex items-start gap-3 mb-4">
                                                <HelpCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                                                <h4 className="text-lg font-bold leading-tight text-foreground">{faq.question}</h4>
                                            </div>
                                            <p className="text-muted-foreground text-sm leading-relaxed">{faq.answer}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* 9. Media Gallery Shuffle */}
                    {selectedEvent.imageUrls?.length > 0 && (
                        <section className="py-24 overflow-hidden bg-muted/30">
                            <div className="container mx-auto px-4">
                                <div className="text-center mb-16">
                                    <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-foreground">Outreach Gallery</h2>
                                    <p className="text-muted-foreground text-lg">A window into our community missions and moments of hope.</p>
                                </div>
                                <div className="max-w-7xl mx-auto aspect-[16/7] relative rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] bg-slate-950 group">
                                    <AnimatePresence mode="wait">
                                        <motion.img
                                            key={currentImageIdx}
                                            src={selectedEvent.imageUrls[currentImageIdx]}
                                            initial={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                                            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                                            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />
                                    </AnimatePresence>

                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />

                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                                        {selectedEvent.imageUrls.map((_: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className={`h-1.5 rounded-full transition-all duration-700 ${currentImageIdx === idx ? 'w-10 bg-white' : 'w-2 bg-white/40'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    <JoinUs />
                </div>
            ) : (
                <div className="flex flex-col min-h-screen">
                    <HeroSection
                        backgroundImageUrl="/images/hero_Events.gif"
                        title="Upcoming Charity Outreaches & Missions"
                        subtitle="Join our hands-on visits to children's homes, street families, and elderly care centers—or donate any amount or make a pledge from anywhere."
                    />

                    <section className="py-24 bg-background">
                        <div className="container mx-auto px-4">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
                                <div>
                                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Scheduled Charity Outreaches</h2>
                                    <p className="text-lg text-muted-foreground">Select an outreach to view details, mark your attendance, donate directly, or pledge in installments.</p>
                                </div>
                                <Button
                                    size="lg"
                                    className="bg-[#b8240d] hover:bg-[#9a1e0b] text-white font-bold rounded-2xl h-12 px-6 shadow-md"
                                    onClick={() => setBookingEvent({
                                        id: upcomingEvents[0]?.id || null,
                                        title: upcomingEvents[0]?.title || "General Charity Outreach Support",
                                        date: upcomingEvents[0]?.date || new Date().toISOString(),
                                        location: upcomingEvents[0]?.location || "Nairobi, Kenya"
                                    })}
                                >
                                    <Heart className="w-4 h-4 mr-2 fill-white" />
                                    Quick Donate / Make a Pledge
                                </Button>
                            </div>

                            {upcomingEvents.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                    {upcomingEvents.map((event: any) => (
                                        <Card key={event.id} className="group flex flex-col h-full border border-border bg-card shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer" onClick={() => setLocation(`/upcoming-events?id=${event.id}`)}>
                                            <div className="aspect-video relative overflow-hidden bg-muted">
                                                <img
                                                    src={event.heroImageUrl || event.imageUrls?.[0] || "/images/IMG-20261026-WA0026.jpg"}
                                                    alt={event.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                                <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3.5 py-1 rounded-full text-xs font-bold shadow-xl border border-white/20">
                                                    {Number(event.target_amount) > 0 ? `KES ${Number(event.target_amount).toLocaleString()} Goal` : "Charity Outreach"}
                                                </div>
                                            </div>
                                            <CardHeader className="p-8 pb-4">
                                                <CardTitle className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors mb-4">{event.title}</CardTitle>
                                                <div className="space-y-3">
                                                    <CardDescription className="flex items-center gap-3 text-muted-foreground">
                                                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                            <Calendar className="h-4 w-4" />
                                                        </div>
                                                        {format(new Date(event.date), 'PPPP')}
                                                    </CardDescription>
                                                    <CardDescription className="flex items-center gap-3 text-muted-foreground">
                                                        <div className="h-8 w-8 rounded-lg bg-[#b8240d]/10 flex items-center justify-center text-[#b8240d]">
                                                            <MapPin className="h-4 w-4" />
                                                        </div>
                                                        {event.location}
                                                    </CardDescription>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-8 py-4 flex-grow">
                                                <p className="text-muted-foreground line-clamp-3 leading-relaxed">{event.description}</p>
                                            </CardContent>
                                            <CardFooter className="p-8 pt-4 border-t border-border flex gap-2">
                                                <Button
                                                    className="flex-1 h-12 text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2 rounded-xl shadow-md transition-all"
                                                    onClick={(e) => { e.stopPropagation(); setBookingEvent(event); }}
                                                >
                                                    <Heart className="h-4 w-4 fill-current" />
                                                    Donate / Pledge
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="h-12 px-4 rounded-xl border-border text-foreground"
                                                    onClick={(e) => { e.stopPropagation(); setLocation(`/upcoming-events?id=${event.id}`); }}
                                                >
                                                    <ArrowRight className="h-4 w-4" />
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-card border border-border rounded-3xl">
                                    <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-2xl font-bold text-foreground mb-2">No Scheduled Upcoming Outreaches</h3>
                                    <p className="text-muted-foreground mb-6">You can still make a general donation or pledge to support our ongoing children's home visits.</p>
                                    <Button
                                        onClick={() => setBookingEvent({
                                            id: null,
                                            title: "General Charity Outreach Support",
                                            date: new Date().toISOString(),
                                            location: "Nairobi, Kenya"
                                        })}
                                        className="bg-primary text-primary-foreground font-bold rounded-xl"
                                    >
                                        <Heart className="w-4 h-4 mr-2 fill-current" /> Make a General Donation or Pledge
                                    </Button>
                                </div>
                            )}
                        </div>
                    </section>

                    <Testimonials />
                    <JoinUs />
                </div>
            )}

            {/* Booking, Guest Donation & Pledge Selection Dialog */}
            <EventDonationModal
                event={bookingEvent}
                isOpen={!!bookingEvent}
                onClose={() => {
                    setBookingEvent(null);
                    setResumingBookingId(null);
                }}
                onProceedToPayment={(bookingData) => {
                    openPayment({
                        amount: bookingData.amount,
                        bookingId: bookingData.id,
                        type: bookingData.isInstallment ? 'pledge_installment' : 'event',
                        eventId: bookingEvent?.id,
                        title: bookingData.title,
                        currency: 'KES',
                        returnUrl: '/upcoming-events',
                        guestName: bookingData.guestName,
                        guestEmail: bookingData.guestEmail,
                        guestPhone: bookingData.guestPhone,
                        isInstallment: bookingData.isInstallment,
                        pledgedAmount: bookingData.pledgedAmount
                    });
                }}
            />
        </div>
    );

    return (
        <PayPalScriptProvider options={{ clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || "test" }}>
            {mainContent}
        </PayPalScriptProvider>
    );
}
