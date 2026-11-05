import { Link } from "wouter";
import { Heart, MapPin, Phone, Mail, ExternalLink, ShieldCheck } from "lucide-react";

export default function Footer() {
    return (
        <footer className="border-t border-border bg-[#04047a] dark:bg-slate-950 text-slate-100 pt-16 pb-12 transition-colors duration-300">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
                    {/* Brand Column */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-white text-[#04047a] flex items-center justify-center font-black text-xl shadow-md border-2 border-[#b8240d]">
                                <Heart className="w-6 h-6 text-[#b8240d] fill-[#b8240d]" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white tracking-tight">The Voice of Hope Kenya</h3>
                                <p className="text-xs font-semibold text-[#CCB88B] tracking-wider uppercase">Hope for the Future</p>
                            </div>
                        </div>

                        <p className="text-sm text-slate-200 leading-relaxed font-medium">
                            "We bring hope to the hopeless, we help the needy." A registered charity organization dedicated to visiting children's homes, the aged, and street families—encouraging, cooking together, and providing life-changing mentorship.
                        </p>

                        <div className="pt-2 flex flex-wrap gap-2 text-xs">
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-white font-medium border border-white/20">
                                Vision: Empowering communities, amplifying voices
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-white font-medium border border-white/20">
                                Mission: Uplifting lives through compassion, service & love
                            </span>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-bold text-white mb-4 text-base tracking-wide flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-[#b8240d] rounded-full inline-block"></span>
                            Quick Navigation
                        </h4>
                        <ul className="space-y-2.5 text-sm text-slate-200">
                            <li><Link href="/" className="hover:text-[#CCB88B] hover:underline transition-colors">Home</Link></li>
                            <li><Link href="/about" className="hover:text-[#CCB88B] hover:underline transition-colors">About Our Cause</Link></li>
                            <li><Link href="/upcoming-events" className="hover:text-[#CCB88B] hover:underline transition-colors">Upcoming Outreach Events</Link></li>
                            <li><Link href="/past-events" className="hover:text-[#CCB88B] hover:underline transition-colors">Past Event Gallery</Link></li>
                            <li><Link href="/my-requests" className="hover:text-[#CCB88B] hover:underline transition-colors">My Bookings & Pledges</Link></li>
                            <li><Link href="/blog" className="hover:text-[#CCB88B] hover:underline transition-colors">Community Stories & Reviews</Link></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="font-bold text-white mb-4 text-base tracking-wide flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-[#b8240d] rounded-full inline-block"></span>
                            Offices & Contacts
                        </h4>
                        <ul className="space-y-3 text-sm text-slate-200">
                            <li className="flex items-start gap-2.5">
                                <MapPin className="h-4 w-4 text-[#CCB88B] mt-1 shrink-0" />
                                <span><strong>Headquarter Office:</strong> Nairobi, Kenya</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <Phone className="h-4 w-4 text-[#CCB88B] mt-1 shrink-0" />
                                <div>
                                    <p className="font-semibold text-white">The Voice of Hope Support:</p>
                                    <a href="tel:+254798182108" className="hover:text-[#CCB88B] block transition-colors">+254 798 182 108</a>
                                    <a href="tel:+254798332690" className="hover:text-[#CCB88B] block transition-colors">+254 798 332 690</a>
                                </div>
                            </li>
                            <li className="flex items-center gap-2.5">
                                <Mail className="h-4 w-4 text-[#CCB88B] shrink-0" />
                                <a href="mailto:info@theevoiceofhope.org" className="hover:text-[#CCB88B] transition-colors">info@theevoiceofhope.org</a>
                            </li>
                        </ul>
                    </div>

                    {/* Supported & Managed By */}
                    <div>
                        <h4 className="font-bold text-white mb-4 text-base tracking-wide flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-[#b8240d] rounded-full inline-block"></span>
                            Managed & Supported By
                        </h4>
                        <div className="space-y-2 text-xs text-slate-200">
                            <p className="font-semibold text-[#CCB88B]">Under the support of:</p>
                            <ul className="space-y-1.5">
                                <li className="flex items-center gap-1.5 hover:text-[#CCB88B]">
                                    <ExternalLink className="h-3 w-3 text-[#CCB88B]" />
                                    <span>Worlducation.world</span>
                                </li>
                                <li className="flex items-center gap-1.5 hover:text-[#CCB88B]">
                                    <ExternalLink className="h-3 w-3 text-[#CCB88B]" />
                                    <span>LookinGlass Technologies</span>
                                </li>
                                <li className="flex items-center gap-1.5 hover:text-[#CCB88B]">
                                    <ExternalLink className="h-3 w-3 text-[#CCB88B]" />
                                    <span>Electrocare</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Partner Badges Strip */}
                <div className="border-t border-white/10 pt-8 pb-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-300">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-[#CCB88B]" />
                            <span>Motto: <strong className="text-white">EverythingGoodForHumanity</strong> | Wings of UbuntuAfrica - I Am Because We Are</span>
                        </div>
                        <div className="flex gap-4">
                            <Link href="/terms" className="hover:text-white">Terms of Service</Link>
                            <span>•</span>
                            <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
                            <span>•</span>
                            <Link href="/compliance" className="hover:text-white">Compliance Policy</Link>
                        </div>
                    </div>
                </div>

                {/* Signature Bottom Bar */}
                <div className="border-t border-white/10 pt-6 text-center text-xs text-slate-300 leading-relaxed">
                    <p className="font-medium">
                        © {new Date().getFullYear()} <strong>The Voice of Hope Center - Hope for the Future</strong>. All rights reserved.
                    </p>
                    <p className="mt-1 text-slate-300">
                        Website designed and coded under <strong>Worlducationcentre</strong> by <strong>Electrocare</strong> under supervision of <strong>LookinGlass Technologies</strong> &amp; <strong>UbuntuAfrica</strong>.
                    </p>
                </div>
            </div>
        </footer>
    );
}
