import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X, LogOut, LayoutDashboard, Home, Sun, Moon, Monitor, Heart, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/lib/supabase";
import NotificationBell from "./NotificationBell";

export default function NavBar() {
    const { user, profile, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const [location] = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
    const [pastEvents, setPastEvents] = useState<any[]>([]);
    const [isUpcomingOpen, setIsUpcomingOpen] = useState(false);
    const [isPastOpen, setIsPastOpen] = useState(false);

    useEffect(() => {
        const fetchEvents = async () => {
            const now = new Date().toISOString();

            const { data: upcoming } = await supabase
                .from('Event')
                .select('id, title')
                .gte('date', now)
                .order('date', { ascending: true });
            if (upcoming) setUpcomingEvents(upcoming);

            const { data: past } = await supabase
                .from('Event')
                .select('id, title')
                .lt('date', now)
                .order('date', { ascending: false });
            if (past) setPastEvents(past);
        };
        fetchEvents();
    }, []);

    const navLinks = [
        { href: "/", label: "Home" },
        { href: "/about", label: "About Us" },
        { href: "/upcoming-events", label: "Outreach & Events", dropdown: "upcoming" },
        { href: "/past-events", label: "Past Events", dropdown: "past" },
        { href: "/blog", label: "Stories & Reviews" },
        { href: "/my-requests", label: "Bookings & Pledges" },
    ];

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-border bg-card/90 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="w-10 h-10 bg-[#04047a] rounded-xl flex items-center justify-center text-white group-hover:rotate-6 transition-transform duration-300 shadow-md border-2 border-[#b8240d]">
                        <Heart className="w-5 h-5 text-[#CCB88B] fill-[#CCB88B]" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-base sm:text-lg font-black tracking-tight leading-none text-foreground group-hover:text-primary transition-colors">
                            TheVoiceOfHope
                        </span>
                        <span className="text-[9px] sm:text-[10px] font-bold text-[#b8240d] dark:text-[#CCB88B] tracking-widest uppercase">
                            Cultivating Hope & Resilience
                        </span>
                    </div>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden lg:flex items-center gap-6">
                    {navLinks.map((link) => (
                        <div key={link.href} className="relative group/item">
                            {link.dropdown ? (
                                <div className="flex items-center gap-1 cursor-pointer">
                                    <Link
                                        href={link.href}
                                        className={cn(
                                            "text-sm font-semibold transition-all duration-300 hover:text-primary relative py-2",
                                            (link.href === "/" ? location === "/" : location.startsWith(link.href)) ? "text-primary" : "text-muted-foreground"
                                        )}
                                    >
                                        {link.label}
                                    </Link>
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />

                                    <div className="absolute top-full left-0 mt-1 w-64 bg-card border border-border rounded-xl shadow-xl opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all duration-300 py-2">
                                        {(link.dropdown === 'upcoming' ? upcomingEvents : pastEvents).length > 0 ? (
                                            (link.dropdown === 'upcoming' ? upcomingEvents : pastEvents).map(event => (
                                                <Link
                                                    key={event.id}
                                                    href={`${link.href}?id=${event.id}`}
                                                    className="block px-4 py-2 text-sm text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                                                >
                                                    {event.title}
                                                </Link>
                                            ))
                                        ) : (
                                            <div className="px-4 py-2 text-sm text-muted-foreground">No events found</div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <Link
                                    href={link.href}
                                    className={cn(
                                        "text-sm font-semibold transition-all duration-300 hover:text-primary relative py-2",
                                        location === link.href ? "text-primary" : "text-muted-foreground"
                                    )}
                                >
                                    {link.label}
                                    {location === link.href && (
                                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#b8240d] rounded-full transition-all duration-300" />
                                    )}
                                </Link>
                            )}
                        </div>
                    ))}
                </div>

                <div className="hidden md:flex items-center gap-2.5">
                    <Link href="/upcoming-events">
                        <Button size="sm" className="bg-[#b8240d] hover:bg-[#991d0a] text-white font-bold rounded-full px-4 shadow-md flex items-center gap-1.5 transition-all hover:scale-105">
                            <Heart className="w-4 h-4 fill-white" />
                            <span>Donate / Pledge</span>
                        </Button>
                    </Link>

                    {user && <NotificationBell />}

                    {user ? (
                        <div className="flex items-center gap-2">
                            {profile?.role === 'ADMIN' && (
                                <Link href={location === '/admin' ? '/' : '/admin'}>
                                    <Button variant={location === '/admin' ? "default" : "ghost"} size="icon" className="rounded-full w-10 h-10 shadow-sm">
                                        {location === '/admin' ? <Home className="h-5 w-5" /> : <LayoutDashboard className="h-5 w-5" />}
                                    </Button>
                                </Link>
                            )}
                            <Button variant="outline" size="sm" onClick={() => logout()} className="rounded-full px-4 border-border hover:bg-destructive hover:text-white transition-colors duration-300">
                                <LogOut className="h-4 w-4 mr-1.5" /> Logout
                            </Button>
                        </div>
                    ) : (
                        <Link href="/auth">
                            <Button size="sm" className="rounded-full px-5 bg-[#04047a] hover:bg-[#03035e] text-white font-bold shadow-md transition-all duration-300">
                                Sign In
                            </Button>
                        </Link>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            if (theme === "system") setTheme("light");
                            else if (theme === "light") setTheme("dark");
                            else setTheme("system");
                        }}
                        title={`Theme: ${theme === "system" ? "System (Auto)" : theme === "dark" ? "Dark" : "Light"} - Click to cycle`}
                        className="rounded-full w-10 h-10 hover:bg-muted transition-colors"
                        aria-label="Toggle theme"
                    >
                        {theme === "system" ? (
                            <Monitor className="h-5 w-5 text-primary" />
                        ) : theme === "dark" ? (
                            <Moon className="h-5 w-5 text-[#CCB88B]" />
                        ) : (
                            <Sun className="h-5 w-5 text-amber-500" />
                        )}
                    </Button>
                </div>

                {/* Mobile Actions */}
                <div className="md:hidden flex items-center gap-2">
                    {user && <NotificationBell />}
                    <button
                        className="p-2 text-foreground"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden border-t border-border bg-card p-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex flex-col gap-4">
                        {navLinks.map((link) => (
                            <div key={link.href} className="flex flex-col gap-2">
                                <Link
                                    href={link.href}
                                    onClick={(e) => {
                                        if (link.dropdown) {
                                            e.preventDefault();
                                            if (link.dropdown === 'upcoming') setIsUpcomingOpen(!isUpcomingOpen);
                                            else setIsPastOpen(!isPastOpen);
                                        } else {
                                            setIsMenuOpen(false);
                                        }
                                    }}
                                    className={cn(
                                        "text-base font-semibold flex items-center justify-between",
                                        (link.href === "/" ? location === "/" : location.startsWith(link.href)) ? "text-primary" : "text-foreground"
                                    )}
                                >
                                    {link.label}
                                    {link.dropdown && (
                                        <ChevronDown className={cn(
                                            "h-5 w-5 transition-transform",
                                            (link.dropdown === 'upcoming' ? isUpcomingOpen : isPastOpen) && "rotate-180"
                                        )} />
                                    )}
                                </Link>

                                {link.dropdown && (link.dropdown === 'upcoming' ? isUpcomingOpen : isPastOpen) && (
                                    <div className="pl-4 flex flex-col gap-3 border-l-2 border-border ml-1">
                                        {(link.dropdown === 'upcoming' ? upcomingEvents : pastEvents).length > 0 ? (
                                            (link.dropdown === 'upcoming' ? upcomingEvents : pastEvents).map(event => (
                                                <Link
                                                    key={event.id}
                                                    href={`${link.href}?id=${event.id}`}
                                                    onClick={() => setIsMenuOpen(false)}
                                                    className="text-sm text-muted-foreground hover:text-primary"
                                                >
                                                    {event.title}
                                                </Link>
                                            ))
                                        ) : (
                                            <span className="text-sm text-muted-foreground">No events</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                        <div className="flex items-center justify-between py-2 border-t border-border">
                            <span className="text-sm font-medium text-muted-foreground">Theme</span>
                            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-full border border-border">
                                <button
                                    type="button"
                                    onClick={() => setTheme("system")}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all",
                                        theme === "system" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Monitor className="h-3.5 w-3.5" />
                                    <span>Auto</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTheme("light")}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all",
                                        theme === "light" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Sun className="h-3.5 w-3.5" />
                                    <span>Light</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTheme("dark")}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all",
                                        theme === "dark" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Moon className="h-3.5 w-3.5" />
                                    <span>Dark</span>
                                </button>
                            </div>
                        </div>
                        <Link href="/upcoming-events" onClick={() => setIsMenuOpen(false)}>
                            <Button className="w-full bg-[#b8240d] hover:bg-[#991d0a] text-white font-bold flex items-center justify-center gap-2 shadow-md">
                                <Heart className="w-4 h-4 fill-white" />
                                <span>Donate / Make a Pledge</span>
                            </Button>
                        </Link>
                        <hr className="border-border" />
                        {user ? (
                            <>
                                {profile?.role === 'ADMIN' && (
                                    <Link href="/admin" onClick={() => setIsMenuOpen(false)} className="font-semibold text-primary">Admin Dashboard</Link>
                                )}
                                <button
                                    onClick={() => { logout(); setIsMenuOpen(false); }}
                                    className="text-left text-base font-medium text-destructive"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <Link href="/auth" onClick={() => setIsMenuOpen(false)}>
                                <Button className="w-full bg-[#04047a] text-white">Sign In / Register</Button>
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
