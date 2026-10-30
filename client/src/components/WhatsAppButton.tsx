import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import LiveChatWidget from "@/components/chat/LiveChatWidget";
import { Headphones, MessageCircle, X, ChevronRight, ExternalLink } from "lucide-react";

export default function WhatsAppButton() {
    const { user } = useAuth();
    const rawNumber = import.meta.env.VITE_WHATSAPP_NUMBER || "+17209948847";
    const cleanNumber = rawNumber.replace(/[^\d]/g, "");

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const menuRef = useRef<HTMLDivElement>(null);

    // Formulated WhatsApp Link
    const message = encodeURIComponent(
        "Hello! I am contacting you from the World Youth Centre platform and would like more information."
    );
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${message}`;

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isMenuOpen]);

    // Check for unread support messages
    useEffect(() => {
        const checkUnread = async () => {
            try {
                if (user) {
                    const { data } = await supabase
                        .from("SupportConversation")
                        .select("unreadUserCount")
                        .eq("userId", user.id)
                        .order("createdAt", { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (data?.unreadUserCount) {
                        setUnreadCount(data.unreadUserCount);
                    }
                } else {
                    const sessionId = localStorage.getItem("wyc_guest_chat_session");
                    if (sessionId) {
                        const { data } = await supabase
                            .from("SupportConversation")
                            .select("unreadUserCount")
                            .eq("guestSessionId", sessionId)
                            .order("createdAt", { ascending: false })
                            .limit(1)
                            .maybeSingle();

                        if (data?.unreadUserCount) {
                            setUnreadCount(data.unreadUserCount);
                        }
                    }
                }
            } catch (err) {
                console.error("[SupportHub] Error checking unread count:", err);
            }
        };

        checkUnread();

        // Subscribe to conversation updates for unread count
        const channel = supabase
            .channel("support-conversations-unread")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "SupportConversation"
                },
                () => {
                    checkUnread();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const handleToggleLauncher = () => {
        if (isChatOpen) {
            setIsChatOpen(false);
        } else {
            setIsMenuOpen(!isMenuOpen);
        }
    };

    const handleOpenLiveChat = () => {
        setIsMenuOpen(false);
        setIsChatOpen(true);
        setUnreadCount(0);
    };

    return (
        <>
            {/* Live Chat Widget Modal */}
            <LiveChatWidget
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                onUnreadChange={setUnreadCount}
            />

            {/* Support Launcher & Dropdown Menu */}
            <div ref={menuRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end select-none">
                {/* Popover Dropdown Menu */}
                {isMenuOpen && !isChatOpen && (
                    <div className="mb-3 w-72 sm:w-80 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-bottom-3 duration-200">
                        {/* Dropdown Header */}
                        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white p-4">
                            <h4 className="font-bold text-sm tracking-wide flex items-center gap-2">
                                <Headphones className="w-4 h-4 text-blue-400" /> Need Help?
                            </h4>
                            <p className="text-xs text-slate-300 mt-0.5">
                                Connect with our team via your preferred channel:
                            </p>
                        </div>

                        {/* Options List */}
                        <div className="p-2.5 space-y-2">
                            {/* Option 1: Live Support Chat */}
                            <button
                                onClick={handleOpenLiveChat}
                                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-all text-left group border border-transparent hover:border-slate-200/60"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
                                        <MessageCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm text-slate-800 group-hover:text-blue-600 transition-colors">
                                                Live Support Chat
                                            </span>
                                            {unreadCount > 0 && (
                                                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                                                    {unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-slate-500">Chat directly with an admin</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                            </button>

                            {/* Option 2: WhatsApp Direct */}
                            {cleanNumber && (
                                <a
                                    href={whatsappUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-emerald-50/50 active:bg-emerald-100/50 transition-all text-left group border border-transparent hover:border-emerald-200/60"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-[#25D366] group-hover:text-white transition-colors shadow-sm">
                                            {/* WhatsApp SVG Icon */}
                                            <svg
                                                className="w-5 h-5 fill-current"
                                                viewBox="0 0 24 24"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path d="M12.004 2C6.48 2 2.004 6.476 2.004 12c0 1.99.582 3.844 1.589 5.408L2.08 22l4.757-1.488A9.948 9.948 0 0012.004 22c5.524 0 10-4.476 10-10s-4.476-10-10-10zm5.83 14.283c-.244.685-1.22 1.258-1.706 1.306-.454.045-1.037.064-3.32-.88-2.73-1.127-4.48-3.908-4.618-4.092-.134-.184-1.1-1.465-1.1-2.793 0-1.328.694-1.982.94-2.247.247-.265.54-.33.72-.33.18 0 .36.002.518.01.168.008.394-.064.616.47.244.588.828 2.02.9 2.168.073.147.122.32.025.515-.098.196-.147.318-.293.493-.146.176-.308.393-.44.527-.147.147-.3.308-.13.6.17.293.754 1.242 1.62 2.012 1.115.992 2.056 1.3 2.348 1.447.293.147.464.122.636-.073.17-.196.733-.855.93-1.149.196-.293.39-.245.66-.147.27.098 1.71.807 2.004.954.293.147.49.22.563.342.073.123.073.71-.17 1.395z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-sm text-slate-800 group-hover:text-emerald-600 transition-colors">
                                                WhatsApp Chat
                                            </span>
                                            <p className="text-[11px] text-slate-500">Quick message on WhatsApp</p>
                                        </div>
                                    </div>
                                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* Floating Action Launcher Button */}
                <button
                    onClick={handleToggleLauncher}
                    aria-label="Contact and Support Options"
                    className={`relative group flex items-center justify-center w-14 h-14 rounded-full shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 ${
                        isMenuOpen || isChatOpen
                            ? "bg-slate-900 text-white shadow-slate-900/30 focus:ring-slate-700/40"
                            : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30 focus:ring-blue-400/40"
                    }`}
                >
                    {/* Ping/Pulse Ring Animation when closed */}
                    {!isMenuOpen && !isChatOpen && (
                        <span className="absolute -inset-1 rounded-full bg-blue-500 opacity-25 animate-ping duration-1000 group-hover:opacity-0" />
                    )}

                    {/* Unread badge count */}
                    {unreadCount > 0 && !isChatOpen && (
                        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-md animate-bounce">
                            {unreadCount}
                        </span>
                    )}

                    {/* Icon toggles between open state (X) and default (Headphones / Message) */}
                    {isMenuOpen || isChatOpen ? (
                        <X className="w-6 h-6 transition-transform duration-200 rotate-0" />
                    ) : (
                        <Headphones className="w-6 h-6 transition-transform duration-200" />
                    )}
                </button>
            </div>
        </>
    );
}
