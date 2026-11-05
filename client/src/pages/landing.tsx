import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { MoveRight, Loader2, Heart, Sparkles, PhoneCall, MapPin, Bell } from "lucide-react";
import EventCard from "@/components/EventCard";
import Testimonials from "@/components/Testimonials";
import JoinUs from "@/components/JoinUs";
import EventDonationModal from "@/components/EventDonationModal";
import { usePaymentStore } from "@/stores/usePaymentStore";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const charityPillars = [
  {
    title: "Cooking Together & Feeding Communities",
    description: "Preparing nutritious hot meals and distributing essential dry rations side by side with children and street families.",
    image: "/images/IMG-20261026-WA0010.jpg",
    tag: "Compassion in Action"
  },
  {
    title: "Visiting Children's Homes",
    description: "Bringing warmth, gifts, shoes, learning materials, and genuine love to orphaned and vulnerable children.",
    image: "/images/IMG-20261026-WA0013.jpg",
    tag: "Children's Outreach"
  },
  {
    title: "Honoring & Caring for the Aged",
    description: "Standing with the elderly through home visits, healthcare essentials, blankets, and deep companionship.",
    image: "/images/IMG-20261026-WA0023.jpg",
    tag: "Elderly Support"
  },
  {
    title: "Street Family Rehabilitation & Mentorship",
    description: "Meeting street families where they are, offering life counseling, mentorship, and viable pathways to rebuild their lives.",
    image: "/images/IMG-20261026-WA0030.jpg",
    tag: "Mentorship & Hope"
  },
  {
    title: "Digital & Educational Empowerment",
    description: "Supplying books, laptops, phones, and stationery so every underprivileged child can pursue education and dreams.",
    image: "/images/IMG-20261026-WA0045.jpg",
    tag: "Future of Hope"
  }
];

const charityGallery = [
  "/images/IMG-20261026-WA0004.jpg",
  "/images/IMG-20261026-WA0006.jpg",
  "/images/IMG-20261026-WA0009.jpg",
  "/images/IMG-20261026-WA0011.jpg",
  "/images/IMG-20261026-WA0019.jpg",
  "/images/IMG-20261026-WA0024.jpg",
  "/images/IMG-20261026-WA0028.jpg",
  "/images/IMG-20261026-WA0036.jpg",
  "/images/IMG-20261026-WA0048.jpg"
];

