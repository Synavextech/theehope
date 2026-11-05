import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Loader2,
    Plus,
    Trash2,
    Edit2,
    Upload,
    Image as ImageIcon,
    User2,
    Headphones,
    Send,
    CheckCheck,
    Check,
    Search,
    MessageCircle,
    Heart,
    Bell,
    Clock,
    Calendar,
    Coins
} from "lucide-react";
import { format } from "date-fns";
import { Event, Booking } from "@shared/schema";
import { cn } from "@/lib/utils";

const ALL_CONTRIBUTION_OPTIONS = [
    'Money / Financial Donation',
    'Food & Groceries',
    'Clothing & Warm wear',
    'Learning materials & Books',
    'Electronics',
    'Laptops',
    'Phones',
    'Computers',
    'Shoes',
    'Utensils & Household',
    'Self (In-Person Presence)'
];

const ALL_VOLUNTEER_ROLES = [
    'Work in kitchen (cook together)',
    'Play games & sports',
    'Mingle with kids & mentorship',
    'Seek to adopt (adoption orientation inquiry)'
];

function UserManager() {
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [userBookings, setUserBookings] = useState<any[]>([]);
    const [isFetchingActivity, setIsFetchingActivity] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const { toast } = useToast();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('User')
            .select('*, Stats(*)')
            .order('createdAt', { ascending: false });

        if (error) {
            toast({ title: "Error fetching users", description: error.message, variant: "destructive" });
        } else {
            setUsers(data || []);
        }
        setIsLoading(false);
    };

    const fetchUserActivity = async (userId: string) => {
        setIsFetchingActivity(true);
        try {
            const { data, error } = await supabase
                .from('Booking')
                .select('*, Event(title, date)')
                .eq('userId', userId)
                .order('createdAt', { ascending: false });

            if (error) throw error;
            setUserBookings(data || []);
        } catch (error: any) {
            toast({ title: "Error fetching activity", description: error.message, variant: "destructive" });
        } finally {
            setIsFetchingActivity(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-xl font-bold text-foreground">Registered Supporters & Volunteers</h2>
                <Input
                    placeholder="Search supporters..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-xs"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Users List */}
                <Card className="lg:col-span-1 h-[600px] flex flex-col border-border bg-card">
                    <CardHeader className="py-4 border-b border-border">
                        <CardTitle className="text-lg">Supporters ({filteredUsers.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-2 space-y-2">
                        {filteredUsers.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4 italic">No users found.</p>
                        ) : (
                            filteredUsers.map(u => (
                                <button
                                    key={u.id}
                                    onClick={() => {
                                        setSelectedUser(u);
                                        fetchUserActivity(u.id);
                                    }}
                                    className={cn(
                                        "w-full text-left p-3 rounded-xl transition-colors border",
                                        selectedUser?.id === u.id
                                            ? "bg-primary/10 border-primary shadow-sm"
                                            : "bg-card hover:bg-muted/50 border-transparent hover:border-border"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {u.name?.charAt(0)?.toUpperCase() || "S"}
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="font-semibold text-foreground truncate">{u.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* User Details & Activity */}
                <Card className="lg:col-span-2 h-[600px] flex flex-col border-border bg-card">
                    {!selectedUser ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground space-y-4">
                            <User2 className="h-16 w-16 opacity-20" />
                            <p>Select a supporter to view their donations, pledges, and outreach history.</p>
                        </div>
                    ) : (
                        <>
                            <CardHeader className="border-b border-border bg-muted/30">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-2xl text-foreground">{selectedUser.name}</CardTitle>
                                        <CardDescription>{selectedUser.email}</CardDescription>
                                        <div className="flex gap-2 mt-2 text-xs flex-wrap">
                                            <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-md font-bold">Role: {selectedUser.role}</span>
                                            {selectedUser.createdAt && (
                                                <span className="bg-muted text-muted-foreground px-2.5 py-1 rounded-md">
                                                    Joined: {format(new Date(selectedUser.createdAt), 'MMM yyyy')}
                                                </span>
                                            )}
                                        </div>
                                        {(selectedUser.phone || selectedUser.country || selectedUser.city || selectedUser.address) && (
                                            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                                {selectedUser.phone && <p><span className="font-semibold text-foreground">Phone:</span> {selectedUser.phone}</p>}
                                                {selectedUser.country && <p><span className="font-semibold text-foreground">Country:</span> {selectedUser.country}</p>}
                                                {selectedUser.city && <p><span className="font-semibold text-foreground">City:</span> {selectedUser.city}</p>}
                                                {selectedUser.address && <p><span className="font-semibold text-foreground">Address:</span> {selectedUser.address}</p>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
                                {isFetchingActivity ? (
                                    <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
                                ) : (
                                    <section>
                                        <h3 className="font-bold text-lg text-foreground mb-3 flex items-center gap-2">
                                            Outreach Bookings, Donations & Pledges
                                            <span className="text-xs bg-primary/10 px-2.5 py-0.5 rounded-full text-primary font-bold">
                                                {userBookings.length}
                                            </span>
                                        </h3>
                                        {userBookings.length === 0 ? (
                                            <p className="text-sm text-muted-foreground italic">No donations, pledges, or event bookings yet.</p>
                                        ) : (
                                            <div className="grid gap-3">
                                                {userBookings.map((b: any) => {
                                                    const isPledge = !!b.is_pledge || Number(b.pledged_amount) > 0;
                                                    const pledgedTotal = Number(b.pledged_amount || 0);
                                                    const paidTotal = Number(b.amountPaid || 0);
                                                    return (
                                                        <div key={b.id} className="text-sm p-4 bg-muted/30 border border-border rounded-xl flex justify-between items-center gap-4">
                                                            <div>
                                                                <p className="font-bold text-foreground">
                                                                    {b.Event?.title || "General Charity Contribution"}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                                    {b.attendance_type === 'ATTENDING' ? 'In-Person Attendance' : 'Donation / Well-Wisher'}
                                                                    {isPledge ? ` • Pledge (Paid KES ${paidTotal.toLocaleString()} of KES ${pledgedTotal.toLocaleString()})` : ''}
                                                                </p>
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                <p className="font-black text-primary">
                                                                    KES {paidTotal.toLocaleString()}
                                                                </p>
                                                                <span className={cn(
                                                                    "text-[10px] px-2 py-0.5 rounded-full uppercase font-bold",
                                                                    b.status === 'CONFIRMED' ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                                                )}>
                                                                    {b.payment_status || b.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </section>
                                )}
                            </CardContent>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
}

function BlogManager() {
    const [blogs, setBlogs] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();

    useEffect(() => {
        fetchBlogs();
    }, []);

    const fetchBlogs = async () => {
        const { data, error } = await supabase.from('BlogPost').select('*').order('createdAt', { ascending: false });
        if (!error) setBlogs(data || []);
    };

    const onSubmitBlog = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) {
            toast({ title: "Session Error", description: "You must be logged in to post.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const title = formData.get('title') as string;
        const content = formData.get('content') as string;
        const imageUrl = formData.get('imageUrl') as string;

        try {
            const { error } = await supabase.from('BlogPost').insert({
                title,
                content,
                imageUrl,
                authorId: user.id
            });
            if (error) throw error;

            toast({ title: "Blog posted!" });
            fetchBlogs();
            (e.target as HTMLFormElement).reset();
        } catch (error: any) {
            toast({
                title: "Post failed",
                description: error.message || "An unexpected error occurred",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteBlog = async (id: string) => {
        if (!confirm("Delete post?")) return;
        const { error } = await supabase.from('BlogPost').delete().eq('id', id);
        if (!error) {
            toast({ title: "Deleted" });
            fetchBlogs();
        }
    };

    return (
        <>
            <Card className="lg:col-span-1 border-border bg-card">
                <CardHeader><CardTitle>Create Community Story</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={onSubmitBlog} className="space-y-4">
                        <Input name="title" placeholder="Story Title" required />
                        <Input name="imageUrl" placeholder="Image URL (e.g. /images/IMG-20261026-WA0010.jpg)" />
                        <Textarea name="content" className="min-h-[200px]" placeholder="Write outreach story..." required />
                        <Button type="submit" disabled={isSubmitting} className="w-full font-bold">Publish Story</Button>
                    </form>
                </CardContent>
            </Card>
            <div className="lg:col-span-2 space-y-4">
                {blogs.map(blog => (
                    <Card key={blog.id} className="border-border bg-card">
                        <CardContent className="p-4 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-foreground">{blog.title}</h3>
                                <p className="text-sm text-muted-foreground">{format(new Date(blog.createdAt), 'PPP')}</p>
                            </div>
                            <Button variant="ghost" className="text-destructive" onClick={() => deleteBlog(blog.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                ))}
                {blogs.length === 0 && (
                    <p className="text-muted-foreground italic">No stories published yet.</p>
                )}
            </div>
        </>
    );
}

function BookingManager() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('Booking')
            .select('*, Event(*), User(*)')
            .order('createdAt', { ascending: false });

        if (error) {
            toast({ title: "Error fetching bookings", description: error.message, variant: "destructive" });
        } else {
            setBookings(data || []);
        }
        setIsLoading(false);
    };

    const updateBookingStatus = async (id: string, status: string) => {
        const { error } = await supabase
            .from('Booking')
            .update({ status })
            .eq('id', id);

        if (error) {
            toast({ title: "Error updating status", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Status updated" });
            fetchBookings();
        }
    };

    const triggerPledgeReminder = async (bookingId: string) => {
        setSendingReminderId(bookingId);
        try {
            const response = await fetch('/api/pledges/check-reminders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId, force: true })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to send reminder");
            toast({
                title: "Pledge Reminder Sent! 🔔",
                description: "The supporter has received a countdown reminder notification for their remaining pledge balance."
            });
            fetchBookings();
        } catch (err: any) {
            toast({ title: "Reminder Error", description: err.message, variant: "destructive" });
        } finally {
            setSendingReminderId(null);
        }
    };

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                    <h2 className="text-xl font-bold text-foreground">Outreach Bookings, Donations & Pledges</h2>
                    <p className="text-xs text-muted-foreground">View registered & guest donations, in-kind contributions, and active installment pledges.</p>
                </div>
            </div>
            <div className="grid gap-4">
                {bookings.map(booking => {
                    const supporterUser = booking.user || booking.User;
                    const eventRecord = booking.event || booking.Event;
                    const displayName = supporterUser?.name || booking.guest_name || "Guest Supporter";
                    const displayEmail = supporterUser?.email || booking.guest_email || "No email provided";
                    const displayPhone = supporterUser?.phone || booking.guest_phone || booking.phone_number;
                    const isPledge = !!booking.is_pledge || Number(booking.pledged_amount || 0) > 0;
                    const pledgedTotal = Number(booking.pledged_amount || 0);
                    const paidAmount = Number(booking.amountPaid || 0);
                    const remainingPledge = Math.max(0, pledgedTotal - paidAmount);

                    return (
                        <Card key={booking.id} className="border-border bg-card">
                            <CardContent className="p-5 flex flex-col md:flex-row justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-bold text-foreground text-base">{displayName}</h3>
                                        {!booking.userId && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold">
                                                GUEST DONOR
                                            </span>
                                        )}
                                        <span className={cn(
                                            "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                                            booking.status === 'CONFIRMED'
                                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                                : booking.status === 'CANCELLED'
                                                ? "bg-destructive/15 text-destructive"
                                                : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                        )}>{booking.status}</span>
                                        {isPledge && (
                                            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-primary/15 text-primary font-bold flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                INSTALLMENT PLEDGE ({booking.reminder_frequency || 'EVERY_3_DAYS'})
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-sm text-muted-foreground">
                                        {displayEmail} • Outreach: <strong className="text-foreground">{eventRecord?.title || "General Charity Support"}</strong>
                                    </p>

                                    {(displayPhone || supporterUser?.country || supporterUser?.city || supporterUser?.address) && (
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-xl border border-border">
                                            {displayPhone && <span><strong className="text-foreground">Phone:</strong> {displayPhone}</span>}
                                            {supporterUser?.country && <span><strong className="text-foreground">Country:</strong> {supporterUser.country}</span>}
                                            {supporterUser?.city && <span><strong className="text-foreground">City:</strong> {supporterUser.city}</span>}
                                            {supporterUser?.address && <span><strong className="text-foreground">Address:</strong> {supporterUser.address}</span>}
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-2">
                                        {booking.attendance_type && (
                                            <span className={cn(
                                                "text-xs px-2.5 py-0.5 rounded-full font-bold",
                                                booking.attendance_type === 'ATTENDING'
                                                    ? "bg-primary/10 text-primary"
                                                    : "bg-[#b8240d]/10 text-[#b8240d]"
                                            )}>
                                                {booking.attendance_type === 'ATTENDING' ? "Attending in Person" : "Donating & Wishing Well"}
                                            </span>
                                        )}
                                        {booking.delivery_method && (
                                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                                                Delivery: {booking.delivery_method === 'ONLINE_DELIVERY' ? "Courier to Nairobi HQ" : "Bringing on Event Day"}
                                            </span>
                                        )}
                                        {booking.seek_to_adopt && (
                                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold">
                                                Adoption Inquiry
                                            </span>
                                        )}
                                    </div>

                                    {booking.item_contributions && booking.item_contributions.length > 0 && (
                                        <div className="text-xs text-muted-foreground">
                                            <strong className="text-foreground">Contributions:</strong> {booking.item_contributions.join(', ')}
                                        </div>
                                    )}
                                    {booking.volunteer_activities && booking.volunteer_activities.length > 0 && (
                                        <div className="text-xs text-muted-foreground">
                                            <strong className="text-foreground">Volunteer Activities:</strong> {booking.volunteer_activities.join(', ')}
                                        </div>
                                    )}
                                    {booking.mingle_notes && (
                                        <p className="text-xs italic text-muted-foreground bg-muted/40 p-2 rounded-lg">
                                            <strong className="text-foreground">Activity Idea:</strong> "{booking.mingle_notes}"
                                        </p>
                                    )}
                                    {booking.wish_note && (
                                        <p className="text-xs italic text-muted-foreground bg-muted/40 p-2 rounded-lg border border-border">
                                            <strong className="text-foreground">Well Wishes:</strong> "{booking.wish_note}"
                                        </p>
                                    )}

                                    {isPledge && (
                                        <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-1.5">
                                            <div className="flex flex-wrap justify-between text-xs font-bold">
                                                <span className="text-foreground">
                                                    Pledge Progress: KES {paidAmount.toLocaleString()} / KES {pledgedTotal.toLocaleString()}
                                                </span>
                                                <span className={remainingPledge > 0 ? "text-[#b8240d]" : "text-emerald-600"}>
                                                    {remainingPledge > 0 ? `Remaining: KES ${remainingPledge.toLocaleString()}` : "100% Fulfilled"}
                                                </span>
                                            </div>
                                            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                                                <div
                                                    className="h-full bg-primary transition-all"
                                                    style={{ width: `${Math.min(100, pledgedTotal > 0 ? (paidAmount / pledgedTotal) * 100 : 0)}%` }}
                                                />
                                            </div>
                                            {booking.installment_history && booking.installment_history.length > 0 && (
                                                <p className="text-[11px] text-muted-foreground">
                                                    Installments paid ({booking.installment_history.length}):{" "}
                                                    {booking.installment_history.map((inst: any) => `KES ${Number(inst.amount).toLocaleString()}`).join(" + ")}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-4 text-xs items-center pt-1">
                                        <span className="text-muted-foreground">
                                            Amount Paid: <strong className="text-foreground">KES {paidAmount.toLocaleString()}</strong>
                                        </span>
                                        <span className="bg-muted px-2.5 py-1 rounded-md text-muted-foreground">
                                            Payment Status: <strong className={booking.payment_status === 'PAID' || booking.status === 'CONFIRMED' ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
                                                {booking.payment_status || (booking.status === 'CONFIRMED' ? 'COMPLETED' : 'PENDING')}
                                            </strong>
                                        </span>
                                        <span className="text-muted-foreground text-[11px]">
                                            Date: {format(new Date(booking.createdAt), 'PPP')}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-row md:flex-col gap-2 justify-center shrink-0">
                                    {booking.status === 'PENDING' && (
                                        <>
                                            <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-600/30 hover:bg-emerald-500/10" onClick={() => updateBookingStatus(booking.id, 'CONFIRMED')}>
                                                Confirm
                                            </Button>
                                            <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => updateBookingStatus(booking.id, 'CANCELLED')}>
                                                Cancel
                                            </Button>
                                        </>
                                    )}
                                    {isPledge && remainingPledge > 0 && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={sendingReminderId === booking.id}
                                            onClick={() => triggerPledgeReminder(booking.id)}
                                            className="text-xs font-bold gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
                                        >
                                            {sendingReminderId === booking.id ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <Bell className="w-3.5 h-3.5 text-[#b8240d]" />
                                            )}
                                            Send Reminder
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
                {bookings.length === 0 && <p className="text-muted-foreground italic">No bookings or donations found.</p>}
            </div>
        </div>
    );
}

function SupportChatManager() {
    const { user, profile } = useAuth();
    const { toast } = useToast();
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedConv, setSelectedConv] = useState<any | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [replyText, setReplyText] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const replyInputRef = useRef<HTMLInputElement>(null);

    const cannedResponses = [
        "Hello! How can we assist you today?",
        "Thank you for contacting The Voice of Hope Kenya. We are looking into this right away.",
        "Your donation / pledge has been verified and processed.",
        "Please check your registered email or your Dashboard for confirmation."
    ];

    const fetchConversations = async () => {
        try {
            const { data, error } = await supabase
                .from('SupportConversation')
                .select('*, User(id, name, email)')
                .order('lastMessageAt', { ascending: false });

            if (error) throw error;
            setConversations(data || []);

            if (selectedConv) {
                const refreshed = (data || []).find((c: any) => c.id === selectedConv.id);
                if (refreshed) setSelectedConv(refreshed);
            }
        } catch (err: any) {
            console.error('[AdminSupport] Error fetching conversations:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMessages = async (convId: string) => {
        try {
            const { data, error } = await supabase
                .from('SupportMessage')
                .select('*')
                .eq('conversationId', convId)
                .order('createdAt', { ascending: true });

            if (error) throw error;
            setMessages(data || []);

            await supabase
                .from('SupportConversation')
                .update({ unreadAdminCount: 0 })
                .eq('id', convId);

            setConversations((prev) =>
                prev.map((c) => (c.id === convId ? { ...c, unreadAdminCount: 0 } : c))
            );
        } catch (err: any) {
            console.error('[AdminSupport] Error fetching messages:', err);
        }
    };

    useEffect(() => {
        fetchConversations();

        const convChannel = supabase
            .channel('admin-support-conversations-sync')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'SupportConversation'
                },
                () => {
                    fetchConversations();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(convChannel);
        };
    }, []);

    useEffect(() => {
        if (!selectedConv?.id) {
            setMessages([]);
            return;
        }

        fetchMessages(selectedConv.id);

        const msgChannel = supabase
            .channel(`admin-chat-thread-${selectedConv.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'SupportMessage',
                    filter: `conversationId=eq.${selectedConv.id}`
                },
                (payload) => {
                    const newMsg = payload.new as any;
                    setMessages((prev) => {
                        if (prev.some((m) => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg];
                    });

                    if (newMsg.senderRole !== 'ADMIN') {
                        supabase.from('SupportMessage').update({ isRead: true }).eq('id', newMsg.id);
                        supabase.from('SupportConversation').update({ unreadAdminCount: 0 }).eq('id', selectedConv.id);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(msgChannel);
        };
    }, [selectedConv?.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendReply = async (textToSend?: string) => {
        const text = (textToSend || replyText).trim();
        if (!text || !selectedConv?.id || isSending) return;

        setIsSending(true);
        if (!textToSend) setReplyText('');

        try {
            const adminName = profile?.name || user?.email?.split('@')[0] || 'Support Admin';
            const tempId = 'temp_' + Date.now();
            const optimisticMsg = {
                id: tempId,
                conversationId: selectedConv.id,
                senderId: user?.id,
                senderRole: 'ADMIN',
                senderName: adminName,
                message: text,
                isRead: false,
                createdAt: new Date().toISOString()
            };
            setMessages((prev) => [...prev, optimisticMsg]);

            const { data: insertedMsg, error: msgError } = await supabase
                .from('SupportMessage')
                .insert({
                    conversationId: selectedConv.id,
                    senderId: user?.id,
                    senderRole: 'ADMIN',
                    senderName: adminName,
                    message: text,
                    isRead: false
                })
                .select()
                .single();

            if (msgError) throw msgError;

            if (insertedMsg) {
                setMessages((prev) => prev.map((m) => (m.id === tempId ? insertedMsg : m)));
            }

            await supabase
                .from('SupportConversation')
                .update({
                    lastMessageAt: new Date().toISOString(),
                    unreadUserCount: (selectedConv.unreadUserCount || 0) + 1,
                    status: 'OPEN'
                })
                .eq('id', selectedConv.id);

            if (selectedConv.userId) {
                await supabase.from('Notification').insert({
                    userId: selectedConv.userId,
                    title: 'Live Support Response',
                    message: `Support Admin: "${text.length > 50 ? text.substring(0, 50) + '...' : text}"`,
                    type: 'INFO',
                    isRead: false
                });
            }

            fetchConversations();
        } catch (err: any) {
            toast({ title: 'Failed to send message', description: err.message, variant: 'destructive' });
        } finally {
            setIsSending(false);
            setTimeout(() => replyInputRef.current?.focus(), 100);
        }
    };

    const handleToggleStatus = async () => {
        if (!selectedConv) return;
        const newStatus = selectedConv.status === 'RESOLVED' ? 'OPEN' : 'RESOLVED';
        try {
            const { error } = await supabase
                .from('SupportConversation')
                .update({ status: newStatus })
                .eq('id', selectedConv.id);

            if (error) throw error;
            setSelectedConv({ ...selectedConv, status: newStatus });
            setConversations((prev) =>
                prev.map((c) => (c.id === selectedConv.id ? { ...c, status: newStatus } : c))
            );
            toast({ title: `Conversation marked as ${newStatus}` });
        } catch (err: any) {
            toast({ title: 'Error updating status', description: err.message, variant: 'destructive' });
        }
    };

    const filteredConversations = conversations.filter((c) => {
        const matchesStatus =
            statusFilter === 'ALL' ||
            (statusFilter === 'OPEN' && c.status !== 'RESOLVED') ||
            (statusFilter === 'RESOLVED' && c.status === 'RESOLVED');

        const userName = c.User?.name || c.guestName || '';
        const userEmail = c.User?.email || c.guestEmail || '';
        const query = searchQuery.toLowerCase();
        const matchesQuery =
            !query ||
            userName.toLowerCase().includes(query) ||
            userEmail.toLowerCase().includes(query);

        return matchesStatus && matchesQuery;
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Headphones className="w-6 h-6 text-primary" /> Live Support Chat
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Communicate in real-time with supporters and visitors seeking assistance.
                    </p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                        <Input
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-card"
                        />
                    </div>
                    <div className="flex border border-border rounded-lg overflow-hidden bg-card shadow-sm">
                        {(['ALL', 'OPEN', 'RESOLVED'] as const).map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setStatusFilter(filter)}
                                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                                    statusFilter === filter
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-muted'
                                }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px]">
                {/* Left: Conversations List */}
                <Card className="lg:col-span-5 h-full flex flex-col overflow-hidden shadow-md border-border bg-card">
                    <CardHeader className="py-3.5 px-4 bg-muted/40 border-b border-border flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-semibold text-foreground">
                            Conversations ({filteredConversations.length})
                        </CardTitle>
                        <span className="text-xs text-muted-foreground font-medium">Real-time sync active</span>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-2 space-y-1.5 divide-y divide-border/50">
                        {filteredConversations.length === 0 ? (
                            <div className="py-16 text-center text-muted-foreground">
                                <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
                                <p className="text-sm font-medium">No conversations found</p>
                            </div>
                        ) : (
                            filteredConversations.map((conv) => {
                                const isSelected = selectedConv?.id === conv.id;
                                const isRegistered = !!conv.userId;
                                const displayName = conv.User?.name || conv.guestName || 'Anonymous Visitor';
                                const displayEmail = conv.User?.email || conv.guestEmail || 'No email provided';
                                const isResolved = conv.status === 'RESOLVED';

                                return (
                                    <div
                                        key={conv.id}
                                        onClick={() => setSelectedConv(conv)}
                                        className={`p-3 rounded-xl cursor-pointer transition-all ${
                                            isSelected
                                                ? 'bg-primary/10 border border-primary/30 shadow-sm'
                                                : 'hover:bg-muted/50 border border-transparent'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div
                                                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                                        isRegistered
                                                            ? 'bg-primary text-primary-foreground'
                                                            : 'bg-[#b8240d] text-white'
                                                    }`}
                                                >
                                                    {displayName.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <h4 className="font-semibold text-sm text-foreground truncate">
                                                            {displayName}
                                                        </h4>
                                                        <span
                                                            className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                                                                isRegistered
                                                                    ? 'bg-primary/15 text-primary'
                                                                    : 'bg-[#b8240d]/15 text-[#b8240d]'
                                                            }`}
                                                        >
                                                            {isRegistered ? 'User' : 'Guest'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                <span className="text-[10px] text-muted-foreground">
                                                    {conv.lastMessageAt ? format(new Date(conv.lastMessageAt), 'p') : ''}
                                                </span>
                                                {conv.unreadAdminCount > 0 && (
                                                    <span className="bg-[#b8240d] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                                                        {conv.unreadAdminCount} new
                                                    </span>
                                                )}
                                                {isResolved && (
                                                    <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-medium">
                                                        Resolved
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </CardContent>
                </Card>

                {/* Right: Active Chat Thread */}
                <Card className="lg:col-span-7 h-full flex flex-col overflow-hidden shadow-md border-border bg-card">
                    {selectedConv ? (
                        <>
                            <div className="p-4 bg-muted/40 border-b border-border flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white ${
                                            selectedConv.userId ? 'bg-primary' : 'bg-[#b8240d]'
                                        }`}
                                    >
                                        {(selectedConv.User?.name || selectedConv.guestName || 'U')
                                            .charAt(0)
                                            .toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-base text-foreground">
                                                {selectedConv.User?.name || selectedConv.guestName || 'Anonymous Visitor'}
                                            </h3>
                                            <span
                                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                                    selectedConv.status === 'RESOLVED'
                                                        ? 'bg-muted text-muted-foreground'
                                                        : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                                }`}
                                            >
                                                {selectedConv.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {selectedConv.User?.email || selectedConv.guestEmail || 'No email registered'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant={selectedConv.status === 'RESOLVED' ? 'outline' : 'default'}
                                        onClick={handleToggleStatus}
                                        className="text-xs"
                                    >
                                        {selectedConv.status === 'RESOLVED' ? 'Reopen Conversation' : 'Mark as Resolved'}
                                    </Button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
                                {messages.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                        No messages in this conversation yet.
                                    </div>
                                ) : (
                                    messages.map((msg) => {
                                        const isAdmin = msg.senderRole === 'ADMIN';
                                        return (
                                            <div
                                                key={msg.id}
                                                className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'} space-y-1`}
                                            >
                                                <div className="flex items-center gap-1.5 px-1">
                                                    <span className="text-[11px] font-medium text-muted-foreground">
                                                        {isAdmin ? 'Admin (' + (msg.senderName || 'You') + ')' : msg.senderName}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {msg.createdAt ? format(new Date(msg.createdAt), 'p') : ''}
                                                    </span>
                                                </div>
                                                <div
                                                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                                        isAdmin
                                                            ? 'bg-primary text-primary-foreground rounded-tr-none shadow-sm'
                                                            : 'bg-card text-foreground border border-border rounded-tl-none shadow-sm'
                                                    }`}
                                                >
                                                    <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                                                </div>
                                                {isAdmin && (
                                                    <div className="flex items-center gap-1 pr-1 text-[10px] text-muted-foreground">
                                                        {msg.isRead ? (
                                                            <span className="flex items-center gap-0.5 text-primary font-medium">
                                                                <CheckCheck className="w-3 h-3" /> Seen by user
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-0.5">
                                                                <Check className="w-3 h-3" /> Sent
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="px-4 py-2 bg-muted/40 border-t border-border flex items-center gap-2 overflow-x-auto">
                                <span className="text-[11px] font-semibold text-muted-foreground shrink-0">Quick reply:</span>
                                {cannedResponses.map((canned, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => handleSendReply(canned)}
                                        className="text-xs px-2.5 py-1 bg-card hover:bg-muted border border-border rounded-lg whitespace-nowrap text-foreground transition-colors"
                                    >
                                        {canned.length > 32 ? canned.substring(0, 32) + '...' : canned}
                                    </button>
                                ))}
                            </div>

                            <div className="p-3 bg-card border-t border-border flex items-center gap-2">
                                <Input
                                    ref={replyInputRef}
                                    placeholder="Type your reply to supporter... (Press Enter to send)"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendReply();
                                        }
                                    }}
                                    disabled={isSending}
                                    className="flex-1"
                                />
                                <Button
                                    onClick={() => handleSendReply()}
                                    disabled={!replyText.trim() || isSending}
                                    className="shrink-0"
                                >
                                    {isSending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                            <Headphones className="w-12 h-12 mb-3 opacity-30" />
                            <h4 className="font-semibold text-foreground text-base mb-1">
                                No Conversation Selected
                            </h4>
                            <p className="text-xs text-muted-foreground max-w-sm">
                                Select a conversation from the left to read supporter inquiries and send live responses.
                            </p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    const { toast } = useToast();
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
    const [heroImagePreview, setHeroImagePreview] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'events' | 'bookings' | 'blogs' | 'users' | 'support'>('events');
    const [supportUnreadCount, setSupportUnreadCount] = useState(0);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);

    const [activities, setActivities] = useState<any[]>([]);
    const [speakers, setSpeakers] = useState<any[]>([]);
    const [faqs, setFaqs] = useState<any[]>([]);
    const [features, setFeatures] = useState<string[]>([]);
    const [journey, setJourney] = useState({ arrival: "", expectations: "" });
    const [acceptedContributions, setAcceptedContributions] = useState<string[]>(ALL_CONTRIBUTION_OPTIONS);
    const [volunteerRoles, setVolunteerRoles] = useState<string[]>(ALL_VOLUNTEER_ROLES);

    useEffect(() => {
        fetchEvents();
        fetchUnreadSupport();

        const channel = supabase
            .channel('admin-support-unread-badge')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'SupportConversation'
                },
                () => {
                    fetchUnreadSupport();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchUnreadSupport = async () => {
        try {
            const { data } = await supabase
                .from('SupportConversation')
                .select('unreadAdminCount');
            if (data) {
                const total = data.reduce((sum, item: any) => sum + (item.unreadAdminCount || 0), 0);
                setSupportUnreadCount(total);
            }
        } catch (err) {
            console.error('[Admin] Error fetching unread support count:', err);
        }
    };

    const fetchEvents = async () => {
        try {
            const { data, error } = await supabase
                .from('Event')
                .select('*')
                .order('createdAt', { ascending: false });

            if (error) throw error;
            setEvents(data || []);
        } catch (error: any) {
            toast({ title: "Error fetching events", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setSelectedImages(prev => [...prev, ...files]);

            const newPreviews = files.map(file => URL.createObjectURL(file));
            setImagePreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const uploadSingleImage = async (file: File, folder: string = "events"): Promise<string> => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        const uploadPromise = supabase.storage
            .from('event-media')
            .upload(filePath, file);

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Upload timed out for ${file.name}`)), 30000)
        );

        const { error: uploadError } = await Promise.race([uploadPromise, timeoutPromise]) as any;
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('event-media')
            .getPublicUrl(filePath);

        return publicUrl;
    };

    const uploadImages = async (): Promise<string[]> => {
        if (selectedImages.length === 0) return [];
        if (selectedImages.length > 10) {
            const msg = "Maximum 10 gallery images allowed.";
            toast({ title: "Upload limit", description: msg, variant: "destructive" });
            throw new Error(msg);
        }

        setUploading(true);
        try {
            const uploadPromises = selectedImages.map(file => uploadSingleImage(file, "events"));
            return await Promise.all(uploadPromises);
        } catch (error: any) {
            toast({ title: "Upload failed", description: error.message, variant: "destructive" });
            throw error;
        } finally {
            setUploading(false);
        }
    };

    const toggleContribution = (item: string) => {
        setAcceptedContributions(prev =>
            prev.includes(item) ? prev.filter(c => c !== item) : [...prev, item]
        );
    };

    const toggleVolunteerRole = (role: string) => {
        setVolunteerRoles(prev =>
            prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
        );
    };

    const handleEditClick = (event: Event) => {
        setEditingEvent(event);
        setActivities(event.activities || []);
        setSpeakers(event.speakers || []);
        setFaqs(event.faqs || []);
        setFeatures(event.features || []);
        setJourney(event.journey || { arrival: "", expectations: "" });
        setAcceptedContributions(event.accepted_contributions && event.accepted_contributions.length > 0 ? event.accepted_contributions : ALL_CONTRIBUTION_OPTIONS);
        setVolunteerRoles(event.volunteer_roles && event.volunteer_roles.length > 0 ? event.volunteer_roles : ALL_VOLUNTEER_ROLES);
        setHeroImagePreview(event.heroImageUrl || null);
        setHeroImageFile(null);

        const form = document.querySelector('form') as HTMLFormElement;
        if (form) {
            const titleInput = form.querySelector('#title') as HTMLInputElement;
            const themeInput = form.querySelector('#theme') as HTMLInputElement;
            const dateInput = form.querySelector('#date') as HTMLInputElement;
            const priceInput = form.querySelector('#price') as HTMLInputElement;
            const locationInput = form.querySelector('#location') as HTMLInputElement;
            const descriptionInput = form.querySelector('#description') as HTMLTextAreaElement;
            const targetAmountInput = form.querySelector('#target_amount') as HTMLInputElement;
            const organizerContactInput = form.querySelector('#organizer_contact') as HTMLInputElement;
            const youtubeVideoUrlInput = form.querySelector('#youtube_video_url') as HTMLInputElement;
            const typeInput = form.querySelector('#type') as HTMLSelectElement;
            const meetingLinkInput = form.querySelector('#meeting_link') as HTMLInputElement;

            if (titleInput) titleInput.value = event.title;
            if (themeInput) themeInput.value = event.theme || "";
            if (dateInput) dateInput.value = event.date ? new Date(event.date).toISOString().split('T')[0] : "";
            if (priceInput) priceInput.value = event.price?.toString() || "0";
            if (locationInput) locationInput.value = event.location || "";
            if (descriptionInput) descriptionInput.value = event.description || "";
            if (targetAmountInput) targetAmountInput.value = event.target_amount?.toString() || "0";
            if (organizerContactInput) organizerContactInput.value = event.organizer_contact || "+254 798 182 108 / +254 798 332 690";
            if (youtubeVideoUrlInput) youtubeVideoUrlInput.value = event.youtube_video_url || "";
            if (typeInput) typeInput.value = event.type || "PHYSICAL";
            if (meetingLinkInput) meetingLinkInput.value = event.meeting_link || "";
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingEvent(null);
        setActivities([]);
        setSpeakers([]);
        setFaqs([]);
        setFeatures([]);
        setJourney({ arrival: "", expectations: "" });
        setAcceptedContributions(ALL_CONTRIBUTION_OPTIONS);
        setVolunteerRoles(ALL_VOLUNTEER_ROLES);
        setSelectedImages([]);
        setImagePreviews([]);
        setHeroImageFile(null);
        setHeroImagePreview(null);
        const form = document.querySelector('form') as HTMLFormElement;
        if (form) form.reset();
    };

    const onSubmitEvent = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const title = formData.get('title') as string;
        const theme = formData.get('theme') as string;
        const description = formData.get('description') as string;
        const dateStr = formData.get('date') as string;
        const location = formData.get('location') as string;
        const priceStr = formData.get('price') as string;
        const type = (formData.get('type') as string) || 'PHYSICAL';
        const meetingLink = formData.get('meeting_link') as string;
        const targetAmountStr = formData.get('target_amount') as string;
        const organizerContact = formData.get('organizer_contact') as string;
        const youtubeVideoUrl = formData.get('youtube_video_url') as string;

        try {
            if (!dateStr) throw new Error("Please select a date for the outreach event.");
            const eventDate = new Date(dateStr);
            if (isNaN(eventDate.getTime())) throw new Error("Invalid date selected.");

            setUploading(true);

            let finalHeroImageUrl = editingEvent?.heroImageUrl || "";
            if (heroImageFile) {
                finalHeroImageUrl = await uploadSingleImage(heroImageFile, "events");
            } else if (!editingEvent) {
                throw new Error("A hero image is required for new outreach events.");
            }

            const imageUrls = await uploadImages();

            const speakersWithImages = await Promise.all(speakers.map(async (s) => {
                if (s.imageFile) {
                    const url = await uploadSingleImage(s.imageFile, "speakers");
                    const { imageFile, ...rest } = s;
                    return { ...rest, imageUrl: url };
                }
                const { imageFile, ...rest } = s;
                return rest;
            }));

            const eventPayload = {
                title,
                theme,
                description,
                date: eventDate.toISOString(),
                location,
                price: parseFloat(priceStr) || 0,
                heroImageUrl: finalHeroImageUrl,
                activities,
                speakers: speakersWithImages,
                faqs,
                features: features.filter(f => f.trim().length > 0),
                journey,
                type,
                meeting_link: meetingLink,
                target_amount: parseFloat(targetAmountStr) || 0,
                organizer_contact: organizerContact || "+254 798 182 108 / +254 798 332 690",
                youtube_video_url: youtubeVideoUrl || "",
                accepted_contributions: acceptedContributions.length > 0 ? acceptedContributions : ALL_CONTRIBUTION_OPTIONS,
                volunteer_roles: volunteerRoles.length > 0 ? volunteerRoles : ALL_VOLUNTEER_ROLES,
            };

            if (editingEvent) {
                const finalImageUrls = imageUrls.length > 0 ? [...(editingEvent.imageUrls || []), ...imageUrls] : (editingEvent.imageUrls || []);
                const { error } = await supabase
                    .from('Event')
                    .update({
                        ...eventPayload,
                        imageUrls: finalImageUrls,
                    })
                    .eq('id', editingEvent.id);

                if (error) throw error;
                toast({ title: "Outreach event updated successfully!" });
            } else {
                const { error } = await supabase
                    .from('Event')
                    .insert({
                        ...eventPayload,
                        imageUrls,
                    });

                if (error) throw error;
                toast({ title: "Outreach event created successfully!" });
            }

            await fetchEvents();
            cancelEdit();
        } catch (error: any) {
            toast({
                title: "Error saving outreach event",
                description: error.message || "An unexpected error occurred",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
            setUploading(false);
        }
    };

    const deleteEvent = async (id: string) => {
        if (!confirm("Are you sure you want to delete this outreach event?")) return;

        try {
            const { error } = await supabase
                .from('Event')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast({ title: "Event deleted" });
            fetchEvents();
        } catch (error: any) {
            toast({ title: "Error deleting event", description: error.message, variant: "destructive" });
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    return (
        <div className="container mx-auto px-4 py-8 min-h-screen bg-background text-foreground">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-foreground">Admin Control Center</h1>
                    <p className="text-sm text-muted-foreground">Manage charity outreach missions, donations, installment pledges, stories, and live support.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant={activeTab === 'events' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('events')}
                    >
                        Outreach Events
                    </Button>
                    <Button
                        variant={activeTab === 'bookings' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('bookings')}
                    >
                        Donations & Pledges
                    </Button>
                    <Button
                        variant={activeTab === 'blogs' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('blogs')}
                    >
                        Stories & Blogs
                    </Button>
                    <Button
                        variant={activeTab === 'users' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('users')}
                    >
                        Supporters
                    </Button>
                    <Button
                        variant={activeTab === 'support' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('support')}
                        className="relative flex items-center gap-1.5"
                    >
                        <Headphones className="w-4 h-4" />
                        <span>Live Support</span>
                        {supportUnreadCount > 0 && (
                            <span className="bg-[#b8240d] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                                {supportUnreadCount}
                            </span>
                        )}
                    </Button>
                </div>
            </div>

            {activeTab === 'support' && <SupportChatManager />}
            {activeTab === 'users' && <UserManager />}
            {activeTab === 'bookings' && <BookingManager />}

            {activeTab === 'events' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Streamlined Charity Outreach Event Form */}
                    <Card className="lg:col-span-1 border-border bg-card">
                        <CardHeader>
                            <CardTitle>{editingEvent ? "Edit Outreach Event" : "Create Outreach Event"}</CardTitle>
                            <CardDescription>
                                {editingEvent ? `Modifying: ${editingEvent.title}` : "Schedule an upcoming charity visit or archive a past outreach mission."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={onSubmitEvent} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Outreach Title</Label>
                                    <Input id="title" name="title" required placeholder="e.g. Kayole Children's Home Visit & Cooking" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="theme">Mission Theme / Tagline</Label>
                                    <Input id="theme" name="theme" placeholder="e.g. Compassion in Action — Sharing Warm Meals" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="date">Event Date</Label>
                                        <Input id="date" name="date" type="date" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="price">Suggested Donation (KES)</Label>
                                        <Input id="price" name="price" type="number" step="1" placeholder="0 (Open Voluntary)" defaultValue="0" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="type">Participation Mode</Label>
                                        <select
                                            id="type"
                                            name="type"
                                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                            defaultValue="PHYSICAL"
                                        >
                                            <option value="PHYSICAL">In-Person & Remote Donations</option>
                                            <option value="BOTH">Hybrid (In-Person + Livestream)</option>
                                            <option value="VIRTUAL">Virtual / Remote Fundraising</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="meeting_link">Livestream / Coord Link (Optional)</Label>
                                        <Input id="meeting_link" name="meeting_link" placeholder="WhatsApp Group / Meet Link" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="location">Outreach Location / Venue</Label>
                                    <Input id="location" name="location" required placeholder="e.g. Nairobi, Kenya" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description" className="font-semibold">Mission Overview & Needs</Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        required
                                        placeholder="Describe the children's home or community we are visiting, what we will cook/distribute, and how supporters can help..."
                                    />
                                </div>

                                {/* Charity Outreach & Contributions Configuration */}
                                <div className="space-y-4 border-t border-border pt-4 bg-muted/30 p-4 rounded-xl border">
                                    <div className="flex items-center gap-2">
                                        <Heart className="w-5 h-5 text-[#b8240d] fill-[#b8240d]" />
                                        <h3 className="font-bold text-xs uppercase tracking-wider text-foreground">
                                            Outreach Goal & Contributions Setup
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="target_amount" className="font-semibold text-xs">Target Fundraising Goal (KES)</Label>
                                            <Input id="target_amount" name="target_amount" type="number" step="1" placeholder="e.g. 50000" />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="organizer_contact" className="font-semibold text-xs">Organizer Support Contact</Label>
                                            <Input id="organizer_contact" name="organizer_contact" placeholder="+254 798 182 108 / +254 798 332 690" defaultValue="+254 798 182 108 / +254 798 332 690" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="youtube_video_url" className="font-semibold text-xs">Outreach Documentary YouTube URL (Optional)</Label>
                                        <Input id="youtube_video_url" name="youtube_video_url" placeholder="https://www.youtube.com/embed/..." />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="font-semibold text-xs">Accepted In-Kind & Financial Contributions</Label>
                                        <div className="grid grid-cols-1 gap-2 bg-card p-3 rounded-lg border border-border">
                                            {ALL_CONTRIBUTION_OPTIONS.map((item) => (
                                                <label key={item} className="flex items-center gap-2 text-xs text-foreground cursor-pointer hover:text-primary">
                                                    <input
                                                        type="checkbox"
                                                        checked={acceptedContributions.includes(item)}
                                                        onChange={() => toggleContribution(item)}
                                                        className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                                                    />
                                                    <span>{item}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="font-semibold text-xs">Event-Day Volunteer Activities Offered</Label>
                                        <div className="grid grid-cols-1 gap-2 bg-card p-3 rounded-lg border border-border">
                                            {ALL_VOLUNTEER_ROLES.map((role) => (
                                                <label key={role} className="flex items-center gap-2 text-xs text-foreground cursor-pointer hover:text-primary">
                                                    <input
                                                        type="checkbox"
                                                        checked={volunteerRoles.includes(role)}
                                                        onChange={() => toggleVolunteerRole(role)}
                                                        className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                                                    />
                                                    <span>{role}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Key Highlights */}
                                <div className="space-y-2 border-t border-border pt-4">
                                    <Label className="font-semibold">Key Outreach Highlights (one per line)</Label>
                                    <Textarea
                                        placeholder={"Cooking & Sharing Hot Lunch\nMentorship & Life Skills Circle\nDistribution of Books & Shoes"}
                                        className="min-h-[100px] bg-background"
                                        value={features.join('\n')}
                                        onChange={e => setFeatures(e.target.value.split('\n'))}
                                    />
                                </div>

                                {/* Schedule / Itinerary */}
                                <div className="space-y-4 border-t border-border pt-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Outreach Schedule / Itinerary</h3>
                                        <Button type="button" variant="outline" size="sm" onClick={() => setActivities([...activities, { day: activities.length + 1, date: "", items: [] }])}>
                                            + Add Schedule Block
                                        </Button>
                                    </div>
                                    {activities.map((day, dIdx) => (
                                        <Card key={dIdx} className="p-4 space-y-3 bg-muted/20 border-border">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-primary font-bold">Schedule Block {day.day}</Label>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setActivities(activities.filter((_, i) => i !== dIdx))} className="text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <Input placeholder="Session / Time (e.g. Morning Arrival & Kitchen Prep)" value={day.date} className="bg-background" onChange={e => {
                                                const newA = [...activities];
                                                newA[dIdx].date = e.target.value;
                                                setActivities(newA);
                                            }} />
                                            <Button type="button" variant="secondary" size="sm" className="w-full" onClick={() => {
                                                const newA = [...activities];
                                                newA[dIdx].items.push({ title: "", description: "" });
                                                setActivities(newA);
                                            }}>+ Add Activity Item</Button>
                                            <div className="space-y-3">
                                                {day.items.map((item: any, iIdx: number) => (
                                                    <div key={iIdx} className="pl-3 border-l-2 border-primary/30 space-y-2 mt-2 py-1">
                                                        <Input placeholder="Activity Title" value={item.title} className="bg-background" onChange={e => {
                                                            const newA = [...activities];
                                                            newA[dIdx].items[iIdx].title = e.target.value;
                                                            setActivities(newA);
                                                        }} />
                                                        <Textarea placeholder="Description" className="min-h-[60px] bg-background" value={item.description} onChange={e => {
                                                            const newA = [...activities];
                                                            newA[dIdx].items[iIdx].description = e.target.value;
                                                            setActivities(newA);
                                                        }} />
                                                    </div>
                                                ))}
                                            </div>
                                        </Card>
                                    ))}
                                </div>

                                {/* Mentors / Coordinators */}
                                <div className="space-y-4 border-t border-border pt-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Outreach Leaders & Mentors</h3>
                                        <Button type="button" variant="outline" size="sm" onClick={() => setSpeakers([...speakers, { name: "", role: "", bio: "", imageUrl: "", imageFile: null }])}>
                                            + Add Leader/Mentor
                                        </Button>
                                    </div>
                                    {speakers.map((s, idx) => (
                                        <Card key={idx} className="p-4 space-y-3 bg-muted/20 border-border">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center space-x-3 flex-1">
                                                    <div className="relative h-12 w-12 ring-2 ring-primary/20 rounded-full shrink-0">
                                                        {s.imageFile ? (
                                                            <img src={URL.createObjectURL(s.imageFile)} className="h-full w-full object-cover rounded-full" />
                                                        ) : s.imageUrl ? (
                                                            <img src={s.imageUrl} className="h-full w-full object-cover rounded-full" />
                                                        ) : (
                                                            <div className="h-full w-full bg-primary/5 rounded-full flex items-center justify-center">
                                                                <User2 className="h-6 w-6 text-primary/40" />
                                                            </div>
                                                        )}
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            id={`speaker-img-${idx}`}
                                                            onChange={e => {
                                                                if (e.target.files?.[0]) {
                                                                    const newS = [...speakers];
                                                                    newS[idx].imageFile = e.target.files[0];
                                                                    setSpeakers(newS);
                                                                }
                                                            }}
                                                        />
                                                        <label htmlFor={`speaker-img-${idx}`} className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground p-1 rounded-full cursor-pointer shadow-sm">
                                                            <Plus className="h-3 w-3" />
                                                        </label>
                                                    </div>
                                                    <Input placeholder="Leader Name" value={s.name} className="flex-1 bg-background" onChange={e => {
                                                        const newS = [...speakers];
                                                        newS[idx].name = e.target.value;
                                                        setSpeakers(newS);
                                                    }} />
                                                </div>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setSpeakers(speakers.filter((_, i) => i !== idx))} className="text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <Input placeholder="Role (e.g. Outreach Coordinator / Counselor)" value={s.role} className="bg-background" onChange={e => {
                                                const newS = [...speakers];
                                                newS[idx].role = e.target.value;
                                                setSpeakers(newS);
                                            }} />
                                            <Textarea placeholder="Short Bio" className="min-h-[60px] bg-background" value={s.bio} onChange={e => {
                                                const newS = [...speakers];
                                                newS[idx].bio = e.target.value;
                                                setSpeakers(newS);
                                            }} />
                                        </Card>
                                    ))}
                                </div>

                                {/* FAQs */}
                                <div className="space-y-4 border-t border-border pt-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">FAQs</h3>
                                        <Button type="button" variant="outline" size="sm" onClick={() => setFaqs([...faqs, { question: "", answer: "" }])}>
                                            + Add FAQ
                                        </Button>
                                    </div>
                                    {faqs.map((f, idx) => (
                                        <Card key={idx} className="p-4 space-y-3 bg-muted/20 border-border">
                                            <div className="flex justify-between items-start gap-2">
                                                <Input placeholder="Question" className="bg-background flex-1" value={f.question} onChange={e => {
                                                    const newF = [...faqs];
                                                    newF[idx].question = e.target.value;
                                                    setFaqs(newF);
                                                }} />
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setFaqs(faqs.filter((_, i) => i !== idx))} className="text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <Textarea placeholder="Detailed Answer" className="min-h-[60px] bg-background" value={f.answer} onChange={e => {
                                                const newF = [...faqs];
                                                newF[idx].answer = e.target.value;
                                                setFaqs(newF);
                                            }} />
                                        </Card>
                                    ))}
                                </div>

                                {/* Volunteer Preparation Guide */}
                                <div className="space-y-4 border-t border-border pt-4">
                                    <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Volunteer Arrival & Preparation Guide</h3>
                                    <div className="space-y-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold">Meeting Point & Arrival Logistics</Label>
                                            <Textarea placeholder="Where volunteers meet, transport coordination, drop-off instructions..." className="bg-background min-h-[80px]" value={journey.arrival} onChange={e => setJourney({ ...journey, arrival: e.target.value })} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold">What to Bring / Expect</Label>
                                            <Textarea placeholder="Comfortable attire for cooking and games, schedule overview..." className="bg-background min-h-[80px]" value={journey.expectations} onChange={e => setJourney({ ...journey, expectations: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                {/* Hero Image */}
                                <div className="space-y-2 border-t border-border pt-4">
                                    <Label className="font-semibold">Hero Banner Image (Required)</Label>
                                    <div className="flex flex-col space-y-2">
                                        {heroImagePreview ? (
                                            <div className="relative group w-full max-w-sm aspect-video">
                                                <img src={heroImagePreview} className="w-full h-full object-cover rounded-xl border border-border" />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setHeroImagePreview(null);
                                                        setHeroImageFile(null);
                                                    }}
                                                    className="absolute top-2 right-2 bg-destructive text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        if (e.target.files?.[0]) {
                                                            const file = e.target.files[0];
                                                            setHeroImageFile(file);
                                                            setHeroImagePreview(URL.createObjectURL(file));
                                                        }
                                                    }}
                                                    className="hidden"
                                                    id="hero-image-upload"
                                                />
                                                <Label
                                                    htmlFor="hero-image-upload"
                                                    className="flex items-center justify-center w-full max-w-sm aspect-video border-2 border-dashed border-primary/50 rounded-xl cursor-pointer hover:bg-primary/5 transition-colors"
                                                >
                                                    <div className="flex flex-col items-center">
                                                        <Upload className="h-8 w-8 text-primary mb-2" />
                                                        <span className="text-sm font-medium text-primary">Upload Hero Image</span>
                                                        <span className="text-xs text-muted-foreground mt-1">Recommended: 16:9 ratio</span>
                                                    </div>
                                                </Label>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Gallery Images */}
                                <div className="space-y-2 border-t border-border pt-4">
                                    <Label>Outreach Media Gallery</Label>
                                    <div className="flex items-center space-x-2">
                                        <Input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                            id="image-upload"
                                        />
                                        <Label
                                            htmlFor="image-upload"
                                            className="flex items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-muted/40 transition-colors"
                                        >
                                            <div className="flex flex-col items-center">
                                                <Upload className="h-6 w-6 text-muted-foreground" />
                                                <span className="text-sm text-muted-foreground">Click to upload gallery photos</span>
                                            </div>
                                        </Label>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                        {imagePreviews.map((src, i) => (
                                            <div key={i} className="relative group aspect-square">
                                                <img src={src} className="w-full h-full object-cover rounded-lg" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(i)}
                                                    className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Button type="submit" className="flex-1 font-bold" disabled={isSubmitting || uploading}>
                                        {(isSubmitting || uploading) ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                        {editingEvent ? "Update Outreach Event" : "Publish Outreach Event"}
                                    </Button>
                                    {editingEvent && (
                                        <Button type="button" variant="outline" onClick={cancelEdit}>
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Existing Outreach Events List */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-xl font-bold text-foreground mb-4">Scheduled & Past Outreach Events</h2>
                        {events.length === 0 ? (
                            <p className="text-muted-foreground italic">No events found.</p>
                        ) : (
                            events.map(event => (
                                <Card key={event.id} className="border-border bg-card">
                                    <CardContent className="p-4 flex items-start space-x-4">
                                        {event.heroImageUrl || event.imageUrls?.[0] ? (
                                            <img src={event.heroImageUrl || event.imageUrls?.[0]} className="w-24 h-24 object-cover rounded-xl flex-shrink-0 border border-border" />
                                        ) : (
                                            <div className="w-24 h-24 bg-muted flex items-center justify-center rounded-xl flex-shrink-0">
                                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg text-foreground">{event.title}</h3>
                                            <p className="text-sm text-muted-foreground mb-1">
                                                {format(new Date(event.date), 'PPP')} • {event.location} • {Number(event.price) > 0 ? `Suggested KES ${Number(event.price).toLocaleString()}` : 'Open Voluntary Giving'}
                                            </p>
                                            {Number(event.target_amount) > 0 && (
                                                <p className="text-xs font-bold text-primary mb-1">
                                                    Target Goal: KES {Number(event.target_amount).toLocaleString()} • Contact: {event.organizer_contact || "+254 798 182 108 / +254 798 332 690"}
                                                </p>
                                            )}
                                            <p className="text-muted-foreground line-clamp-2 text-sm">{event.description}</p>
                                            {event.accepted_contributions && event.accepted_contributions.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {event.accepted_contributions.slice(0, 4).map((c: string, idx: number) => (
                                                        <span key={idx} className="text-[10px] bg-muted px-2 py-0.5 rounded-md text-muted-foreground font-medium">
                                                            {c}
                                                        </span>
                                                    ))}
                                                    {event.accepted_contributions.length > 4 && (
                                                        <span className="text-[10px] text-muted-foreground">+{event.accepted_contributions.length - 4} more</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => handleEditClick(event)}
                                                className="text-primary hover:bg-primary/10 rounded-lg p-2 transition-colors"
                                                title="Edit Outreach Event"
                                            >
                                                <Edit2 className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => deleteEvent(event.id)}
                                                className="text-destructive hover:bg-destructive/10 rounded-lg p-2 transition-colors"
                                                title="Delete Outreach Event"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'blogs' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <BlogManager />
                </div>
            )}
        </div>
    );
}
