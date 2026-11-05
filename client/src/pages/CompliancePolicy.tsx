import React from 'react';
import { ShieldCheck, Lock, Scale, HeartHandshake, Baby, Mail, Phone, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function CompliancePolicy() {
    return (
        <div className="min-h-screen bg-background text-foreground py-16 px-4">
            <div className="container mx-auto max-w-4xl space-y-10">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider border border-primary/20">
                        <ShieldCheck className="w-4 h-4 text-[#b8240d]" />
                        Governance & Ethics
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground">
                        Compliance & Child Safeguarding Policy
                    </h1>
                    <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
                        At <strong>The Voice of Hope Kenya</strong>, we are committed to conducting all charity outreach operations, fundraising, and community visits with the highest integrity, transparency, and full compliance with Kenyan and international non-profit regulations.
                    </p>
                </div>

                <Card className="border-l-4 border-l-[#b8240d] bg-card border-border shadow-md rounded-2xl">
                    <CardContent className="p-6">
                        <h2 className="text-xl font-bold text-foreground mb-2">Our Institutional Commitment</h2>
                        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                            The Voice of Hope Kenya maintains strict ethical standards across every visit to children's homes, elderly care centers, and street family communities. All volunteers, donors, mentors, partners, and organizers are required to uphold these standards at all times.
                        </p>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-card border-border rounded-2xl shadow-sm">
                        <CardContent className="p-6 space-y-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                <Baby className="w-5 h-5 text-[#b8240d]" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground">Child Safeguarding & Dignity</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                The safety, dignity, and emotional well-being of orphaned and vulnerable children is our highest priority. All in-person volunteers and adoption inquiries undergo strict vetting and supervision during outreach visits.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border rounded-2xl shadow-sm">
                        <CardContent className="p-6 space-y-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                <Scale className="w-5 h-5 text-[#b8240d]" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground">Financial & Donation Integrity</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Every financial contribution, installment pledge, and in-kind donation (food, clothing, books, electronics) is logged transparently and directed 100% toward approved community outreach budgets.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border rounded-2xl shadow-sm">
                        <CardContent className="p-6 space-y-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                <Lock className="w-5 h-5 text-[#b8240d]" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground">Data Protection & Donor Privacy</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                We strictly adhere to the Kenya Data Protection Act and international privacy standards. Supporter contact details and payment records are encrypted and never sold or shared with unauthorized third parties.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border rounded-2xl shadow-sm">
                        <CardContent className="p-6 space-y-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                <HeartHandshake className="w-5 h-5 text-[#b8240d]" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground">Anti-Discrimination & Inclusivity</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Guided by our motto <em>"EverythingGoodForHumanity"</em>, we serve vulnerable communities and welcome volunteers regardless of background, ethnicity, gender, or creed, fostering a safe and respectful environment for all.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="bg-muted/40 border-border rounded-2xl">
                    <CardContent className="p-6 sm:p-8 space-y-4">
                        <h2 className="text-2xl font-bold text-foreground">Reporting Compliance Concerns</h2>
                        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                            If you observe or suspect any violation of our child safeguarding rules, financial integrity standards, or volunteer code of conduct, please report it immediately to our Nairobi Headquarters compliance desk. All reports are handled confidentially.
                        </p>
                        <div className="flex flex-wrap gap-6 pt-2 text-sm text-foreground font-medium">
                            <a href="mailto:info@theevoiceofhope.org" className="inline-flex items-center gap-2 text-primary hover:underline">
                                <Mail className="w-4 h-4 text-[#b8240d]" />
                                info@theevoiceofhope.org
                            </a>
                            <a href="tel:+254798182108" className="inline-flex items-center gap-2 text-primary hover:underline">
                                <Phone className="w-4 h-4 text-[#b8240d]" />
                                +254 798 182 108 / +254 798 332 690
                            </a>
                            <span className="inline-flex items-center gap-2 text-muted-foreground">
                                <MapPin className="w-4 h-4 text-[#b8240d]" />
                                Nairobi, Kenya Headquarters
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
