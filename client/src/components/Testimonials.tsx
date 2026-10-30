import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Quote, Star, MessageSquarePlus, Heart, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import LeaveReviewModal from "./LeaveReviewModal";
import { useAuth } from "@/hooks/use-auth";

interface TestimonialsProps {
    title?: string;
    subtitle?: string;
    limit?: number;
}

export default function Testimonials({
    title = "Voices of Hope & Community Stories",
    subtitle = "Real reflections from volunteers, donors, mentors, and the communities we uplift.",
    limit
}: TestimonialsProps) {
    const { user } = useAuth();
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

    const { data: testimonials = [], isLoading } = useQuery({
        queryKey: ["testimonials"],
        queryFn: async () => {
            let query = supabase
                .from("Testimonial")
                .select(`
                    id,
                    content,
                    rating,
                    status,
                    authorName,
                    authorRole,
                    authorAvatar,
                    createdAt,
                    authorId
                `)
                .order("createdAt", { ascending: false });

            if (limit) {
                query = query.limit(limit);
            }

            const { data, error } = await query;
            if (error) {
                console.error("Error fetching testimonials:", error);
                return [];
            }
            return data || [];
        }
    });

    return (
        <section className="py-20 bg-muted/40 border-t border-border overflow-hidden">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2E5E43]/10 text-[#2E5E43] text-xs font-bold uppercase tracking-wider mb-3 border border-[#2E5E43]/20">
                            <Sparkles className="w-3.5 h-3.5 text-[#CCB88B]" />
                            Community Experiences
                        </div>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
                            {title}
                        </h2>
                        <p className="text-muted-foreground text-base md:text-lg mt-2">
                            {subtitle}
                        </p>
                    </div>

                    <div className="shrink-0">
                        <Button
                            onClick={() => setIsReviewModalOpen(true)}
                            className="bg-[#2E5E43] hover:bg-[#254d37] text-white font-bold px-6 py-6 rounded-xl shadow-lg border-2 border-[#CCB88B] flex items-center gap-2 transition-all hover:scale-105"
                        >
                            <MessageSquarePlus className="w-5 h-5 text-[#CCB88B]" />
                            <span>Leave a Review</span>
                        </Button>
                    </div>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="py-16 flex flex-col items-center justify-center text-muted-foreground">
                        <Loader2 className="w-8 h-8 animate-spin text-[#2E5E43] mb-3" />
                        <p className="text-sm">Loading community stories...</p>
                    </div>
                ) : testimonials.length === 0 ? (
                    <Card className="border border-dashed border-border bg-card/60 p-12 text-center max-w-2xl mx-auto rounded-3xl shadow-sm">
                        <div className="w-16 h-16 rounded-full bg-[#2E5E43]/10 text-[#2E5E43] mx-auto flex items-center justify-center mb-4 border border-[#CCB88B]/40">
                            <Heart className="w-8 h-8 text-[#2E5E43] fill-[#2E5E43]" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">Be the First to Leave a Review</h3>
                        <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                            Have you attended an outreach event, volunteered with cooking, or donated to support street families and children? Share your experience with our community!
                        </p>
                        <Button
                            onClick={() => setIsReviewModalOpen(true)}
                            className="bg-[#2E5E43] hover:bg-[#254d37] text-white font-bold rounded-xl px-6 border border-[#CCB88B]"
                        >
                            <MessageSquarePlus className="w-4 h-4 mr-2 text-[#CCB88B]" />
                            Share Your Experience
                        </Button>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {testimonials.map((t: any) => {
                            const authorName =
                                t.authorName ||
                                "Kind Supporter";
                            const authorRole = t.authorRole || "Volunteer";
                            const ratingStars = Math.min(Math.max(t.rating || 5, 1), 5);
                            const formattedDate = t.createdAt
                                ? new Date(t.createdAt).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric"
                                  })
                                : null;

                            return (
                                <Card
                                    key={t.id}
                                    className="border border-border/80 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-card rounded-2xl overflow-hidden flex flex-col justify-between"
                                >
                                    <CardContent className="pt-6 pb-6 px-6 flex flex-col flex-grow justify-between">
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-1">
                                                    {[...Array(5)].map((_, idx) => (
                                                        <Star
                                                            key={idx}
                                                            className={`w-4 h-4 ${
                                                                idx < ratingStars
                                                                    ? "text-[#CCB88B] fill-[#CCB88B]"
                                                                    : "text-muted-foreground/20"
                                                            }`}
                                                        />
                                                    ))}
                                                </div>
                                                <Quote className="h-6 w-6 text-[#2E5E43]/20 shrink-0" />
                                            </div>

                                            <p className="text-foreground/90 italic text-sm leading-relaxed mb-6 line-clamp-5">
                                                "{t.content}"
                                            </p>
                                        </div>

                                        <div className="border-t border-border/60 pt-4 mt-auto flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-[#2E5E43] text-white flex items-center justify-center font-bold text-sm shadow-sm border border-[#CCB88B]">
                                                    {authorName.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm text-foreground leading-tight">
                                                        {authorName}
                                                    </h4>
                                                    <p className="text-[11px] font-semibold text-[#2E5E43]">
                                                        {authorRole}
                                                    </p>
                                                </div>
                                            </div>

                                            {formattedDate && (
                                                <span className="text-[11px] text-muted-foreground shrink-0">
                                                    {formattedDate}
                                                </span>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Leave Review Dialog */}
            <LeaveReviewModal
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
            />
        </section>
    );
}
