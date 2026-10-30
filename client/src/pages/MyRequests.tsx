import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, MapPin, Download, FileText, Clock, CheckCircle, XCircle, Globe, Ticket, Users } from "lucide-react";
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
    attendance_type?: 'ATTENDING' | 'DONATING_ONLY';
    delivery_method?: 'ONLINE_DELIVERY' | 'IN_PERSON_EVENT_DAY';
    item_contributions?: string[];
    volunteer_activities?: string[];
    mingle_notes?: string;
    seek_to_adopt?: boolean;
    wish_note?: string;
    createdAt: string;
    event: any;
}

interface VisaRequest {
    id: string;
    eventId: string;
    status: string;
    letterUrl?: string;
    createdAt: string;
    event: any;
}

interface Application {
    id: string;
    type: 'SPEAKER' | 'SPONSOR' | 'NEXTGEN' | 'GLOBAL_FORUM';
    status: string;
    description: string;
    documentUrl?: string;
    donationAmount: number;
    paymentStatus: string;
    createdAt: string;
}

function ProposalsList({ userId, onResume }: { userId: string | undefined; onResume: (event: any) => void }) {
    const [proposals, setProposals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) {
            const fetchProposals = async () => {
                const { data, error } = await supabase
                    .from('Proposals')
                    .select('*, event:Event(*)')
                    .eq('userId', userId)
                    .order('createdAt', { ascending: false });
                if (!error) setProposals(data || []);
                setLoading(false);
            };
            fetchProposals();
        }
    }, [userId]);

    if (loading) return <div className="flex justify-center p-4"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>;
    if (proposals.length === 0) return <p className="text-slate-500 text-center py-4">No proposals found.</p>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {proposals.map((p) => (
                <Card key={p.id} className="overflow-hidden border-none shadow-lg">
                    <CardHeader className="p-6">
                        <CardTitle className="text-xl font-bold line-clamp-1">{p.event?.title}</CardTitle>
                        <div className={cn(
                            "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mt-2",
                            p.status === 'APPROVED' ? "bg-green-500 text-white" :
                                p.status === 'REJECTED' ? "bg-red-500 text-white" : "bg-amber-500 text-white"
                        )}>
                            {p.status}
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                        <p className="text-sm text-slate-500 line-clamp-2 mb-4">{p.description}</p>
                        {p.status === 'APPROVED' && (
                            <Button size="sm" onClick={() => onResume(p.event)} className="w-full gap-2">
                                <Ticket className="h-4 w-4" /> Resume Booking
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function ApplicationsList({ userId, onResume }: { userId: string | undefined; onResume: (app: Application) => void }) {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) {
            const fetchApplications = async () => {
                const { data, error } = await supabase
                    .from('Applications')
                    .select('*')
                    .eq('userId', userId)
                    .order('createdAt', { ascending: false });
                if (!error) setApplications(data || []);
                setLoading(false);
            };
            fetchApplications();
        }
    }, [userId]);

    if (loading) return <div className="flex justify-center p-4"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>;
    if (applications.length === 0) return <p className="text-slate-500 text-center py-4">No other applications found.</p>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {applications.map((app) => (
                <Card key={app.id} className="overflow-hidden border-none shadow-lg">
                    <CardHeader className="p-6">
                        <CardTitle className="text-xl font-bold">{app.type.replace('_', ' ')}</CardTitle>
                        <div className={cn(
                            "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mt-2",
                            app.paymentStatus === 'PAID' ? "bg-green-500 text-white" : "bg-amber-500 text-white"
                        )}>
                            {app.paymentStatus === 'PAID' ? 'PAID' : 'PAYMENT PENDING'}
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                        <p className="text-sm text-slate-500 line-clamp-2 mb-4">{app.description}</p>
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center text-sm mb-2">
                                <span className="text-slate-400">Status:</span>
                                <span className={cn(
                                    "font-bold",
                                    app.status === 'APPROVED' ? "text-green-600" :
                                        app.status === 'REJECTED' ? "text-red-600" : "text-amber-600"
                                )}>{app.status}</span>
                            </div>
                            {app.paymentStatus !== 'PAID' && (
                                <Button size="sm" onClick={() => onResume(app)} className="w-full gap-2 border-[#2E5E43] text-[#2E5E43] hover:bg-[#2E5E43]/10" variant="outline">
                                    <Ticket className="h-4 w-4" /> Finalize & Pay KES {app.donationAmount?.toLocaleString()}
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}


export default function MyRequests() {
    const { user, profile } = useAuth();
    const { toast } = useToast();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [visaRequests, setVisaRequests] = useState<VisaRequest[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const { openPayment } = usePaymentStore();
    const [location, setLocation] = useLocation();

    useEffect(() => {
        if (user) {
            fetchData();
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
            // Fetch Bookings
            const { data: bData, error: bError } = await supabase
                .from('Booking')
                .select('*, event:Event(*)')
                .eq('userId', user?.id)
                .order('createdAt', { ascending: false });

            if (bError) throw bError;
            setBookings(bData || []);

            // Fetch Visa Requests
            const { data: vData, error: vError } = await supabase
                .from('VisaInvitation')
                .select('*, event:Event(*)')
                .eq('userId', user?.id)
                .order('createdAt', { ascending: false });

            if (vError) throw vError;
            setVisaRequests(vData || []);

            // Fetch Applications
            const { data: aData, error: aError } = await supabase
                .from('Applications')
                .select('*')
                .eq('userId', user?.id)
                .order('createdAt', { ascending: false });

            if (aError) throw aError;
            setApplications(aData || []);

        } catch (error) {
            console.error("Error fetching requests:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSuccessfulPayment = async (bookingId: string, type: string = 'event') => {
        try {
            // Note: We no longer update the database directly from the frontend to prevent RLS violations.
            // We rely on the Stripe/PayPal Webhook to update the status to CONFIRMED or PAID.

            if (type === 'event') {
                const { data: booking, error: bookingError } = await supabase
                    .from('Booking')
                    .select('*, event:Event(*)')
                    .eq('id', bookingId)
                    .single();

                if (bookingError) throw bookingError;

                // Optimistically generate and download PDF ticket
                generateTicketPDF({
                    eventTitle: booking.event.title,
                    eventDate: format(new Date(booking.event.date), 'PPPP'),
                    eventLocation: booking.event.location,
                    userName: profile?.name || user?.email?.split('@')[0] || "Attendee",
                    userEmail: user?.email || '',
                    category: booking.category,
                    amountPaid: Number(booking.amountPaid),
                    bookingId: booking.id
                });

                toast({ title: "Booking Confirmation Processed!", description: "Your ticket has been generated. The status will update shortly." });
            } else if (type === 'visa') {
                toast({ title: "Visa Request Processed!", description: "Your payment was captured and the request is now being processed." });
            } else if (type === 'application') {
                toast({ title: "Application Processed!", description: "Your payment was captured and the application is now under review." });
            }
        } catch (error: any) {
            console.error("Error generating receipt or verifying booking:", error);
            toast({ title: "Error", description: "Failed to load booking details after payment. Please contact support.", variant: "destructive" });
        }
    };


    const handleDownloadTicket = (booking: Booking) => {
        generateTicketPDF({
            eventTitle: booking.event.title,
            eventDate: format(new Date(booking.event.date), 'PPPP'),
            eventLocation: booking.event.location,
            userName: profile?.name || user?.email?.split('@')[0] || "Attendee",
            userEmail: user?.email || "",
            category: booking.category,
            amountPaid: Number(booking.amountPaid || booking.amount || 0),
            bookingId: booking.id,
            attendanceType: booking.attendance_type,
            deliveryMethod: booking.delivery_method,
            itemContributions: booking.item_contributions
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
            <HeroSection
                backgroundImageUrl="/images/hero_Events.gif"
                title="Your Dashboard"
                subtitle="Manage your event bookings and visa invitation letters."
            />

            <div className="container mx-auto px-4 py-16 space-y-16">
                {/* Event Proposals Section */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <FileText className="h-8 w-8 text-primary" />
                        <h2 className="text-3xl font-bold">My Event Proposals</h2>
                    </div>

                    <ProposalsList userId={user?.id} onResume={(event: any) => {
                        setLocation(`/upcoming-events?id=${event.id}&resume=true`);
                    }} />
                </section>

                {/* Event Bookings Section */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <Calendar className="h-8 w-8 text-primary" />
                        <h2 className="text-3xl font-bold">My Event Bookings</h2>
                    </div>

                    {bookings.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-dashed border-slate-200 dark:border-slate-800">
                            <p className="text-slate-500">You haven't booked any events yet.</p>
                            <Button asChild variant="link" className="mt-2">
                                <Link href="/upcoming-events">Browse Events</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {bookings.map((booking) => (
                                <Card key={booking.id} className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-all group">
                                    <div className="aspect-video relative overflow-hidden bg-slate-100">
                                        <img
                                            src={booking.event?.heroImageUrl || booking.event?.imageUrls?.[0] || "/images/event.png"}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            alt={booking.event?.title}
                                        />
                                        <div className={cn(
                                            "absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg",
                                            booking.status === 'CONFIRMED' ? "bg-green-500 text-white" : "bg-amber-500 text-white"
                                        )}>
                                            {booking.status}
                                        </div>
                                    </div>
                                    <CardHeader className="p-6">
                                        <CardTitle className="text-xl font-bold line-clamp-1">{booking.event?.title}</CardTitle>
                                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">
                                            <Calendar className="h-4 w-4" />
                                            {format(new Date(booking.event?.date), 'PPP')}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6 pt-0 space-y-3">
                                        <div className="flex justify-between items-center text-xs">
                                            <div>
                                                <p className="text-slate-400">Participation</p>
                                                <p className="font-bold text-[#2E5E43]">
                                                    {booking.attendance_type === 'ATTENDING' ? 'Attending in Person' : 'Remote Donation & Wishes'}
                                                </p>
                                            </div>
                                            {Number(booking.amountPaid || booking.amount || 0) > 0 && (
                                                <div className="text-right">
                                                    <p className="text-slate-400">Contribution</p>
                                                    <p className="font-bold text-[#2E5E43]">KES {Number(booking.amountPaid || booking.amount || 0).toLocaleString()}</p>
                                                </div>
                                            )}
                                        </div>

                                        {booking.item_contributions && booking.item_contributions.length > 0 && (
                                             <div className="text-xs">
                                                 <p className="text-slate-400 font-medium">Contributed Items:</p>
                                                 <div className="flex flex-wrap gap-1 mt-1">
                                                     {booking.item_contributions.map((it: string, i: number) => (
                                                         <span key={i} className="px-2 py-0.5 rounded-md bg-[#2E5E43]/10 text-[10px] font-semibold text-[#2E5E43]">
                                                             {it}
                                                         </span>
                                                     ))}
                                                 </div>
                                             </div>
                                        )}

                                        {booking.delivery_method && (
                                             <p className="text-[11px] text-muted-foreground">
                                                 Delivery: <span className="font-semibold text-foreground">{booking.delivery_method === 'ONLINE_DELIVERY' ? 'Courier / Online Delivery' : 'Bringing on Event Day (In-Person)'}</span>
                                             </p>
                                        )}

                                        <div className="pt-2 border-t flex justify-end items-center">
                                             {booking.status === 'CONFIRMED' ? (
                                                 <Button size="sm" onClick={() => handleDownloadTicket(booking)} className="gap-2 bg-[#2E5E43] hover:bg-[#254d37] text-white">
                                                     <Download className="h-4 w-4" /> Receipt / Ticket
                                                 </Button>
                                             ) : booking.status === 'PENDING' && (
                                                 isBefore(new Date(booking.event?.date), new Date()) ? (
                                                     <span className="text-[10px] font-bold text-red-500 uppercase bg-red-50 px-2 py-1 rounded-md">Closed</span>
                                                 ) : (
                                                     <Button size="sm" variant="outline" className="gap-2 border-[#2E5E43] text-[#2E5E43] hover:bg-[#2E5E43]/10" onClick={() => setLocation(`/upcoming-events?id=${booking.eventId}&resume=true&bookingId=${booking.id}`)}>
                                                         <Ticket className="h-4 w-4" /> Resume Donation
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

                {/* Visa Invitations Section */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <FileText className="h-8 w-8 text-primary" />
                        <h2 className="text-3xl font-bold">Visa Invitations</h2>
                    </div>

                    {visaRequests.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-dashed border-slate-200 dark:border-slate-800">
                            <p className="text-slate-500">No visa request history found.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {visaRequests.map((req) => (
                                <Card key={req.id} className="border-none shadow-md overflow-hidden">
                                    <CardContent className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                        <div className="flex gap-4 items-center">
                                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                                <FileText className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg">{req.event?.title}</h3>
                                                <p className="text-xs text-slate-400">Requested on {format(new Date(req.createdAt), 'PPP')}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                                            <div className="flex flex-col items-end">
                                                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Status</p>
                                                <div className={cn(
                                                    "flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold",
                                                    req.status === 'APPROVED' ? "bg-green-100 text-green-700" :
                                                        req.status === 'REJECTED' ? "bg-red-100 text-red-700" :
                                                            "bg-blue-50 text-blue-600"
                                                )}>
                                                    {req.status === 'APPROVED' ? <CheckCircle className="h-4 w-4" /> :
                                                        req.status === 'REJECTED' ? <XCircle className="h-4 w-4" /> :
                                                            <Clock className="h-4 w-4" />}
                                                    {req.status}
                                                </div>
                                            </div>

                                            {req.letterUrl ? (
                                                <Button asChild className="gap-2">
                                                    <a href={req.letterUrl} target="_blank" rel="noreferrer">
                                                        <Download className="h-4 w-4" /> Download Letter
                                                    </a>
                                                </Button>
                                            ) : req.status === 'PENDING' && (
                                                isBefore(new Date(req.event?.date), new Date()) ? (
                                                    <span className="text-[10px] font-bold text-red-500 uppercase bg-red-50 px-2 py-1 rounded-md">Closed</span>
                                                ) : (
                                                    <Button size="sm" variant="outline" className="gap-2 border-amber-500 text-amber-600 hover:bg-amber-50" onClick={() => openPayment({ amount: 50, bookingId: req.id, type: 'visa', title: 'Finalize Visa Request', returnUrl: '/my-requests' })}>
                                                        <Globe className="h-4 w-4" /> Resume & Pay
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

                {/* Other Applications Section */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <Users className="h-8 w-8 text-primary" />
                        <h2 className="text-3xl font-bold">Other Applications</h2>
                    </div>

                    <ApplicationsList
                        userId={user?.id}
                        onResume={(app) => openPayment({
                            amount: app.donationAmount,
                            bookingId: app.id,
                            type: 'application',
                            title: `Finalize Donation: ${app.type}`,
                            returnUrl: '/my-requests'
                        })}
                    />
                </section>
            </div>

        </div>
    );
}
