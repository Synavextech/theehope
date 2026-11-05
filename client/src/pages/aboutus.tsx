import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ShieldCheck, Sparkles, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import HeroSection from "@/components/HeroSection";
import Testimonials from "@/components/Testimonials";
import JoinUs from "@/components/JoinUs";
import CountUp from "@/components/CountUp";

const charityPillars = [
    {
        title: "Visiting Children's Homes",
        image: "/images/IMG-20261026-WA0013.jpg",
        content: "Bringing emotional support, clothes, shoes, learning materials, and genuine family love to orphaned and vulnerable children across Kenya."
    },
    {
        title: "Cooking & Feeding Together",
        image: "/images/IMG-20261026-WA0010.jpg",
        content: "We roll up our sleeves and prepare large nutritious meals with the community, sharing joyful table fellowship that restores human dignity."
    },
    {
        title: "Honoring & Comforting the Aged",
        image: "/images/IMG-20261026-WA0023.jpg",
        content: "Ensuring our senior citizens receive healthcare essentials, food supplies, warm blankets, and affectionate companionship."
    },
    {
        title: "Street Family Mentorship",
        image: "/images/IMG-20261026-WA0030.jpg",
        content: "Engaging street families with compassionate life skills, anti-drug counseling, education support, and legal adoption guidance."
    }
];

const partnersList = [
    { name: "Worlducation.world", note: "Management & Educational Pillar" },
    { name: "LookinGlass Technologies", note: "Digital Architecture & Tech Supervision" },
    { name: "Electrocare.tech", note: "Engineering & Web Development" }
];

