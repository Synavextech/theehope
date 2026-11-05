import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, Heart } from "lucide-react";

export default function AuthPage() {
    const { user, login, register, isLoading: authLoading } = useAuth();
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [isLogin, setIsLogin] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const urlParams = new URLSearchParams(window.location.search);
    const redirectTo = urlParams.get("redirectTo") || "/";

    useEffect(() => {
        if (user) {
            setLocation(redirectTo);
        }
    }, [user, redirectTo, setLocation]);

    if (user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const name = formData.get("name") as string;
        const phone = (formData.get("phone") as string) || "";
        const country = (formData.get("country") as string) || "";
        const city = (formData.get("city") as string) || "";
        const address = (formData.get("address") as string) || "";

        try {
            if (isLogin) {
                await login(email, password);
                toast({
                    title: "Welcome back!",
                    description: "You have successfully signed in.",
                });
            } else {
                const data = await register(email, password, name, phone, country, city, address);
                if (data?.session) {
                    toast({
                        title: "Registration successful!",
                        description: "Your account has been created and you are now signed in.",
                    });
                } else {
                    toast({
                        title: "Registration successful!",
                        description: "Please check your email to confirm your account before signing in.",
                    });
                    setIsLogin(true);
                }
            }
        } catch (error: any) {
            toast({
                title: "Authentication Error",
                description: error.message || "Something went wrong. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-[90vh] flex items-center justify-center bg-background text-foreground p-4 py-16">
            <Card className="w-full max-w-md shadow-2xl border border-border bg-card rounded-3xl overflow-hidden">
                <div className="h-32 bg-[#04047a] flex flex-col items-center justify-center p-8 text-white border-b-4 border-[#b8240d]">
                    <h2 className="text-2xl font-black tracking-tight">The Voice of Hope</h2>
                    <p className="text-xs text-[#CCB88B] uppercase tracking-widest mt-1 font-bold">Kenya — Hope for the Future</p>
                </div>
                <CardHeader className="text-center pt-8">
                    <CardTitle className="text-2xl font-bold text-foreground">
                        {isLogin ? "Welcome Back" : "Join Our Charity Family"}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        {isLogin ? "Sign in to manage your outreach bookings & pledges" : "Create a supporter account—or donate anytime as a guest"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" name="name" placeholder="Jane Wanjiku" required className="bg-background" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input id="phone" name="phone" placeholder="+254 7XX XXX XXX" required className="bg-background" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="country">Country</Label>
                                        <Input id="country" name="country" placeholder="Kenya" required className="bg-background" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="city">City</Label>
                                        <Input id="city" name="city" placeholder="Nairobi" required className="bg-background" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address">Physical Address</Label>
                                    <Input id="address" name="address" placeholder="Nairobi, Kenya" required className="bg-background" />
                                </div>
                            </>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" placeholder="you@example.com" required className="bg-background" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="pr-10 bg-background"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                        <Button type="submit" className="w-full h-12 text-lg font-bold mt-2 bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting || authLoading}>
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Processing...
                                </span>
                            ) : isLogin ? "Sign In" : "Register"}
                        </Button>
                    </form>
                    <div className="mt-6 text-center text-sm text-muted-foreground">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                        <button
                            className="text-primary font-bold hover:underline"
                            onClick={() => setIsLogin(!isLogin)}
                        >
                            {isLogin ? "Register now" : "Sign in"}
                        </button>
                    </div>
                    <div className="mt-4 pt-4 border-t border-border text-center">
                        <Link href="/upcoming-events" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#b8240d] hover:underline">
                            <Heart className="w-3.5 h-3.5 fill-current" />
                            Prefer to donate without creating an account? Continue as Guest
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
