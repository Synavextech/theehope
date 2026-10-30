import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Heart, Sparkles, MoveRight } from "lucide-react";

export default function JoinUs() {
    return (
        <section className="py-24 bg-[#2E5E43] text-white overflow-hidden relative border-t border-[#CCB88B]/20">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-[#CCB88B]/25 rounded-full blur-2xl pointer-events-none" />

            <div className="container mx-auto px-4 text-center relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[#CCB88B] text-xs font-bold uppercase tracking-wider mb-4">
                    <Sparkles className="w-3.5 h-3.5 text-[#CCB88B]" />
                    EverythingGoodForHumanity
                </div>

                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-6 tracking-tight">
                    Bring Hope to the Lost, <br />
                    <span className="text-[#CCB88B]">Help the Needy</span>
                </h2>

                <p className="text-base sm:text-lg text-slate-100 mb-10 leading-relaxed font-normal">
                    Whether you want to roll up your sleeves to cook together in children's homes, mentor street youths, donate learning materials, or inquire about adoption—there is a place for your heart in our family.
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link href="/upcoming-events">
                        <Button size="lg" className="bg-[#CCB88B] hover:bg-[#bfa979] text-[#2E5E43] font-black px-8 h-14 text-base rounded-2xl shadow-xl border-2 border-white/40 hover:scale-105 transition-all">
                            <Heart className="w-5 h-5 mr-2 fill-[#2E5E43]" />
                            Attend or Donate Now
                        </Button>
                    </Link>
                    <Link href="/auth">
                        <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20 px-8 h-14 text-base font-bold rounded-2xl">
                            Create Supporter Account <MoveRight className="w-4 h-4 ml-2" />
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
