import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Heart, Lock, CheckCircle2, Loader2, UserPlus, LogIn } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface LeaveReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function LeaveReviewModal({ isOpen, onClose, onSuccess }: LeaveReviewModalProps) {
    const { user, profile } = useAuth();
    const [, setLocation] = useLocation();
    const { toast } = useToast();

    const [rating, setRating] = useState<number>(5);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [role, setRole] = useState<string>("Volunteer");
    const [content, setContent] = useState<string>("");
    const [submitting, setSubmitting] = useState<boolean>(false);

    const rolesList = [
        "Volunteer",
        "Donor / Supporter",
        "Mentor",
        "Children's Home Partner",
        "Community Beneficiary",
        "General Supporter"
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (content.trim().length < 10) {
            toast({
                title: "Review too short",
                description: "Please share at least a sentence or two (10+ characters) about your experience.",
                variant: "destructive"
            });
            return;
        }

        setSubmitting(true);
        try {
            const authorDisplayName = profile?.name || user.email?.split('@')[0] || "Supporter";

            const { error } = await supabase.from('Testimonial').insert({
                authorId: user.id,
                content: content.trim(),
                rating: rating,
                status: 'APPROVED',
                authorName: authorDisplayName,
                authorRole: role,
                authorAvatar: null
            });

            if (error) throw error;

            toast({
                title: "Thank you for your review! ❤️",
                description: "Your review has been shared with the community and is now live on our platform.",
            });

            setContent("");
            setRating(5);
            queryClient.invalidateQueries({ queryKey: ['testimonials'] });
            queryClient.invalidateQueries({ queryKey: ['all-testimonials'] });
            if (onSuccess) onSuccess();
            onClose();
        } catch (err: any) {
            toast({
                title: "Error submitting review",
                description: err.message || "Failed to post review. Please try again.",
                variant: "destructive"
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-lg bg-card border-border shadow-2xl p-6">
                {!user ? (
                    // Unauthenticated state - Call to action to login / register
                    <div className="text-center py-6 space-y-5">
                        <div className="w-16 h-16 rounded-2xl bg-[#2E5E43]/10 border-2 border-[#CCB88B] mx-auto flex items-center justify-center text-[#2E5E43]">
                            <Lock className="w-8 h-8 text-[#2E5E43]" />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-center text-foreground">
                                Join Our Community to Leave a Review
                            </DialogTitle>
                            <DialogDescription className="text-center text-muted-foreground max-w-sm mx-auto">
                                We value authentic feedback from our donors, volunteers, and community members. Please sign in or create a free account to share your story.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                            <Button
                                onClick={() => {
                                    onClose();
                                    setLocation("/auth?mode=register");
                                }}
                                className="bg-[#2E5E43] hover:bg-[#254d37] text-white font-bold h-11 px-6 rounded-xl shadow-md"
                            >
                                <UserPlus className="w-4 h-4 mr-2" />
                                Create Account
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    onClose();
                                    setLocation("/auth?mode=login");
                                }}
                                className="border-[#2E5E43] text-[#2E5E43] hover:bg-[#2E5E43]/10 font-bold h-11 px-6 rounded-xl"
                            >
                                <LogIn className="w-4 h-4 mr-2" />
                                Sign In
                            </Button>
                        </div>
                    </div>
                ) : (
                    // Authenticated state - Review Form
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <DialogHeader>
                            <div className="flex items-center gap-2 mb-1">
                                <Heart className="w-5 h-5 text-[#2E5E43] fill-[#2E5E43]" />
                                <span className="text-xs font-bold uppercase tracking-wider text-[#2E5E43]">
                                    The Voice of Hope Community
                                </span>
                            </div>
                            <DialogTitle className="text-2xl font-extrabold text-foreground">
                                Share Your Experience
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground text-sm">
                                Let others know about your experience volunteering, donating, or partnering with us.
                            </DialogDescription>
                        </DialogHeader>

                        {/* Star Rating */}
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">Your Rating</Label>
                            <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        type="button"
                                        key={star}
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        className="p-1 transition-transform hover:scale-125 focus:outline-none"
                                    >
                                        <Star
                                            className={`w-7 h-7 transition-colors ${
                                                (hoverRating || rating) >= star
                                                    ? "text-amber-400 fill-amber-400"
                                                    : "text-muted-foreground/30"
                                            }`}
                                        />
                                    </button>
                                ))}
                                <span className="text-xs font-semibold text-muted-foreground ml-2">
                                    {rating === 5 ? "Exceptional (5/5)" : `${rating} out of 5 stars`}
                                </span>
                            </div>
                        </div>

                        {/* Role Selection */}
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">Your Connection with Us</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {rolesList.map((r) => (
                                    <button
                                        type="button"
                                        key={r}
                                        onClick={() => setRole(r)}
                                        className={`px-3 py-2 rounded-lg text-xs font-semibold text-left border transition-all ${
                                            role === r
                                                ? "bg-[#2E5E43] text-white border-[#2E5E43] shadow-sm"
                                                : "bg-muted/40 hover:bg-muted border-border text-foreground"
                                        }`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Review Content */}
                        <div className="space-y-2">
                            <Label htmlFor="review-content" className="text-sm font-semibold">
                                Your Story / Feedback
                            </Label>
                            <Textarea
                                id="review-content"
                                rows={4}
                                required
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="How did The Voice of Hope impact you or the families we serve? Cooking together, mentorship, donating..."
                                className="resize-none text-sm"
                            />
                            <p className="text-[11px] text-muted-foreground">
                                Posting as <strong className="text-foreground">{profile?.name || user.email}</strong>
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onClose}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting || content.trim().length < 5}
                                className="bg-[#2E5E43] hover:bg-[#254d37] text-white font-bold px-6 shadow-md"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    "Post Review"
                                )}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
