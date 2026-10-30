
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Edit2, Upload, Image as ImageIcon, CheckCircle, User2, Headphones, MessageSquare, Send, CheckCheck, Check, Search, MessageCircle, Heart, Target, DollarSign, Gift, Users, Phone } from "lucide-react";
import { format } from "date-fns";
import { Event, insertEventSchema, VisaInvitation, Booking, SupportConversation, SupportMessage } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
    const [userActivity, setUserActivity] = useState<any>({
        bookings: [],
        proposals: [],
        applications: [],
        visaRequests: []
    });
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
            const [bookingsRes, proposalsRes, applicationsRes, visaRes] = await Promise.all([
                supabase.from('Booking').select('*, Event(title)').eq('userId', userId),
                supabase.from('Proposals').select('*, Event(title)').eq('userId', userId),
                supabase.from('Applications').select('*').eq('userId', userId),
                supabase.from('VisaInvitation').select('*, Event(title)').eq('userId', userId)
            ]);

            setUserActivity({
                bookings: bookingsRes.data || [],
                proposals: proposalsRes.data || [],
                applications: applicationsRes.data || [],
                visaRequests: visaRes.data || []
            });
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
                <h2 className="text-xl font-bold text-primary">User Management</h2>
                <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-xs"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Users List */}
                <Card className="lg:col-span-1 h-[600px] flex flex-col">
                    <CardHeader className="py-4">
                        <CardTitle className="text-lg">Registered Users ({filteredUsers.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-2 space-y-2">
                        {filteredUsers.length === 0 ? (
                            <p className="text-center text-gray-500 py-4 italic">No users found.</p>
                        ) : (
                            filteredUsers.map(u => (
                                <button
                                    key={u.id}
                                    onClick={() => {
                                        setSelectedUser(u);
                                        fetchUserActivity(u.id);
                                    }}
                                    className={cn(
                                        "w-full text-left p-3 rounded-md transition-colors border",
                                        selectedUser?.id === u.id
                                            ? "bg-primary/10 border-primary shadow-sm"
                                            : "bg-card hover:bg-slate-50 border-transparent hover:border-border"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {u.name?.charAt(0)?.toUpperCase()}
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="font-semibold truncate">{u.name}</p>
                                            <p className="text-xs text-gray-500 truncate">{u.email}</p>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* User Details & Activity */}
                <Card className="lg:col-span-2 h-[600px] flex flex-col">
                    {!selectedUser ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-4">
                            <User2 className="h-16 w-16 opacity-20" />
                            <p>Select a user to view their complete activity.</p>
                        </div>
                    ) : (
                        <>
                            <CardHeader className="border-b bg-slate-50/50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-2xl">{selectedUser.name}</CardTitle>
                                        <CardDescription>{selectedUser.email}</CardDescription>
                                        <div className="flex gap-2 mt-2 text-xs flex-wrap">
                                            <span className="bg-primary/10 text-primary px-2 py-1 rounded-md font-medium">Role: {selectedUser.role}</span>
                                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md">Joined: {format(new Date(selectedUser.createdAt), 'MMM yyyy')}</span>
                                        </div>
                                        {(selectedUser.phone || selectedUser.country || selectedUser.city || selectedUser.address) && (
                                            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-600">
                                                {selectedUser.phone && <p><span className="font-semibold text-slate-400">Phone:</span> {selectedUser.phone}</p>}
                                                {selectedUser.country && <p><span className="font-semibold text-slate-400">Country:</span> {selectedUser.country}</p>}
                                                {selectedUser.city && <p><span className="font-semibold text-slate-400">City:</span> {selectedUser.city}</p>}
                                                {selectedUser.address && <p><span className="font-semibold text-slate-400">Address:</span> {selectedUser.address}</p>}
                                            </div>
                                        )}
                                    </div>
                                    {selectedUser.Stats?.[0] && (
                                        <div className="text-right text-sm text-gray-500">
                                            <p>Events Attended: <strong className="text-primary">{selectedUser.Stats[0].eventsAttended || 0}</strong></p>
                                            <p>Points: <strong className="text-primary">{selectedUser.Stats[0].points || 0}</strong></p>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto p-6 space-y-8">
                                {isFetchingActivity ? (
                                    <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
                                ) : (
                                    <>
                                        {/* Bookings Overview */}
                                        <section>
                                            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">Event Bookings <span className="text-sm bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">{userActivity.bookings.length}</span></h3>
                                            {userActivity.bookings.length === 0 ? <p className="text-sm text-gray-500 italic">No event bookings yet.</p> : (
                                                <div className="grid gap-2">
                                                    {userActivity.bookings.map((b: any) => (
                                                        <div key={b.id} className="text-sm p-3 bg-slate-50 border rounded-md flex justify-between items-center">
                                                            <div>
                                                                <p className="font-medium text-primary">{b.Event?.title}</p>
                                                                <p className="text-xs text-gray-500">Category: {b.category}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-bold">KES {Number(b.amountPaid || 0).toLocaleString()}</p>
                                                                <span className={cn(
                                                                    "text-[10px] px-2 py-0.5 rounded-full uppercase",
                                                                    b.status === 'CONFIRMED' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                                                                )}>{b.status}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </section>

                                        {/* Applications Overview */}
                                        <section>
                                            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">Applications <span className="text-sm bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">{userActivity.applications.length}</span></h3>
                                            {userActivity.applications.length === 0 ? <p className="text-sm text-gray-500 italic">No applications submitted.</p> : (
                                                <div className="grid gap-2">
                                                    {userActivity.applications.map((a: any) => (
                                                        <div key={a.id} className="text-sm p-3 bg-slate-50 border rounded-md">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="font-bold text-primary">{a.type}</span>
                                                                <span className={cn(
                                                                    "text-[10px] px-2 py-0.5 rounded-full uppercase",
                                                                    a.status === 'APPROVED' ? "bg-green-100 text-green-700" :
                                                                        a.status === 'REJECTED' ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                                                                )}>{a.status}</span>
                                                            </div>
                                                            <p className="text-xs text-gray-600 line-clamp-2">{a.description}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </section>

                                        {/* Proposals Overview */}
                                        <section>
                                            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">Proposals <span className="text-sm bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">{userActivity.proposals.length}</span></h3>
                                            {userActivity.proposals.length === 0 ? <p className="text-sm text-gray-500 italic">No proposals submitted.</p> : (
                                                <div className="grid gap-2">
                                                    {userActivity.proposals.map((p: any) => (
                                                        <div key={p.id} className="text-sm p-3 bg-slate-50 border rounded-md">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="font-medium">{p.Event?.title}</span>
                                                                <span className={cn(
                                                                    "text-[10px] px-2 py-0.5 rounded-full uppercase",
                                                                    p.status === 'APPROVED' ? "bg-green-100 text-green-700" :
                                                                        p.status === 'REJECTED' ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                                                                )}>{p.status}</span>
                                                            </div>
                                                            <p className="text-xs text-gray-600 line-clamp-1">{p.description}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </section>

                                        {/* Visa Requests Overview */}
                                        <section>
                                            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">Visa Requests <span className="text-sm bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">{userActivity.visaRequests.length}</span></h3>
                                            {userActivity.visaRequests.length === 0 ? <p className="text-sm text-gray-500 italic">No visa requests.</p> : (
                                                <div className="grid gap-2">
                                                    {userActivity.visaRequests.map((v: any) => (
                                                        <div key={v.id} className="text-sm p-3 bg-slate-50 border rounded-md flex justify-between items-center">
                                                            <span className="font-medium text-primary">{v.Event?.title}</span>
                                                            <span className={cn(
                                                                "text-[10px] px-2 py-0.5 rounded-full uppercase font-bold",
                                                                v.status === 'APPROVED' ? "text-green-600" : "text-yellow-600"
                                                            )}>{v.status}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </section>
                                    </>
                                )}
                            </CardContent>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
}

function VisaInvitationManager() {
    const [requests, setRequests] = useState<VisaInvitation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        const { data, error } = await supabase
            .from('VisaInvitation')
            .select('*, User(*), Event(*)')
            .order('createdAt', { ascending: false });

        if (!error) setRequests(data || []);
        setIsLoading(false);
    };

    const handleUploadLetter = async (requestId: string, file: File) => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${requestId}.${fileExt}`;
            const filePath = `visa-letters/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('visa-documents')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('visa-documents')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('VisaInvitation')
                .update({
                    letterUrl: publicUrl,
                    status: 'APPROVED'
                })
                .eq('id', requestId);

            if (updateError) throw updateError;

            toast({ title: "Letter uploaded and request approved!" });
            fetchRequests();
        } catch (error: any) {
            toast({ title: "Upload failed", description: error.message, variant: "destructive" });
        }
    };

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-primary mb-4">Visa Invitation Requests</h2>
            {requests.length === 0 ? (
                <p className="text-gray-500 italic">No visa requests found.</p>
            ) : (
                <div className="grid gap-4">
                    {requests.map(req => (
                        <Card key={req.id}>
                            <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold">{req.user?.name}</h3>
                                        <span className={cn(
                                            "text-[10px] px-2 py-0.5 rounded-full font-bold",
                                            req.status === 'PAID' ? "bg-blue-100 text-blue-700" :
                                                req.status === 'APPROVED' ? "bg-green-100 text-green-700" :
                                                    "bg-gray-100 text-gray-700"
                                        )}>
                                            {req.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500">{req.user?.email}</p>
                                    {(req.user?.phone || req.user?.country || req.user?.city || req.user?.address) && (
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 my-2 bg-slate-50 p-2 rounded border">
                                            {req.user?.phone && <span><strong className="text-slate-400">Phone:</strong> {req.user.phone}</span>}
                                            {req.user?.country && <span><strong className="text-slate-400">Country:</strong> {req.user.country}</span>}
                                            {req.user?.city && <span><strong className="text-slate-400">City:</strong> {req.user.city}</span>}
                                            {req.user?.address && <span><strong className="text-slate-400">Address:</strong> {req.user.address}</span>}
                                        </div>
                                    )}
                                    <div className="flex flex-wrap gap-4 text-xs mt-2 items-center">
                                        <p className="text-primary font-medium">Event: {req.event?.title}</p>
                                        <p className="bg-slate-100 px-2 py-1 rounded">Payment: <strong className={req.paymentStatus === 'PAID' ? "text-green-600" : "text-yellow-600"}>{req.paymentStatus === 'PAID' ? 'COMPLETED' : 'PENDING'}</strong></p>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1">Date: {format(new Date(req.createdAt), 'PPP')}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {req.letterUrl ? (
                                        <Button variant="outline" size="sm" asChild>
                                            <a href={req.letterUrl} target="_blank" rel="noreferrer">View Letter</a>
                                        </Button>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="file"
                                                className="hidden"
                                                id={`upload-visa-${req.id}`}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleUploadLetter(req.id, file);
                                                }}
                                            />
                                            <Label
                                                htmlFor={`upload-visa-${req.id}`}
                                                className="h-9 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md cursor-pointer flex items-center text-sm font-medium"
                                            >
                                                <Upload className="h-4 w-4 mr-2" /> Upload Letter
                                            </Label>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
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
            console.error("[Blog] Post failed:", error);
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
            <Card className="lg:col-span-1">
                <CardHeader><CardTitle>Create Post</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={onSubmitBlog} className="space-y-4">
                        <Input name="title" placeholder="Title" required />
                        <Input name="imageUrl" placeholder="Image URL (e.g. from Unsplash)" />
                        <Textarea name="content" className="min-h-[200px]" placeholder="Content..." required />
                        <Button type="submit" disabled={isSubmitting} className="w-full">Post Blog</Button>
                    </form>
                </CardContent>
            </Card>
            <div className="lg:col-span-2 space-y-4">
                {blogs.map(blog => (
                    <Card key={blog.id}>
                        <CardContent className="p-4 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold">{blog.title}</h3>
                                <p className="text-sm text-gray-500">{format(new Date(blog.createdAt), 'PPP')}</p>
                            </div>
                            <Button variant="ghost" className="text-red-500" onClick={() => deleteBlog(blog.id)}><Trash2 className="h-4 w-4" /></Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </>
    );
}

function ProposalManager() {
    const [proposals, setProposals] = useState<any[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        fetchProposals();
    }, []);

    const fetchProposals = async () => {
        const { data, error } = await supabase
            .from('Proposals')
            .select('*, User(*), Event(*)')
            .order('createdAt', { ascending: false });

        if (error) {
            console.error("Error fetching proposals:", error);
            return;
        }

        // Lazy auto-approval check
        const now = new Date();
        const updates: any[] = [];
        const processedData = data.map(p => {
            if (p.status === 'PENDING' && p.autoApproveAt && new Date(p.autoApproveAt) < now) {
                updates.push(supabase.from('Proposals').update({ status: 'APPROVED' }).eq('id', p.id));
                return { ...p, status: 'APPROVED' };
            }
            return p;
        });

        if (updates.length > 0) {
            await Promise.all(updates);
            toast({ title: "Auto-approved proposals", description: `${updates.length} pending proposals were auto-approved due to time limit.` });
        }

        setProposals(processedData);
    };

    const updateStatus = async (id: string, status: string) => {
        const { error } = await supabase.from('Proposals').update({ status }).eq('id', id);
        if (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Status updated" });
            fetchProposals();
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-primary mb-4">Event Proposals</h2>
            <div className="grid gap-4">
                {proposals.map(p => (
                    <Card key={p.id}>
                        <CardContent className="p-4 flex flex-col md:flex-row justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold">{p.User?.name}</h3>
                                    <span className={cn(
                                        "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                                        p.status === 'APPROVED' ? "bg-green-100 text-green-700" :
                                            p.status === 'REJECTED' ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                                    )}>{p.status}</span>
                                </div>
                                <p className="text-sm text-gray-500 mb-2">{p.User?.email} • Event: {p.Event?.title}</p>
                                <p className="text-sm bg-slate-50 p-2 rounded border">{p.description}</p>
                                <div className="mt-2 flex items-center">
                                    <span className="text-xs bg-slate-100 px-2 py-1 rounded text-gray-600">Payment: <strong className="text-gray-500">N/A (Free Submission)</strong></span>
                                </div>
                                {p.documentUrl && (
                                    <a href={p.documentUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline mt-2 block">View Document</a>
                                )}
                            </div>
                            {p.status === 'PENDING' && (
                                <div className="flex flex-col gap-2 justify-center min-w-[120px]">
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateStatus(p.id, 'APPROVED')}>Approve</Button>
                                    <Button size="sm" variant="destructive" onClick={() => updateStatus(p.id, 'REJECTED')}>Reject</Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
                {proposals.length === 0 && <p className="text-slate-500 italic">No proposals found.</p>}
            </div>
        </div>
    );
}

function BookingManager() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
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
            toast({ title: "Booking status updated" });
            fetchBookings();
        }
    };

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-primary mb-4">Event Bookings</h2>
            <div className="grid gap-4">
                {bookings.map(booking => (
                    <Card key={booking.id}>
                        <CardContent className="p-4 flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold">{booking.user?.name}</h3>
                                    <span className={cn(
                                        "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                                        booking.status === 'CONFIRMED' ? "bg-green-100 text-green-700" :
                                            booking.status === 'CANCELLED' ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                                    )}>{booking.status}</span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
                                        {booking.mode}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mb-2">{booking.user?.email} • Event: {booking.event?.title}</p>
                                {(booking.user?.phone || booking.user?.country || booking.user?.city || booking.user?.address) && (
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 mb-2 bg-slate-50 p-2 rounded border">
                                        {booking.user?.phone && <span><strong className="text-slate-400">Phone:</strong> {booking.user.phone}</span>}
                                        {booking.user?.country && <span><strong className="text-slate-400">Country:</strong> {booking.user.country}</span>}
                                        {booking.user?.city && <span><strong className="text-slate-400">City:</strong> {booking.user.city}</span>}
                                        {booking.user?.address && <span><strong className="text-slate-400">Address:</strong> {booking.user.address}</span>}
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {booking.attendance_type && (
                                        <span className={cn(
                                            "text-xs px-2.5 py-0.5 rounded-full font-bold",
                                            booking.attendance_type === 'ATTENDING' ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                                        )}>
                                            {booking.attendance_type === 'ATTENDING' ? "Attending in Person" : "Donating & Wishing Well"}
                                        </span>
                                    )}
                                    {booking.delivery_method && (
                                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                                            Delivery: {booking.delivery_method === 'ONLINE_DELIVERY' ? "Courier to Nairobi HQ" : "Bringing on Event Day"}
                                        </span>
                                    )}
                                    {booking.seek_to_adopt && (
                                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                                            Adoption Inquiry
                                        </span>
                                    )}
                                </div>
                                {booking.item_contributions && booking.item_contributions.length > 0 && (
                                    <div className="text-xs text-slate-600 mb-1">
                                        <strong>In-Kind Contributions:</strong> {booking.item_contributions.join(', ')}
                                    </div>
                                )}
                                {booking.volunteer_activities && booking.volunteer_activities.length > 0 && (
                                    <div className="text-xs text-slate-600 mb-1">
                                        <strong>Volunteer Activities:</strong> {booking.volunteer_activities.join(', ')}
                                    </div>
                                )}
                                {booking.mingle_notes && (
                                    <p className="text-xs italic text-slate-600 bg-slate-50 p-1.5 rounded mb-1">
                                        <strong>Activity Idea:</strong> "{booking.mingle_notes}"
                                    </p>
                                )}
                                {booking.wish_note && (
                                    <p className="text-xs italic text-slate-600 bg-amber-50/50 p-1.5 rounded border border-amber-100 mb-1">
                                        <strong>Well Wishes:</strong> "{booking.wish_note}"
                                    </p>
                                )}
                                <div className="flex flex-wrap gap-4 text-xs items-center mt-2">
                                    <span className="text-gray-500">Category: <strong>{booking.category}</strong></span>
                                    <span className="text-gray-500">Amount: <strong>KES {Number(booking.amountPaid || 0).toLocaleString()}</strong></span>
                                    <span className="bg-slate-100 px-2 py-1 rounded text-gray-600">Payment: <strong className={booking.status === 'CONFIRMED' ? "text-green-600" : "text-yellow-600"}>{booking.status === 'CONFIRMED' ? 'COMPLETED' : 'PENDING'}</strong></span>
                                    <span className="text-gray-400 text-[10px]">Date: {format(new Date(booking.createdAt), 'PPP')}</span>
                                </div>
                            </div>
                            {booking.status === 'PENDING' && (
                                <div className="flex flex-row md:flex-col gap-2 justify-center">
                                    <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700" onClick={() => updateBookingStatus(booking.id, 'CONFIRMED')}>Confirm</Button>
                                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => updateBookingStatus(booking.id, 'CANCELLED')}>Cancel</Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
                {bookings.length === 0 && <p className="text-slate-500 italic">No bookings found.</p>}
            </div>
        </div>
    );
}

function ApplicationManager() {
    const [applications, setApplications] = useState<any[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        fetchApps();
    }, []);

    const fetchApps = async () => {
        const { data, error } = await supabase
            .from('Applications')
            .select('*, User(*)')
            .order('createdAt', { ascending: false });
        if (!error) setApplications(data || []);
    };

    const updateStatus = async (id: string, status: string) => {
        const { error } = await supabase.from('Applications').update({ status }).eq('id', id);
        if (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Status updated" });
            fetchApps();
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-primary mb-4">Speaker & Sponsor Applications</h2>
            <div className="grid gap-4">
                {applications.map(app => (
                    <Card key={app.id}>
                        <CardContent className="p-4 flex flex-col md:flex-row justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold">{app.User?.name}</h3>
                                    <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">{app.type}</span>
                                    <span className={cn(
                                        "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                                        app.status === 'APPROVED' ? "bg-green-100 text-green-700" :
                                            app.status === 'REJECTED' ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                                    )}>{app.status}</span>
                                </div>
                                <p className="text-sm text-gray-500 mb-2">{app.User?.email}</p>
                                <p className="text-sm bg-slate-50 p-2 rounded border mb-2">{app.description}</p>
                                <div className="flex flex-wrap gap-4 text-xs items-center mt-2 mb-2">
                                    <span className="text-gray-500">Donation: <strong>KES {Number(app.donationAmount || 0).toLocaleString()}</strong></span>
                                    <span className="bg-slate-100 px-2 py-1 rounded text-gray-600">Payment: <strong className={app.paymentStatus === 'PAID' ? "text-green-600" : "text-yellow-600"}>{app.paymentStatus === 'PAID' ? 'COMPLETED' : 'PENDING'}</strong></span>
                                </div>
                                {app.documentUrl && (
                                    <a href={app.documentUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline mt-2 block">View Document</a>
                                )}
                            </div>
                            {app.status === 'PENDING' && (
                                <div className="flex flex-col gap-2 justify-center min-w-[120px]">
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateStatus(app.id, 'APPROVED')}>Approve</Button>
                                    <Button size="sm" variant="destructive" onClick={() => updateStatus(app.id, 'REJECTED')}>Reject</Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
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
        "Thank you for contacting World Youth Centre. We are looking into this right away.",
        "Your request has been verified and processed.",
        "Please check your registered email or the 'My Requests' tab for confirmation."
    ];

    // Fetch conversations list
    const fetchConversations = async () => {
        try {
            const { data, error } = await supabase
                .from('SupportConversation')
                .select('*, User(id, name, email)')
                .order('lastMessageAt', { ascending: false });

            if (error) throw error;
            setConversations(data || []);

            // If a conversation was selected, refresh it
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

    // Fetch messages for active conversation
    const fetchMessages = async (convId: string) => {
        try {
            const { data, error } = await supabase
                .from('SupportMessage')
                .select('*')
                .eq('conversationId', convId)
                .order('createdAt', { ascending: true });

            if (error) throw error;
            setMessages(data || []);

            // Acknowledge unread admin count
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

        // Subscribe to conversation updates
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

    // When selected conversation changes
    useEffect(() => {
        if (!selectedConv?.id) {
            setMessages([]);
            return;
        }

        fetchMessages(selectedConv.id);

        // Realtime subscription for incoming messages
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

                    // If message is from user/guest, mark read immediately while viewing
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

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Send admin reply
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

            // Update conversation metadata
            await supabase
                .from('SupportConversation')
                .update({
                    lastMessageAt: new Date().toISOString(),
                    unreadUserCount: (selectedConv.unreadUserCount || 0) + 1,
                    status: 'OPEN'
                })
                .eq('id', selectedConv.id);

            // Send in-app notification if registered user
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

    // Toggle status (Open <-> Resolved)
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

    // Filter conversations
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
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Headphones className="w-6 h-6 text-primary" /> Live Support Chat
                    </h2>
                    <p className="text-sm text-slate-500">
                        Communicate in real-time with users and visitors seeking assistance.
                    </p>
                </div>
                {/* Search & Filter */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <Input
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-white"
                        />
                    </div>
                    <div className="flex border rounded-lg overflow-hidden bg-white shadow-sm">
                        {(['ALL', 'OPEN', 'RESOLVED'] as const).map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setStatusFilter(filter)}
                                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                                    statusFilter === filter
                                        ? 'bg-slate-900 text-white'
                                        : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px]">
                {/* Left: Conversations List (5 Cols) */}
                <Card className="lg:col-span-5 h-full flex flex-col overflow-hidden shadow-md border-slate-200">
                    <CardHeader className="py-3.5 px-4 bg-slate-50/70 border-b border-slate-200 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-semibold text-slate-700">
                            Conversations ({filteredConversations.length})
                        </CardTitle>
                        <span className="text-xs text-slate-500 font-medium">Real-time sync active</span>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-2 space-y-1.5 divide-y divide-slate-100">
                        {filteredConversations.length === 0 ? (
                            <div className="py-16 text-center text-slate-400">
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
                                                ? 'bg-blue-50/80 border border-blue-200 shadow-sm'
                                                : 'hover:bg-slate-50 border border-transparent'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div
                                                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                                        isRegistered
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-emerald-600 text-white'
                                                    }`}
                                                >
                                                    {displayName.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <h4 className="font-semibold text-sm text-slate-900 truncate">
                                                            {displayName}
                                                        </h4>
                                                        <span
                                                            className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                                                                isRegistered
                                                                    ? 'bg-blue-100 text-blue-700'
                                                                    : 'bg-emerald-100 text-emerald-700'
                                                            }`}
                                                        >
                                                            {isRegistered ? 'User' : 'Guest'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 truncate">{displayEmail}</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                <span className="text-[10px] text-slate-400">
                                                    {conv.lastMessageAt ? format(new Date(conv.lastMessageAt), 'p') : ''}
                                                </span>
                                                {conv.unreadAdminCount > 0 && (
                                                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                                                        {conv.unreadAdminCount} new
                                                    </span>
                                                )}
                                                {isResolved && (
                                                    <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium">
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

                {/* Right: Active Chat Thread (7 Cols) */}
                <Card className="lg:col-span-7 h-full flex flex-col overflow-hidden shadow-md border-slate-200">
                    {selectedConv ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white ${
                                            selectedConv.userId ? 'bg-blue-600' : 'bg-emerald-600'
                                        }`}
                                    >
                                        {(selectedConv.User?.name || selectedConv.guestName || 'U')
                                            .charAt(0)
                                            .toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-base text-slate-900">
                                                {selectedConv.User?.name || selectedConv.guestName || 'Anonymous Visitor'}
                                            </h3>
                                            <span
                                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                                    selectedConv.status === 'RESOLVED'
                                                        ? 'bg-slate-200 text-slate-700'
                                                        : 'bg-emerald-100 text-emerald-800'
                                                }`}
                                            >
                                                {selectedConv.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500">
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

                            {/* Messages Container */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
                                {messages.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">
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
                                                    <span className="text-[11px] font-medium text-slate-500">
                                                        {isAdmin ? 'Admin (' + (msg.senderName || 'You') + ')' : msg.senderName}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                        {msg.createdAt ? format(new Date(msg.createdAt), 'p') : ''}
                                                    </span>
                                                </div>
                                                <div
                                                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                                        isAdmin
                                                            ? 'bg-blue-600 text-white rounded-tr-none shadow-sm'
                                                            : 'bg-white text-slate-900 border border-slate-200 rounded-tl-none shadow-sm'
                                                    }`}
                                                >
                                                    <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                                                </div>
                                                {isAdmin && (
                                                    <div className="flex items-center gap-1 pr-1 text-[10px] text-slate-400">
                                                        {msg.isRead ? (
                                                            <span className="flex items-center gap-0.5 text-blue-600 font-medium">
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

                            {/* Canned Responses */}
                            <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center gap-2 overflow-x-auto">
                                <span className="text-[11px] font-semibold text-slate-500 shrink-0">Quick reply:</span>
                                {cannedResponses.map((canned, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => handleSendReply(canned)}
                                        className="text-xs px-2.5 py-1 bg-white hover:bg-slate-200 border border-slate-200 rounded-lg whitespace-nowrap text-slate-700 transition-colors shadow-2xs"
                                    >
                                        {canned.length > 32 ? canned.substring(0, 32) + '...' : canned}
                                    </button>
                                ))}
                            </div>

                            {/* Reply Input Bar */}
                            <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                                <Input
                                    ref={replyInputRef}
                                    placeholder="Type your reply to user... (Press Enter to send)"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendReply();
                                        }
                                    }}
                                    disabled={isSending}
                                    className="flex-1 bg-slate-50 border-slate-200 focus:bg-white"
                                />
                                <Button
                                    onClick={() => handleSendReply()}
                                    disabled={!replyText.trim() || isSending}
                                    className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
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
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                            <Headphones className="w-12 h-12 mb-3 text-slate-300" />
                            <h4 className="font-semibold text-slate-700 text-base mb-1">
                                No Conversation Selected
                            </h4>
                            <p className="text-xs text-slate-400 max-w-sm">
                                Select a conversation from the left to read user inquiries and send live responses.
                            </p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    const { user, profile } = useAuth();
    const { toast } = useToast();
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
    const [heroImagePreview, setHeroImagePreview] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'events' | 'bookings' | 'blogs' | 'visa' | 'proposals' | 'applications' | 'users' | 'support'>('events');
    const [supportUnreadCount, setSupportUnreadCount] = useState(0);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);

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
        console.log(`[Upload] Starting upload for ${file.name} to ${folder}...`);
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        // Add a 30s timeout to prevent infinite hangs
        const uploadPromise = supabase.storage
            .from('event-media')
            .upload(filePath, file);

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Upload timed out for ${file.name}`)), 30000)
        );

        const { error: uploadError } = await Promise.race([uploadPromise, timeoutPromise]) as any;

        if (uploadError) {
            console.error(`[Upload] Error uploading ${file.name}:`, uploadError);
            throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('event-media')
            .getPublicUrl(filePath);

        console.log(`[Upload] Successfully uploaded ${file.name}. URL: ${publicUrl}`);
        return publicUrl;
    };

    const uploadImages = async (): Promise<string[]> => {
        const urls: string[] = [];
        if (selectedImages.length === 0) {
            console.log("[Upload] No gallery images selected.");
            return [];
        }

        if (selectedImages.length > 10) {
            const msg = "Maximum 10 gallery images allowed.";
            console.warn(`[Upload] ${msg}`);
            toast({ title: "Upload limit", description: msg, variant: "destructive" });
            throw new Error(msg);
        }

        console.log(`[Upload] Starting parallel upload for ${selectedImages.length} gallery images...`);
        setUploading(true);
        try {
            const uploadPromises = selectedImages.map(file => uploadSingleImage(file, "events"));
            const results = await Promise.all(uploadPromises);
            urls.push(...results);
            console.log("[Upload] Parallel batch upload completed successfully.");
        } catch (error: any) {
            console.error("[Upload] Batch upload failed:", error);
            // Even if one fails, we might still have some URLs if we used Promise.allSettled, 
            // but for consistency we fail the whole batch if any single upload fails.
            toast({ title: "Upload failed", description: error.message, variant: "destructive" });
            throw error;
        } finally {
            setUploading(false);
        }
        return urls;
    };

    const [activities, setActivities] = useState<any[]>([]);
    const [speakers, setSpeakers] = useState<any[]>([]);
    const [faqs, setFaqs] = useState<any[]>([]);
    const [features, setFeatures] = useState<string[]>([]);
    const [benefits, setBenefits] = useState<any[]>([]);
    const [alignment, setAlignment] = useState({ title: "", description: "" });
    const [journey, setJourney] = useState({ arrival: "", expectations: "" });
    const [acceptedContributions, setAcceptedContributions] = useState<string[]>(ALL_CONTRIBUTION_OPTIONS);
    const [volunteerRoles, setVolunteerRoles] = useState<string[]>(ALL_VOLUNTEER_ROLES);

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
        setBenefits(event.benefits || []);
        setAlignment(event.alignment || { title: "", description: "" });
        setJourney(event.journey || { arrival: "", expectations: "" });
        setAcceptedContributions(event.accepted_contributions && event.accepted_contributions.length > 0 ? event.accepted_contributions : ALL_CONTRIBUTION_OPTIONS);
        setVolunteerRoles(event.volunteer_roles && event.volunteer_roles.length > 0 ? event.volunteer_roles : ALL_VOLUNTEER_ROLES);
        setHeroImagePreview(event.heroImageUrl || null);
        setHeroImageFile(null);

        // Populate standard form fields
        const form = document.querySelector('form') as HTMLFormElement;
        if (form) {
            const titleInput = form.querySelector('#title') as HTMLInputElement;
            const themeInput = form.querySelector('#theme') as HTMLInputElement;
            const dateInput = form.querySelector('#date') as HTMLInputElement;
            const priceInput = form.querySelector('#price') as HTMLInputElement;
            const locationInput = form.querySelector('#location') as HTMLInputElement;
            const descriptionInput = form.querySelector('#description') as HTMLTextAreaElement;
            const selfFundedInput = form.querySelector('#self_funded_seats') as HTMLInputElement;
            const partiallyFundedInput = form.querySelector('#partially_funded_seats') as HTMLInputElement;
            const fullyFundedInput = form.querySelector('#fully_funded_seats') as HTMLInputElement;
            const targetAmountInput = form.querySelector('#target_amount') as HTMLInputElement;
            const organizerContactInput = form.querySelector('#organizer_contact') as HTMLInputElement;
            const youtubeVideoUrlInput = form.querySelector('#youtube_video_url') as HTMLInputElement;

            if (titleInput) titleInput.value = event.title;
            if (themeInput) themeInput.value = event.theme || "";
            if (dateInput) dateInput.value = event.date ? new Date(event.date).toISOString().split('T')[0] : "";
            if (priceInput) priceInput.value = event.price?.toString() || "0";
            if (locationInput) locationInput.value = event.location || "";
            if (descriptionInput) descriptionInput.value = event.description || "";
            if (selfFundedInput) selfFundedInput.value = event.self_funded_seats?.toString() || "0";
            if (partiallyFundedInput) partiallyFundedInput.value = event.partially_funded_seats?.toString() || "0";
            if (fullyFundedInput) fullyFundedInput.value = event.fully_funded_seats?.toString() || "0";
            if (targetAmountInput) targetAmountInput.value = event.target_amount?.toString() || "0";
            if (organizerContactInput) organizerContactInput.value = event.organizer_contact || "+254 798 182 108 / +254 798 332 690";
            if (youtubeVideoUrlInput) youtubeVideoUrlInput.value = event.youtube_video_url || "";

            const requiresProposalInput = form.querySelector('#requires_proposal') as HTMLInputElement;
            if (requiresProposalInput) requiresProposalInput.checked = !!event.requires_proposal;

            const typeInput = form.querySelector('#type') as HTMLSelectElement;
            if (typeInput) typeInput.value = event.type || "PHYSICAL";

            const meetingLinkInput = form.querySelector('#meeting_link') as HTMLInputElement;
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
        setBenefits([]);
        setAlignment({ title: "", description: "" });
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
        console.log("[Submit] Event submission started...");
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const title = formData.get('title') as string;
        const theme = formData.get('theme') as string;
        const description = formData.get('description') as string;
        const dateStr = formData.get('date') as string;
        const location = formData.get('location') as string;
        const priceStr = formData.get('price') as string;
        const selfFundedSeats = formData.get('self_funded_seats') as string;
        const partiallyFundedSeats = formData.get('partially_funded_seats') as string;
        const fullyFundedSeats = formData.get('fully_funded_seats') as string;
        const requiresProposal = formData.get('requires_proposal') === 'on';
        const type = formData.get('type') as string;
        const meetingLink = formData.get('meeting_link') as string;
        const targetAmountStr = formData.get('target_amount') as string;
        const organizerContact = formData.get('organizer_contact') as string;
        const youtubeVideoUrl = formData.get('youtube_video_url') as string;

        try {
            console.log("[Submit] Validating form data...");
            if (!dateStr) throw new Error("Please select a date for the event.");

            const eventDate = new Date(dateStr);
            if (isNaN(eventDate.getTime())) throw new Error("Invalid date selected.");

            console.log("[Submit] Processing image uploads...");
            setUploading(true);

            let finalHeroImageUrl = editingEvent?.heroImageUrl || "";
            if (heroImageFile) {
                console.log("[Submit] Uploading hero image...");
                try {
                    finalHeroImageUrl = await uploadSingleImage(heroImageFile, "events");
                } catch (err: any) {
                    console.error("[Submit] Hero image upload failed:", err);
                    throw new Error(`Hero image upload failed: ${err.message}`);
                }
            } else if (!editingEvent) {
                throw new Error("A hero image is required for new events.");
            }

            let imageUrls: string[] = [];
            try {
                imageUrls = await uploadImages();
                console.log(`[Submit] Image uploads completed. Count: ${imageUrls.length}`);
            } catch (err: any) {
                console.error("[Submit] Image upload phase failed:", err);
                throw new Error(`Media upload failed: ${err.message}`);
            }

            console.log("[Submit] Processing speaker image uploads...");
            // Upload speaker images
            const speakersWithImages = await Promise.all(speakers.map(async (s, idx) => {
                try {
                    if (s.imageFile) {
                        console.log(`[Submit] Uploading image for speaker ${idx + 1}: ${s.name}`);
                        const url = await uploadSingleImage(s.imageFile, "speakers");
                        const { imageFile, ...rest } = s;
                        return { ...rest, imageUrl: url };
                    }
                    const { imageFile, ...rest } = s;
                    return rest;
                } catch (err: any) {
                    console.error(`[Submit] Speaker ${idx + 1} image upload failed:`, err);
                    throw new Error(`Speaker image upload failed: ${err.message}`);
                }
            }));

            if (editingEvent) {
                console.log("[Submit] Updating event record in Supabase...");
                // Merge images for editing: keep existing if no new ones, or append/replace as logic dictates.
                // For now, we'll keep existing ones and ONLY add new ones if provided.
                const finalImageUrls = imageUrls.length > 0 ? [...(editingEvent.imageUrls || []), ...imageUrls] : (editingEvent.imageUrls || []);

                const { error } = await supabase
                    .from('Event')
                    .update({
                        title,
                        theme,
                        description,
                        date: eventDate.toISOString(),
                        location,
                        price: parseFloat(priceStr) || 0,
                        heroImageUrl: finalHeroImageUrl,
                        imageUrls: finalImageUrls,
                        activities,
                        speakers: speakersWithImages,
                        faqs,
                        features,
                        benefits,
                        alignment,
                        journey,
                        self_funded_seats: parseInt(selfFundedSeats) || 0,
                        partially_funded_seats: parseInt(partiallyFundedSeats) || 0,
                        fully_funded_seats: parseInt(fullyFundedSeats) || 0,
                        requires_proposal: requiresProposal,
                        type: type,
                        meeting_link: meetingLink,
                        target_amount: parseFloat(targetAmountStr) || 0,
                        organizer_contact: organizerContact || "+254 798 182 108 / +254 798 332 690",
                        youtube_video_url: youtubeVideoUrl || "",
                        accepted_contributions: acceptedContributions,
                        volunteer_roles: volunteerRoles,
                    })
                    .eq('id', editingEvent.id);

                if (error) {
                    console.error("[Submit] Supabase Update Error:", error);
                    throw error;
                }
                toast({ title: "Event updated successfully!" });
            } else {
                console.log("[Submit] Inserting event record into Supabase...");
                const { error } = await supabase
                    .from('Event')
                    .insert({
                        title,
                        theme,
                        description,
                        date: eventDate.toISOString(),
                        location,
                        price: parseFloat(priceStr) || 0,
                        heroImageUrl: finalHeroImageUrl,
                        imageUrls: imageUrls,
                        activities,
                        speakers: speakersWithImages,
                        faqs,
                        features,
                        benefits,
                        alignment,
                        journey,
                        self_funded_seats: parseInt(selfFundedSeats) || 0,
                        partially_funded_seats: parseInt(partiallyFundedSeats) || 0,
                        fully_funded_seats: parseInt(fullyFundedSeats) || 0,
                        requires_proposal: requiresProposal,
                        type: type,
                        meeting_link: meetingLink,
                        target_amount: parseFloat(targetAmountStr) || 0,
                        organizer_contact: organizerContact || "+254 798 182 108 / +254 798 332 690",
                        youtube_video_url: youtubeVideoUrl || "",
                        accepted_contributions: acceptedContributions.length > 0 ? acceptedContributions : ALL_CONTRIBUTION_OPTIONS,
                        volunteer_roles: volunteerRoles.length > 0 ? volunteerRoles : ALL_VOLUNTEER_ROLES,
                    });

                if (error) {
                    console.error("[Submit] Supabase Insert Error:", error);
                    throw error;
                }
                toast({ title: "Event created successfully!" });
            }

            console.log("[Submit] Success! Refreshing list...");
            await fetchEvents();

            console.log("[Submit] Resetting form state...");
            (e.target as HTMLFormElement).reset();
            setEditingEvent(null);
            setSelectedImages([]);
            setImagePreviews([]);
            setHeroImageFile(null);
            setHeroImagePreview(null);
            setActivities([]);
            setSpeakers([]);
            setFaqs([]);
            setFeatures([]);
            setBenefits([]);
            setAlignment({ title: "", description: "" });
            setJourney({ arrival: "", expectations: "" });
            setAcceptedContributions(ALL_CONTRIBUTION_OPTIONS);
            setVolunteerRoles(ALL_VOLUNTEER_ROLES);
            console.log("[Submit] Form submission completed successfully.");
        } catch (error: any) {
            console.error("[Submit] Error during event creation:", error);
            toast({
                title: "Error creating event",
                description: error.message || "An unexpected error occurred",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
            setUploading(false);
            console.log("[Submit] isSubmitting and uploading states reset.");
        }
    };

    const deleteEvent = async (id: string) => {
        if (!confirm("Are you sure you want to delete this event?")) return;

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
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
                <div className="flex space-x-2">
                    <Button
                        variant={activeTab === 'events' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('events')}
                    >
                        Events
                    </Button>
                    <Button
                        variant={activeTab === 'bookings' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('bookings')}
                    >
                        Bookings
                    </Button>
                    <Button
                        variant={activeTab === 'blogs' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('blogs')}
                    >
                        Blogs
                    </Button>
                    <Button
                        variant={activeTab === 'visa' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('visa')}
                    >
                        Visa Requests
                    </Button>
                    <Button
                        variant={activeTab === 'proposals' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('proposals')}
                    >
                        Proposals
                    </Button>
                    <Button
                        variant={activeTab === 'applications' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('applications')}
                    >
                        Applications
                    </Button>
                    <Button
                        variant={activeTab === 'users' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('users')}
                    >
                        Users
                    </Button>
                    <Button
                        variant={activeTab === 'support' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('support')}
                        className="relative flex items-center gap-1.5"
                    >
                        <Headphones className="w-4 h-4" />
                        <span>Live Support</span>
                        {supportUnreadCount > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                                {supportUnreadCount}
                            </span>
                        )}
                    </Button>
                </div>
            </div>

            {activeTab === 'support' && <SupportChatManager />}
            {activeTab === 'proposals' && <ProposalManager />}
            {activeTab === 'applications' && <ApplicationManager />}
            {activeTab === 'users' && <UserManager />}
            {activeTab === 'bookings' && <BookingManager />}


            {activeTab === 'events' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Event Form */}
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle>{editingEvent ? "Edit Event" : "Create New Event"}</CardTitle>
                            <CardDescription>
                                {editingEvent ? `Modifying: ${editingEvent.title}` : "Add a past or upcoming event to the gallery."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={onSubmitEvent} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Event Title</Label>
                                    <Input id="title" name="title" required placeholder="Global Youth Summit" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="theme">Event Theme</Label>
                                    <Input id="theme" name="theme" placeholder="Climate Action & Sustainability" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="date">Date</Label>
                                        <Input id="date" name="date" type="date" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="price">Price / Suggested Contribution (KES)</Label>
                                        <Input id="price" name="price" type="number" step="1" placeholder="0" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="type">Event Type</Label>
                                        <select
                                            id="type"
                                            name="type"
                                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            defaultValue="PHYSICAL"
                                        >
                                            <option value="PHYSICAL">Physical Only</option>
                                            <option value="VIRTUAL">Virtual Only</option>
                                            <option value="BOTH">Both Physical & Virtual</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="meeting_link">Meeting/Virtual Link</Label>
                                        <Input id="meeting_link" name="meeting_link" placeholder="Zoom/Google Meet link" />
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2 py-2">
                                    <input
                                        type="checkbox"
                                        id="requires_proposal"
                                        name="requires_proposal"
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                                    />
                                    <Label htmlFor="requires_proposal" className="cursor-pointer">Requires Proposal Submission</Label>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="self_funded_seats">Self Funded Seats</Label>
                                        <Input id="self_funded_seats" name="self_funded_seats" type="number" defaultValue="0" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="partially_funded_seats">Partially Funded Seats</Label>
                                        <Input id="partially_funded_seats" name="partially_funded_seats" type="number" defaultValue="0" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="fully_funded_seats">Fully Funded Seats</Label>
                                        <Input id="fully_funded_seats" name="fully_funded_seats" type="number" defaultValue="0" />
                                    </div>
                                </div>

                                <div className="space-y-4 border-t pt-4">
                                    <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Admission Benefits</h3>
                                    <Button type="button" variant="outline" size="sm" onClick={() => setBenefits([...benefits, { category: 'SELF_FUNDED', description: "" }])}>
                                        Add Benefit
                                    </Button>
                                    {benefits.map((b, idx) => (
                                        <Card key={idx} className="p-4 space-y-3 bg-muted/20 border-primary/10">
                                            <div className="flex justify-between items-center gap-2">
                                                <div className="space-y-1 flex-1">
                                                    <label className="text-xs font-semibold text-muted-foreground">Category</label>
                                                    <select
                                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                        value={b.category}
                                                        onChange={e => {
                                                            const newB = [...benefits];
                                                            newB[idx].category = e.target.value;
                                                            setBenefits(newB);
                                                        }}
                                                    >
                                                        <option value="SELF_FUNDED">Self Funded</option>
                                                        <option value="PARTIALLY_FUNDED">Partially Funded</option>
                                                        <option value="FULLY_FUNDED">Fully Funded</option>
                                                    </select>
                                                </div>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setBenefits(benefits.filter((_, i) => i !== idx))} className="text-destructive hover:bg-destructive/10 mt-6">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-muted-foreground">Description</label>
                                                <Input
                                                    placeholder="e.g. Flight + Accommodation included"
                                                    value={b.description}
                                                    className="bg-background"
                                                    onChange={e => {
                                                        const newB = [...benefits];
                                                        newB[idx].description = e.target.value;
                                                        setBenefits(newB);
                                                    }}
                                                />
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="location">Location</Label>
                                    <Input id="location" name="location" placeholder="Nairobi, Kenya" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-primary font-semibold">Overview/About</Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        required
                                        placeholder="Brief summary of the event..."
                                    />
                                </div>

                                {/* Charity Outreach & Contributions Configuration */}
                                <div className="space-y-4 border-t pt-4 bg-slate-50/60 p-4 rounded-lg border border-slate-200">
                                    <div className="flex items-center gap-2">
                                        <Heart className="w-5 h-5 text-accent fill-accent/20" />
                                        <h3 className="font-bold text-sm uppercase tracking-wider text-primary">Charity Outreach & Contributions Configuration</h3>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="target_amount" className="font-semibold text-slate-700">Target Fundraising Goal (KES)</Label>
                                            <Input id="target_amount" name="target_amount" type="number" step="1" placeholder="e.g. 50000" />
                                            <p className="text-[11px] text-muted-foreground">Target financial or resources budget for this outreach mission</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="organizer_contact" className="font-semibold text-slate-700">Organizer Support Contact</Label>
                                            <Input id="organizer_contact" name="organizer_contact" placeholder="+254 798 182 108 / +254 798 332 690" />
                                            <p className="text-[11px] text-muted-foreground">Nairobi HQ and field team helpline for donors and attendees</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="youtube_video_url" className="font-semibold text-slate-700">Outreach / Documentary YouTube Video URL</Label>
                                        <Input id="youtube_video_url" name="youtube_video_url" placeholder="https://www.youtube.com/watch?v=..." />
                                        <p className="text-[11px] text-muted-foreground">Embeds an inspirational mission documentary or charity video on the event detail page</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="font-semibold text-slate-700">Accepted In-Kind & Financial Contribution Options</Label>
                                        <p className="text-[11px] text-muted-foreground mb-2">Check the contributions welcome for this visit/outreach:</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-3 rounded-lg border">
                                            {ALL_CONTRIBUTION_OPTIONS.map((item) => (
                                                <label key={item} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-primary">
                                                    <input
                                                        type="checkbox"
                                                        checked={acceptedContributions.includes(item)}
                                                        onChange={() => toggleContribution(item)}
                                                        className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                                                    />
                                                    <span>{item}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="font-semibold text-slate-700">Event-Day Volunteer Activities Offered</Label>
                                        <p className="text-[11px] text-muted-foreground mb-2">Activities available for attending volunteers:</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-3 rounded-lg border">
                                            {ALL_VOLUNTEER_ROLES.map((role) => (
                                                <label key={role} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-primary">
                                                    <input
                                                        type="checkbox"
                                                        checked={volunteerRoles.includes(role)}
                                                        onChange={() => toggleVolunteerRole(role)}
                                                        className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                                                    />
                                                    <span>{role}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Rich Sections */}
                                <div className="space-y-4 border-t pt-4">
                                    <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Itinerary (Multi-day)</h3>
                                    <Button type="button" variant="outline" size="sm" onClick={() => setActivities([...activities, { day: activities.length + 1, date: "", items: [] }])}>
                                        Add Day
                                    </Button>
                                    {activities.map((day, dIdx) => (
                                        <Card key={dIdx} className="p-4 space-y-3 bg-muted/30 border-primary/20">
                                            <div className="flex justify-between items-center bg-primary/5 p-2 rounded-t-md -mx-4 -mt-4 mb-2">
                                                <Label className="text-primary font-bold">Day {day.day}</Label>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setActivities(activities.filter((_, i) => i !== dIdx))} className="text-destructive hover:bg-destructive/10">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <Input placeholder="Date (e.g. April 2)" value={day.date} className="bg-background" onChange={e => {
                                                const newA = [...activities];
                                                newA[dIdx].date = e.target.value;
                                                setActivities(newA);
                                            }} />
                                            <Button type="button" variant="secondary" size="sm" className="w-full" onClick={() => {
                                                const newA = [...activities];
                                                newA[dIdx].items.push({ title: "", description: "" });
                                                setActivities(newA);
                                            }}>+ Add Activity</Button>
                                            <div className="space-y-3">
                                                {day.items.map((item: any, iIdx: number) => (
                                                    <div key={iIdx} className="pl-4 border-l-2 border-primary/30 space-y-2 mt-2 py-1">
                                                        <Input placeholder="Activity Title" value={item.title} className="bg-background" onChange={e => {
                                                            const newA = [...activities];
                                                            newA[dIdx].items[iIdx].title = e.target.value;
                                                            setActivities(newA);
                                                        }} />
                                                        <Textarea placeholder="Description" className="min-h-[80px] bg-background" value={item.description} onChange={e => {
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

                                <div className="space-y-4 border-t pt-4">
                                    <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Speakers</h3>
                                    <Button type="button" variant="outline" size="sm" onClick={() => setSpeakers([...speakers, { name: "", role: "", bio: "", imageUrl: "", imageFile: null }])}>
                                        Add Speaker
                                    </Button>
                                    {speakers.map((s, idx) => (
                                        <Card key={idx} className="p-4 space-y-3 bg-muted/20 border-primary/10">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center space-x-3">
                                                    <div className="relative h-12 w-12 ring-2 ring-primary/20 rounded-full">
                                                        {s.imageFile ? (
                                                            <img src={URL.createObjectURL(s.imageFile)} className="h-full w-full object-cover rounded-full" />
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
                                                        <label htmlFor={`speaker-img-${idx}`} className="absolute -bottom-1 -right-1 bg-primary text-white p-1 rounded-full cursor-pointer shadow-sm hover:bg-primary/90 transition-colors">
                                                            <Plus className="h-3 w-3" />
                                                        </label>
                                                    </div>
                                                    <Input placeholder="Speaker Name" value={s.name} className="flex-1 bg-background" onChange={e => {
                                                        const newS = [...speakers];
                                                        newS[idx].name = e.target.value;
                                                        setSpeakers(newS);
                                                    }} />
                                                </div>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setSpeakers(speakers.filter((_, i) => i !== idx))} className="text-destructive hover:bg-destructive/10">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <Input placeholder="Professional Role" value={s.role} className="bg-background" onChange={e => {
                                                const newS = [...speakers];
                                                newS[idx].role = e.target.value;
                                                setSpeakers(newS);
                                            }} />
                                            <Textarea placeholder="Short Bio" className="min-h-[80px] bg-background" value={s.bio} onChange={e => {
                                                const newS = [...speakers];
                                                newS[idx].bio = e.target.value;
                                                setSpeakers(newS);
                                            }} />
                                        </Card>
                                    ))}
                                </div>

                                <div className="space-y-4 border-t pt-4">
                                    <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">FAQs</h3>
                                    <Button type="button" variant="outline" size="sm" onClick={() => setFaqs([...faqs, { question: "", answer: "" }])}>
                                        Add FAQ
                                    </Button>
                                    {faqs.map((f, idx) => (
                                        <Card key={idx} className="p-4 space-y-3 bg-muted/20 border-primary/10">
                                            <div className="flex justify-between items-start gap-2">
                                                <Input placeholder="Question" className="bg-background flex-1" value={f.question} onChange={e => {
                                                    const newF = [...faqs];
                                                    newF[idx].question = e.target.value;
                                                    setFaqs(newF);
                                                }} />
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setFaqs(faqs.filter((_, i) => i !== idx))} className="text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                            <Textarea placeholder="Detailed Answer" className="min-h-[80px] bg-background" value={f.answer} onChange={e => {
                                                const newF = [...faqs];
                                                newF[idx].answer = e.target.value;
                                                setFaqs(newF);
                                            }} />
                                        </Card>
                                    ))}
                                </div>
                                <div className="space-y-4 border-t pt-4">
                                    <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Alignment & Goals</h3>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-primary font-semibold">Affiliation/Vision Title</Label>
                                            <Input placeholder="Aligned with Europe’s Youth Vision" value={alignment.title} className="bg-background" onChange={e => setAlignment({ ...alignment, title: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-primary font-semibold">Affiliation Description</Label>
                                            <Textarea placeholder="Explain how the event aligns with the vision..." className="bg-background min-h-[100px]" value={alignment.description} onChange={e => setAlignment({ ...alignment, description: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-2 pt-2">
                                        <Label className="text-primary font-semibold">Key Features/Goals (one per line)</Label>
                                        <Textarea
                                            placeholder="High-Impact Keynotes&#10;Interactive Workshops"
                                            className="min-h-[120px] bg-background"
                                            value={features.join('\n')}
                                            onChange={e => setFeatures(e.target.value.split('\n'))}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 border-t pt-4">
                                    <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">User Journey</h3>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-primary font-semibold">Arrival & Location Guide</Label>
                                            <Textarea placeholder="How to arrive, shuttle services..." className="bg-background min-h-[100px]" value={journey.arrival} onChange={e => setJourney({ ...journey, arrival: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-primary font-semibold">What to Expect</Label>
                                            <Textarea placeholder="Event guides, schedules..." className="bg-background min-h-[100px]" value={journey.expectations} onChange={e => setJourney({ ...journey, expectations: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 border-t pt-4">
                                    <Label className="text-primary font-semibold">Hero Image (Required)</Label>
                                    <div className="flex flex-col space-y-2">
                                        {heroImagePreview ? (
                                            <div className="relative group w-full max-w-sm aspect-video">
                                                <img src={heroImagePreview} className="w-full h-full object-cover rounded-md border" />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setHeroImagePreview(null);
                                                        setHeroImageFile(null);
                                                    }}
                                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
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
                                                    className="flex items-center justify-center w-full max-w-sm aspect-video border-2 border-dashed border-primary/50 rounded-lg cursor-pointer hover:bg-primary/5 transition-colors"
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

                                <div className="space-y-2 border-t pt-4">
                                    <Label>Event Media (Gallery)</Label>
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
                                            className="flex items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                                        >
                                            <div className="flex flex-col items-center">
                                                <Upload className="h-6 w-6 text-gray-400" />
                                                <span className="text-sm text-gray-500">Click to upload images</span>
                                            </div>
                                        </Label>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                        {imagePreviews.map((src, i) => (
                                            <div key={i} className="relative group aspect-square">
                                                <img src={src} className="w-full h-full object-cover rounded-md" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(i)}
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button type="submit" className="flex-1" disabled={isSubmitting || uploading}>
                                        {(isSubmitting || uploading) ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                        {editingEvent ? "Update Event" : "Create Event"}
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

                    {/* Events List */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-xl font-bold text-primary mb-4">Existing Events</h2>
                        {events.length === 0 ? (
                            <p className="text-gray-500 italic">No events found.</p>
                        ) : (
                            events.map(event => (
                                <Card key={event.id}>
                                    <CardContent className="p-4 flex items-start space-x-4">
                                        {event.heroImageUrl || event.imageUrls?.[0] ? (
                                            <img src={event.heroImageUrl || event.imageUrls?.[0]} className="w-24 h-24 object-cover rounded-md flex-shrink-0" />
                                        ) : (
                                            <div className="w-24 h-24 bg-slate-100 flex items-center justify-center rounded-md flex-shrink-0">
                                                <ImageIcon className="h-8 w-8 text-gray-300" />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg">{event.title}</h3>
                                            <p className="text-sm text-gray-500 mb-1">
                                                {format(new Date(event.date), 'PPP p')} • {event.location} • {Number(event.price) > 0 ? `KES ${event.price}` : 'Free / Voluntary'}
                                            </p>
                                            {event.target_amount ? (
                                                <p className="text-xs font-semibold text-emerald-700 mb-1">
                                                    Target Goal: KES {event.target_amount.toLocaleString()} • Contact: {event.organizer_contact || "+254 798 182 108 / +254 798 332 690"}
                                                </p>
                                            ) : null}
                                            <p className="text-gray-600 line-clamp-2 text-sm">{event.description}</p>
                                            {event.accepted_contributions && event.accepted_contributions.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {event.accepted_contributions.slice(0, 4).map((c: string, idx: number) => (
                                                        <span key={idx} className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                                            {c}
                                                        </span>
                                                    ))}
                                                    {event.accepted_contributions.length > 4 && (
                                                        <span className="text-[10px] text-slate-400">+{event.accepted_contributions.length - 4} more</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => handleEditClick(event)}
                                                className="text-primary hover:text-primary/70 p-2"
                                            >
                                                <Edit2 className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => deleteEvent(event.id)}
                                                className="text-red-500 hover:text-red-700 p-2"
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

            {activeTab === 'visa' && (
                <div className="max-w-5xl mx-auto">
                    <VisaInvitationManager />
                </div>
            )}
        </div>
    );
}