export default function About() {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            {/* Hero Section */}
            <HeroSection
                backgroundImageUrl="/images/IMG-20261026-WA0010.jpg"
                title="The Voice of Hope Kenya"
                subtitle="Hope for the Future — Uplifting lives through compassion, service, and love. Join us today and make a difference."
            >
                <div className="flex flex-wrap gap-4 justify-center">
                    <Button asChild size="lg" className="bg-[#b8240d] hover:bg-[#961e0b] text-white font-bold h-13 px-8 rounded-2xl shadow-xl">
                        <Link href="/upcoming-events">
                            <Heart className="mr-2 h-5 w-5 fill-white" />
                            Support Our Next Outreach
                        </Link>
                    </Button>
                </div>
            </HeroSection>

            {/* About Us Introduction */}
            <section className="py-24 bg-background">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="relative group">
                            <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-2xl group-hover:bg-primary/20 transition-colors" />
                            <img
                                src="/images/IMG-20261026-WA0030.jpg"
                                alt="The Voice of Hope Kenya Team"
                                className="relative rounded-3xl shadow-2xl border-2 border-border object-cover w-full h-[460px]"
                            />
                        </div>
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider border border-primary/20">
                                <Sparkles className="w-3.5 h-3.5 text-[#b8240d]" />
                                Who We Are
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black text-foreground leading-tight">
                                We Bring Hope to the Hopeless, <br />
                                <span className="text-primary">We Bring Help to the Needy</span>
                            </h2>
                            <p className="text-lg text-muted-foreground leading-relaxed font-normal">
                                <strong>The Voice of Hope Kenya - Hope for a Better Future</strong> is a dedicated charity organization headquartered in Nairobi, Kenya. We do frontline charity work by visiting children's homes, the aged, and street families.
                            </p>
                            <p className="text-base text-muted-foreground leading-relaxed">
                                Rather than standing on the sidelines, we step into their spaces: we encourage them, have a good time together, provide mentorship, play games, and roll up our sleeves to cook hot meals together in the kitchen.
                            </p>
                            <div className="p-4 rounded-2xl bg-card border border-border flex items-start gap-3">
                                <ShieldCheck className="w-6 h-6 text-[#b8240d] shrink-0 mt-0.5" />
                                <p className="text-xs sm:text-sm text-foreground font-medium">
                                    Motto: <strong className="text-primary">EverythingGoodForHumanity</strong> — One deed at a time, your support counts too.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Vision and Mission Cards */}
            <section className="py-20 bg-muted/30 border-y border-border">
                <div className="container mx-auto px-4 max-w-5xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="p-8 border border-border bg-card shadow-lg rounded-3xl flex flex-col justify-between">
                            <CardHeader className="p-0 mb-4">
                                <CardTitle className="text-3xl font-black text-foreground">Our Vision</CardTitle>
                            </CardHeader>
                            <p className="text-lg text-primary font-semibold leading-relaxed">
                                <em>"Empowering communities, amplifying voices 💡"</em>
                            </p>
                            <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                                A community where every street child, orphaned youth, and lonely elder is recognized, empowered, and embraced with opportunities for dignity, education, and lasting hope.
                            </p>
                        </Card>

                        <Card className="p-8 border border-border bg-card shadow-lg rounded-3xl flex flex-col justify-between">
                            <CardHeader className="p-0 mb-4">
                                <CardTitle className="text-3xl font-black text-foreground">Our Mission</CardTitle>
                            </CardHeader>
                            <p className="text-lg text-[#b8240d] font-semibold leading-relaxed">
                                <em>"Uplifting lives through compassion, service, and love"</em>
                            </p>
                            <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                                Bridging the gap of poverty by delivering direct in-kind goods, hot nutritious meals, emotional mentorship, and educational equipment directly into the hands of those in greatest need.
                            </p>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Our Impact CountUp */}
            <section className="py-20 bg-background container mx-auto px-4 text-center">
                <span className="text-xs font-bold uppercase tracking-widest text-primary">
                    Proven Compassion in Numbers
                </span>
                <h3 className="text-3xl md:text-4xl font-extrabold mb-4 text-foreground mt-1">Our Outreach Footprint</h3>
                <p className="text-muted-foreground leading-relaxed text-center max-w-2xl mx-auto text-base">
                    Every volunteer hour, donated laptop, pair of shoes, and bag of food directly impacts a life on the ground.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-12 max-w-4xl mx-auto">
                    <div className="p-6 rounded-3xl bg-card border border-border shadow-sm">
                        <h4 className="text-4xl sm:text-5xl font-black text-primary mb-1">
                            <CountUp to={12} suffix="k+" />
                        </h4>
                        <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Essential Services Delivered</p>
                    </div>
                    <div className="p-6 rounded-3xl bg-card border border-border shadow-sm">
                        <h4 className="text-4xl sm:text-5xl font-black text-[#b8240d] mb-1">
                            <CountUp to={35} suffix="+" />
                        </h4>
                        <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Children's Homes Visited</p>
                    </div>
                    <div className="p-6 rounded-3xl bg-card border border-border shadow-sm">
                        <h4 className="text-4xl sm:text-5xl font-black text-primary mb-1">
                            <CountUp to={1500} suffix="+" />
                        </h4>
                        <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Homeless Youths & Children Helped</p>
                    </div>
                </div>
            </section>

            {/* 4 Pillars Section */}
            <section className="py-24 bg-muted/40 border-t border-border">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16 max-w-3xl mx-auto">
                        <span className="text-xs font-bold uppercase tracking-widest text-[#b8240d]">Our Core Activities</span>
                        <h2 className="text-3xl md:text-5xl font-black text-foreground mt-1 mb-4">What We Do Together</h2>
                        <p className="text-muted-foreground text-base sm:text-lg">
                            We don't simply drop off donations—we sit down, laugh, prepare food together, and walk life's road as one family.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {charityPillars.map((pillar, idx) => (
                            <Card key={idx} className="border border-border bg-card rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col justify-between">
                                <div className="h-52 overflow-hidden relative">
                                    <img src={pillar.image} alt={pillar.title} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                </div>
                                <CardContent className="p-6 flex flex-col flex-grow justify-between">
                                    <div>
                                        <h4 className="font-extrabold text-xl mb-2 text-foreground">{pillar.title}</h4>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{pillar.content}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Supporters & Management Strip */}
            <section className="py-20 bg-background border-t border-border">
                <div className="container mx-auto px-4 max-w-5xl">
                    <div className="text-center mb-12">
                        <span className="text-xs font-bold uppercase tracking-widest text-[#b8240d]">Collaborative Leadership</span>
                        <h3 className="text-3xl font-extrabold text-foreground mt-1">Managed & Supported By</h3>
                        <p className="text-sm text-muted-foreground mt-2">
                            Operating with transparency and technological accountability under accredited partner institutions.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {partnersList.map((partner, i) => (
                            <div key={i} className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <ExternalLink className="w-4 h-4 text-[#b8240d]" />
                                        <h4 className="font-bold text-base text-foreground">{partner.name}</h4>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{partner.note}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 p-6 rounded-3xl bg-[#04047a] text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl border border-[#CCB88B]/30">
                        <div className="space-y-1 text-center sm:text-left">
                            <h4 className="font-black text-xl">The Voice of Hope Sub-Office Contacts</h4>
                            <p className="text-xs text-slate-200">Headquarter office located in Nairobi, Kenya. Available 24/7 for donation drop-offs and volunteer inquiries.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <a href="tel:+254798182108" className="px-5 py-3 rounded-xl bg-white text-[#04047a] font-bold text-xs hover:bg-slate-100 transition-colors text-center shadow-md">
                                +254 798 182 108
                            </a>
                            <a href="tel:+254798332690" className="px-5 py-3 rounded-xl bg-[#b8240d] text-white font-black text-xs hover:bg-[#991d0a] transition-colors text-center shadow-md">
                                +254 798 332 690
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <Testimonials />

            {/* Join Us CTA */}
            <JoinUs />
        </div>
    );
}
