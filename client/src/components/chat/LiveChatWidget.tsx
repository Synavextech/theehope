import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { SupportConversation, SupportMessage } from "@shared/schema";
import { Send, X, MessageSquare, Headphones, Loader2, Check, CheckCheck } from "lucide-react";
import { format } from "date-fns";

interface LiveChatWidgetProps {
    isOpen: boolean;
    onClose: () => void;
    onUnreadChange?: (unreadCount: number) => void;
}

export default function LiveChatWidget({ isOpen, onClose, onUnreadChange }: LiveChatWidgetProps) {
    const { user, profile } = useAuth();
    const [conversation, setConversation] = useState<SupportConversation | null>(null);
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);

    // Guest details state
    const [guestName, setGuestName] = useState("");
    const [guestEmail, setGuestEmail] = useState("");
    const [isGuestRegistered, setIsGuestRegistered] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Get or create persistent guest session ID
    const getGuestSessionId = (): string => {
        let sessionId = localStorage.getItem("wyc_guest_chat_session");
        if (!sessionId) {
            sessionId = "guest_" + Math.random().toString(36).substring(2, 12) + "_" + Date.now();
            localStorage.setItem("wyc_guest_chat_session", sessionId);
        }
        return sessionId;
    };

    // Load stored guest profile
    useEffect(() => {
        if (!user) {
            const savedName = localStorage.getItem("wyc_guest_name") || "";
            const savedEmail = localStorage.getItem("wyc_guest_email") || "";
            if (savedName) {
                setGuestName(savedName);
                setGuestEmail(savedEmail);
                setIsGuestRegistered(true);
            }
        }
    }, [user]);

    // Initialize or fetch conversation
    useEffect(() => {
        if (!isOpen) return;

        const initConversation = async () => {
            setIsLoading(true);
            try {
                let currentConv: SupportConversation | null = null;

                if (user) {
                    // Fetch active conversation for logged in user
                    const { data, error } = await supabase
                        .from("SupportConversation")
                        .select("*")
                        .eq("userId", user.id)
                        .order("createdAt", { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (!error && data) {
                        currentConv = data as SupportConversation;
                    }
                } else if (isGuestRegistered) {
                    // Fetch active conversation for guest session
                    const sessionId = getGuestSessionId();
                    const { data, error } = await supabase
                        .from("SupportConversation")
                        .select("*")
                        .eq("guestSessionId", sessionId)
                        .order("createdAt", { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (!error && data) {
                        currentConv = data as SupportConversation;
                    }
                }

                if (currentConv) {
                    setConversation(currentConv);
                    await fetchMessages(currentConv.id);
                    // Mark user unread as 0
                    if (currentConv.unreadUserCount > 0) {
                        await supabase
                            .from("SupportConversation")
                            .update({ unreadUserCount: 0 })
                            .eq("id", currentConv.id);
                        if (onUnreadChange) onUnreadChange(0);
                    }
                }
            } catch (err) {
                console.error("[LiveChat] Error initializing conversation:", err);
            } finally {
                setIsLoading(false);
            }
        };

        initConversation();
    }, [isOpen, user, isGuestRegistered]);

    // Fetch messages for active conversation
    const fetchMessages = async (convId: string) => {
        try {
            const { data, error } = await supabase
                .from("SupportMessage")
                .select("*")
                .eq("conversationId", convId)
                .order("createdAt", { ascending: true });

            if (!error && data) {
                setMessages(data as SupportMessage[]);
                // Mark messages as read
                await supabase
                    .from("SupportMessage")
                    .update({ isRead: true })
                    .eq("conversationId", convId)
                    .eq("senderRole", "ADMIN");
            }
        } catch (err) {
            console.error("[LiveChat] Error fetching messages:", err);
        }
    };

    // Realtime subscription for incoming messages
    useEffect(() => {
        if (!conversation?.id || !isOpen) return;

        const channel = supabase
            .channel(`live-chat-${conversation.id}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "SupportMessage",
                    filter: `conversationId=eq.${conversation.id}`
                },
                (payload) => {
                    const newMsg = payload.new as SupportMessage;
                    setMessages((prev) => {
                        if (prev.some((m) => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg];
                    });

                    // If message is from admin, acknowledge as read immediately while chat is open
                    if (newMsg.senderRole === "ADMIN") {
                        supabase
                            .from("SupportMessage")
                            .update({ isRead: true })
                            .eq("id", newMsg.id);
                        supabase
                            .from("SupportConversation")
                            .update({ unreadUserCount: 0 })
                            .eq("id", conversation.id);
                        if (onUnreadChange) onUnreadChange(0);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversation?.id, isOpen]);

    // Auto-scroll on new message
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    // Focus input on open
    useEffect(() => {
        if (isOpen && (user || isGuestRegistered)) {
            setTimeout(() => inputRef.current?.focus(), 200);
        }
    }, [isOpen, user, isGuestRegistered]);

    // Guest registration submit
    const handleGuestSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!guestName.trim()) return;
        localStorage.setItem("wyc_guest_name", guestName.trim());
        if (guestEmail.trim()) {
            localStorage.setItem("wyc_guest_email", guestEmail.trim());
        }
        setIsGuestRegistered(true);
    };

    // Send a message
    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const text = inputMessage.trim();
        if (!text || isSending) return;

        setIsSending(true);
        setInputMessage("");

        try {
            let activeConvId = conversation?.id;

            // If no active conversation exists yet, create one
            if (!activeConvId) {
                const guestSessionId = !user ? getGuestSessionId() : null;
                const senderName = user ? (profile?.name || user.email?.split("@")[0] || "User") : guestName;

                const { data: newConv, error: convError } = await supabase
                    .from("SupportConversation")
                    .insert({
                        userId: user ? user.id : null,
                        guestName: !user ? guestName : null,
                        guestEmail: !user ? guestEmail : null,
                        guestSessionId: guestSessionId,
                        status: "OPEN",
                        unreadAdminCount: 1,
                        unreadUserCount: 0,
                        lastMessageAt: new Date().toISOString()
                    })
                    .select()
                    .single();

                if (convError || !newConv) {
                    console.error("[LiveChat] Error creating conversation:", convError);
                    setIsSending(false);
                    return;
                }

                setConversation(newConv as SupportConversation);
                activeConvId = newConv.id;
            }

            if (!activeConvId) {
                setIsSending(false);
                return;
            }

            const currentConvId: string = activeConvId;
            const senderName = user ? (profile?.name || user.email?.split("@")[0] || "User") : (guestName || "Guest");
            const senderRole: "USER" | "GUEST" = user ? "USER" : "GUEST";

            // Optimistic message
            const tempId = "temp_" + Date.now();
            const optimisticMsg: SupportMessage = {
                id: tempId,
                conversationId: currentConvId,
                senderId: user ? user.id : null,
                senderRole: senderRole,
                senderName: senderName,
                message: text,
                isRead: false,
                createdAt: new Date().toISOString()
            };
            setMessages((prev) => [...prev, optimisticMsg]);

            // Insert into Supabase
            const { data: insertedMsg, error: msgError } = await supabase
                .from("SupportMessage")
                .insert({
                    conversationId: currentConvId,
                    senderId: user ? user.id : null,
                    senderRole: senderRole,
                    senderName: senderName,
                    message: text,
                    isRead: false
                })
                .select()
                .single();

            if (msgError) {
                console.error("[LiveChat] Error sending message:", msgError);
                // Remove optimistic message if error
                setMessages((prev) => prev.filter((m) => m.id !== tempId));
            } else if (insertedMsg) {
                // Replace optimistic message with actual
                setMessages((prev) => prev.map((m) => (m.id === tempId ? (insertedMsg as SupportMessage) : m)));

                // Update conversation metadata
                await supabase
                    .from("SupportConversation")
                    .update({
                        lastMessageAt: new Date().toISOString(),
                        unreadAdminCount: (conversation?.unreadAdminCount || 0) + 1,
                        status: "OPEN"
                    })
                    .eq("id", currentConvId);
            }
        } catch (err) {
            console.error("[LiveChat] Send error:", err);
        } finally {
            setIsSending(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-24 right-6 z-50 w-[92vw] sm:w-[400px] h-[550px] max-h-[80vh] bg-card text-card-foreground rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
            {/* Header */}
            <div className="bg-slate-900 text-white px-4 py-3.5 flex items-center justify-between border-b border-slate-800 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                            <Headphones className="w-5 h-5" />
                        </div>
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full ring-1 ring-emerald-500"></span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm tracking-wide">Live Support</h3>
                            <span className="text-[10px] font-medium bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                Online
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-400">Typically replies within minutes</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors focus:outline-none"
                    aria-label="Close Chat"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
                {!user && !isGuestRegistered ? (
                    /* Guest Intake Form */
                    <div className="h-full flex flex-col justify-center items-center text-center p-4">
                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-3 shadow-inner">
                            <MessageSquare className="w-7 h-7" />
                        </div>
                        <h4 className="font-bold text-foreground text-base mb-1">Welcome to Live Support</h4>
                        <p className="text-xs text-muted-foreground max-w-xs mb-5">
                            Please introduce yourself so our support team can assist you effectively.
                        </p>
                        <form onSubmit={handleGuestSubmit} className="w-full space-y-3 text-left">
                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1">
                                    Your Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter your name"
                                    value={guestName}
                                    onChange={(e) => setGuestName(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1">
                                    Email Address <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                                </label>
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={guestEmail}
                                    onChange={(e) => setGuestEmail(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-2.5 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm rounded-xl shadow-md transition-all duration-200 mt-2"
                            >
                                Start Live Chat
                            </button>
                        </form>
                    </div>
                ) : isLoading ? (
                    <div className="h-full flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    </div>
                ) : messages.length === 0 ? (
                    /* Empty Chat Greeting */
                    <div className="h-full flex flex-col justify-center items-center text-center p-6 text-slate-500">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-2">
                            <Headphones className="w-6 h-6" />
                        </div>
                        <p className="font-medium text-slate-700 text-sm mb-1">How can we help you today?</p>
                        <p className="text-xs text-slate-400 max-w-xs">
                            Ask us questions regarding event registrations, visa invitation letters, or forum participation.
                        </p>
                    </div>
                ) : (
                    /* Messages List */
                    messages.map((msg) => {
                        const isMe = msg.senderRole === "USER" || msg.senderRole === "GUEST";
                        return (
                            <div
                                key={msg.id}
                                className={`flex flex-col ${isMe ? "items-end" : "items-start"} space-y-1`}
                            >
                                <div className="flex items-center gap-1.5 px-1">
                                    <span className="text-[11px] font-medium text-slate-400">
                                        {isMe ? "You" : msg.senderName || "Support Team"}
                                    </span>
                                    <span className="text-[10px] text-slate-300">
                                        {msg.createdAt ? format(new Date(msg.createdAt), "p") : ""}
                                    </span>
                                </div>
                                <div
                                    className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                        isMe
                                            ? "bg-primary text-primary-foreground rounded-tr-none shadow-sm"
                                            : "bg-muted text-foreground border border-border rounded-tl-none shadow-sm"
                                    }`}
                                >
                                    <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                                </div>
                                {isMe && (
                                    <div className="flex items-center gap-1 pr-1 text-[10px] text-muted-foreground">
                                        {msg.isRead ? (
                                            <span className="flex items-center gap-0.5 text-primary font-medium">
                                                <CheckCheck className="w-3 h-3" /> Read
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

            {/* Chat Input Bar */}
            {(user || isGuestRegistered) && (
                <form
                    onSubmit={handleSendMessage}
                    className="p-3 bg-card border-t border-border flex items-center gap-2"
                >
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Type a message..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        disabled={isSending}
                        className="flex-1 px-3.5 py-2 text-sm bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background text-foreground transition-all disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={!inputMessage.trim() || isSending}
                        className="w-10 h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center transition-all disabled:opacity-40 shadow-sm"
                    >
                        {isSending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </button>
                </form>
            )}
        </div>
    );
}