export default function Landing() {
  const { openPayment } = usePaymentStore();
  const [donationModalEvent, setDonationModalEvent] = useState<any | null>(null);

  const { data: upcomingEvents, isLoading: loadingUpcoming } = useQuery({
    queryKey: ["upcoming-events"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('Event')
        .select('*')
        .gte('date', now)
        .order('date', { ascending: true })
        .limit(3);
      if (error) throw error;
      return data;
    }
  });

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % charityPillars.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const openQuickDonate = (defaultMode: 'DIRECT' | 'PLEDGE' = 'DIRECT') => {
    const firstUpcoming = upcomingEvents?.[0];
    setDonationModalEvent({
      id: firstUpcoming?.id || null,
      title: firstUpcoming?.title || "The Voice of Hope Charity Outreach",
      date: firstUpcoming?.date || new Date(Date.now() + 14 * 86400000).toISOString(),
      location: firstUpcoming?.location || "Nairobi, Kenya",
      defaultMode
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Hero Section — Uses stated hero background image without solid emerald cover */}
      <section
        className="relative min-h-[88vh] flex items-center justify-center overflow-hidden text-white bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/hero.webp')" }}
      >
        {/* Full-Visibility Hero Image Layer */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero_landing.gif"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/images/hero.webp";
            }}
            alt="The Voice of Hope Kenya — Charity Outreach"
            className="w-full h-full object-cover object-center opacity-100 scale-100 transition-transform duration-1000"
          />
          {/* Subtle contrast scrim so typography stays crisp while keeping the hero photo vibrant */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/35" />
        </div>

        <div className="container mx-auto px-4 py-24 text-center relative z-10 max-w-4xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-[#CCB88B]/40 text-[#CCB88B] text-xs md:text-sm font-bold uppercase tracking-wider mb-6 shadow-sm">
            The Voice of Hope Kenya — Bringing Hope for a Better Future
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black mb-6 tracking-tight leading-tight drop-shadow-md">
            We Bring Hope to the Hopeless, <br className="hidden sm:inline" />
            <span className="text-[#CCB88B] underline decoration-[#b8240d] decoration-4 underline-offset-8">
              We Help the Needy
            </span>
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-slate-100 mb-10 max-w-2xl mx-auto font-normal leading-relaxed drop-shadow">
            "Empowering communities, amplifying voices" — Visiting children's homes, the aged, and street families to cook together, mentor, and share love.
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center items-center">
            <Button
              size="lg"
              onClick={() => openQuickDonate('DIRECT')}
              className="bg-[#b8240d] hover:bg-[#991d0a] text-white h-14 px-8 text-lg font-extrabold rounded-2xl shadow-xl border border-white/20 transition-all hover:scale-105 w-full sm:w-auto"
            >
              <Heart className="mr-2 h-5 w-5 fill-white" />
              Donate Now (No Account Needed)
            </Button>
            <Button
              size="lg"
              onClick={() => openQuickDonate('PLEDGE')}
              className="bg-[#04047a] hover:bg-[#03035e] text-white h-14 px-8 text-lg font-bold rounded-2xl shadow-xl border border-[#CCB88B]/40 transition-all hover:scale-105 w-full sm:w-auto"
            >
              <Bell className="mr-2 h-5 w-5 text-[#CCB88B]" />
              Make a Pledge (Pay in Bits)
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="bg-black/35 backdrop-blur-md border-white/40 text-white hover:bg-white/20 h-14 px-7 text-base font-bold rounded-2xl w-full sm:w-auto"
            >
              <Link href="/upcoming-events">
                Upcoming Outreaches <MoveRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          {/* Quick HQ Contacts Strip */}
          <div className="mt-12 pt-8 border-t border-white/20 flex flex-wrap justify-center items-center gap-6 text-xs sm:text-sm text-slate-100">
            <span className="flex items-center gap-1.5 font-semibold">
              <MapPin className="w-4 h-4 text-[#CCB88B]" /> Nairobi, Kenya Headquarters
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 font-semibold">
              <PhoneCall className="w-4 h-4 text-[#CCB88B]" /> info@theevoiceofhope.org | +254 798 182 108
            </span>
          </div>
        </div>
      </section>

      {/* Pillars Carousel: What We Do */}
      <section id="features" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-3 border border-primary/20">
              <Sparkles className="w-3.5 h-3.5 text-[#b8240d]" />
              Hands-On Charity Work
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
              How We Touch Lives Daily
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We believe in being physically present with the lost and needy, cooking warm meals, sitting with the aged, and opening doors of opportunity for street children while bringing hope to the hopeless.
            </p>
          </div>

          <div className="relative mx-auto h-[520px] max-w-5xl overflow-hidden rounded-3xl shadow-2xl group border border-border">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.7 }}
                className="absolute inset-0"
              >
                <div className="relative w-full h-full">
                  <img
                    src={charityPillars[currentSlide].image}
                    alt={charityPillars[currentSlide].title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
                  <div className="absolute bottom-12 left-8 right-8 sm:left-12 sm:right-12 text-white">
                    <span className="px-3 py-1 rounded-full bg-[#b8240d] text-white text-xs font-bold uppercase tracking-wider mb-3 inline-block shadow-sm">
                      {charityPillars[currentSlide].tag}
                    </span>
                    <h3 className="text-2xl sm:text-4xl md:text-5xl font-black mb-3">
                      {charityPillars[currentSlide].title}
                    </h3>
                    <p className="text-base sm:text-lg text-slate-100 max-w-2xl leading-relaxed">
                      {charityPillars[currentSlide].description}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {charityPillars.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={cn(
                    "h-2.5 rounded-full transition-all duration-300",
                    currentSlide === idx ? "bg-[#CCB88B] w-8" : "bg-white/40 hover:bg-white/70 w-2.5"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Core Identity Section */}
      <section className="py-24 bg-[#04047a] dark:bg-slate-900 text-white border-y border-white/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <div className="space-y-6">
              <span className="text-xs font-bold uppercase tracking-widest text-[#CCB88B]">
                Uplifting Lives Through Compassion, Service, and Love
              </span>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                A Safe Haven and Lifeline for the Most Vulnerable
              </h2>
              <p className="text-base sm:text-lg text-slate-100 leading-relaxed font-normal">
                We are a registered charity organization based in Nairobi, Kenya. Our mission is direct and heartfelt: we visit children's homes, the aged, and street families. We encourage them, spend quality time together, offer mentorship, cook hot meals, and provide clothing, food, shoes, and learning tools.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-white/10 border border-white/20">
                  <h4 className="text-2xl font-black text-[#CCB88B]">100%</h4>
                  <p className="text-xs text-slate-100 font-medium mt-1">Direct community impact across Nairobi & Kenyan counties</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/10 border border-white/20">
                  <h4 className="text-2xl font-black text-[#CCB88B]">Pay in Bits</h4>
                  <p className="text-xs text-slate-100 font-medium mt-1">Flexible pledges with countdown reminders or instant guest giving</p>
                </div>
              </div>
              <div className="pt-2 flex flex-wrap gap-3">
                <Button asChild className="bg-[#CCB88B] hover:bg-[#bfa877] text-slate-900 font-extrabold h-12 px-6 rounded-xl shadow-lg">
                  <Link href="/about">Learn More About Our Journey</Link>
                </Button>
                <Button
                  onClick={() => openQuickDonate('DIRECT')}
                  className="bg-[#b8240d] hover:bg-[#991d0a] text-white font-bold h-12 px-6 rounded-xl shadow-lg"
                >
                  <Heart className="w-4 h-4 mr-2 fill-white" /> Support Our Mission
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-[#CCB88B]/20 rounded-3xl blur-2xl" />
              <img
                src="/images/IMG-20261026-WA0010.jpg"
                alt="Cooking Together at Outreach"
                className="relative rounded-3xl shadow-2xl border-2 border-white/20 object-cover w-full h-[450px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Outreach Events */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                Join Our Next Visit
              </span>
              <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mt-1 mb-3">
                Upcoming Outreach Events
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground">
                Mark your attendance to cook, mentor, and play games—or donate any amount or make an installment pledge from anywhere.
              </p>
            </div>
            <Button asChild variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/10 font-bold rounded-xl">
              <Link href="/upcoming-events">
                View All Outreaches <MoveRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          {loadingUpcoming ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : !upcomingEvents || upcomingEvents.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-3xl border border-dashed border-border max-w-xl mx-auto p-8">
              <Heart className="w-12 h-12 text-[#b8240d] mx-auto mb-3" />
              <h4 className="text-xl font-bold text-foreground mb-1">New Outreach Being Scheduled</h4>
              <p className="text-sm text-muted-foreground mb-6">Our team is actively organizing the next children's home and street outreach visit. You can still donate or make a pledge today!</p>
              <Button onClick={() => openQuickDonate('DIRECT')} className="bg-primary text-primary-foreground font-bold rounded-xl">
                <Heart className="w-4 h-4 mr-2 fill-current" /> Donate or Make a Pledge
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {upcomingEvents.map((event: any) => <EventCard key={event.id} event={event} />)}
            </div>
          )}
        </div>
      </section>

      {/* Real Charity Media Gallery */}
      <section className="py-24 bg-muted/40 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Moments of Love & Smiles
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mt-1 mb-4">
              Our Charity Outreach Gallery
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground">
              Unfiltered moments from our visits to children's homes, elderly care centers, and street family communities in Kenya.
            </p>
          </div>

          {/* Real Photo Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {charityGallery.map((imgUrl, index) => (
              <div key={index} className="group relative overflow-hidden rounded-2xl shadow-md h-72 border border-border">
                <img
                  src={imgUrl}
                  alt={`Charity Outreach ${index + 1}`}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                  <span className="text-[#CCB88B] font-bold text-sm">
                    The Voice of Hope Kenya
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Inspiring YouTube Videos Section */}
          <div className="mt-20 space-y-12">
            <div className="text-center max-w-3xl mx-auto">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-3">
                Watch Our Mission in Action
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base">
                See how cooking together, distributing learning materials, and mentoring street families transforms lives.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <div className="rounded-3xl overflow-hidden shadow-2xl aspect-video bg-black relative border-2 border-border">
                <iframe
                  src="https://www.youtube.com/embed/gCOk85cO4b8"
                  title="Kenya Children's Home Charity Outreach"
                  className="w-full h-full border-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              <div className="rounded-3xl overflow-hidden shadow-2xl aspect-video bg-black relative border-2 border-border">
                <iframe
                  src="https://www.youtube.com/embed/7rE_v2tE5Fk"
                  title="Street Family Support & Community Care"
                  className="w-full h-full border-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Testimonials & Reviews */}
      <Testimonials />

      {/* Call to Join Us */}
      <JoinUs />

      {/* Quick Donation & Pledge Modal accessible directly from Landing Hero */}
      <EventDonationModal
        event={donationModalEvent}
        isOpen={!!donationModalEvent}
        onClose={() => setDonationModalEvent(null)}
        onProceedToPayment={(bookingData) => {
          openPayment({
            amount: bookingData.amount,
            bookingId: bookingData.id,
            type: bookingData.isInstallment ? 'pledge_installment' : 'event',
            eventId: donationModalEvent?.id,
            title: bookingData.title,
            currency: 'KES',
            returnUrl: '/upcoming-events',
            guestName: bookingData.guestName,
            guestEmail: bookingData.guestEmail,
            guestPhone: bookingData.guestPhone,
            isInstallment: bookingData.isInstallment,
            pledgedAmount: bookingData.pledgedAmount
          });
        }}
      />
    </div>
  );
}
