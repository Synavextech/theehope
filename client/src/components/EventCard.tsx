import { format } from "date-fns";
import { Calendar, MapPin, MoveRight, Heart } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function EventCard({ event }: { event: any }) {
    const isUpcoming = new Date(event.date) >= new Date();

    return (
        <Card className="group overflow-hidden border-border bg-card hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 rounded-3xl">
            <div className="aspect-video relative overflow-hidden bg-muted/40">
                <img
                    src={event.heroImageUrl || event.imageUrls?.[0] || "/images/IMG-20261026-WA0010.jpg"}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-4 left-4 bg-card/95 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-primary shadow-sm border border-border">
                    {event.category || "Charity Outreach"}
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-4">
                    <div className="flex items-center gap-2 text-white text-sm font-medium">
                        <Calendar className="h-4 w-4 text-[#CCB88B]" />
                        {format(new Date(event.date), "MMM dd, yyyy")}
                    </div>
                </div>
            </div>

            <CardHeader className="pb-2">
                <CardTitle className="text-xl group-hover:text-primary transition-colors line-clamp-1 font-bold text-foreground">
                    {event.title}
                </CardTitle>
                <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                    <MapPin className="h-3.5 w-3.5 text-[#b8240d]" />
                    <span className="line-clamp-1">{event.location}</span>
                </div>
            </CardHeader>

            <CardContent className="pb-4">
                <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {event.description}
                </p>
            </CardContent>

            <CardFooter className="pt-0 border-t border-border bg-muted/20">
                <div className="flex items-center justify-between w-full py-3">
                    <div className="flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-[#b8240d] fill-current" />
                        <span className="text-xs font-bold text-foreground">
                            {Number(event.target_amount) > 0 ? `Target: KES ${Number(event.target_amount).toLocaleString()}` : "Open Contribution / Pledge"}
                        </span>
                    </div>
                    <Link href={`${isUpcoming ? '/upcoming-events' : '/past-events'}?id=${event.id}`}>
                        <Button variant="ghost" size="sm" className="group/btn text-primary font-bold hover:bg-primary/10 rounded-xl">
                            {isUpcoming ? "Donate / Pledge" : "View Moments"}{" "}
                            <MoveRight className="ml-1.5 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                        </Button>
                    </Link>
                </div>
            </CardFooter>
        </Card>
    );
}
