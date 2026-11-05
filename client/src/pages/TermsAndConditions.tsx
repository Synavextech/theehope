import React from 'react';
import { FileText, Heart, CheckCircle2, Mail, Phone, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function TermsAndConditions() {
    return (
        <div className="min-h-screen bg-background text-foreground py-16 px-4">
            <div className="container mx-auto max-w-4xl space-y-10">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider border border-primary/20">
                        <FileText className="w-4 h-4 text-[#b8240d]" />
                        Terms of Service
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground">
                        Terms and Conditions
                    </h1>
                    <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
                        Welcome to <strong>The Voice of Hope Kenya</strong>. These Terms and Conditions govern your use of our website, donation and pledge services, and volunteer registration for community outreach events across Kenya.
                    </p>
                </div>

                <div className="space-y-8">
                    <section className="space-y-3">
                        <h2 className="text-2xl font-bold text-foreground">1. Mission & Platform Purpose</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            The Voice of Hope Kenya is a registered charitable organization headquartered in Nairobi, Kenya. Our platform enables supporters around the world to join in-person outreach visits to children's homes, elderly care centers, and street family communities, or to contribute financial and material donations.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-bold text-foreground">2. Donations, Guest Contributions & Pledges</h2>
                        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                            <li><strong>Open Voluntary Amounts:</strong> Contributors are free to donate any amount they are willing to give toward an outreach event or general charity operations.</li>
                            <li><strong>Account-Free & Registered Giving:</strong> You may donate or make a pledge with or without creating a user account. Creating an account additionally provides a unified dashboard to view all historical receipts and manage installment pledges.</li>
                            <li><strong>Installment Pledges ("Payment in Bits"):</strong> When you make a pledge, you may pay your pledged total in partial installments at your convenience prior to or on the outreach event date. Regular countdown reminders will be delivered according to your chosen reminder schedule.</li>
                            <li><strong>In-Kind Contributions:</strong> Physical donations (food, clothes, shoes, books, laptops, phones, utensils) may be brought in person on the event day or delivered to our Nairobi coordination office.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-bold text-foreground">3. Volunteer Code of Conduct</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Attendees participating in person (cooking together, playing games, mentoring youth, or inquiring about legal adoption orientation) agree to treat all children, elderly citizens, street families, and fellow volunteers with utmost respect, compassion, and safety compliance.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-bold text-foreground">4. Intellectual Property & Community Stories</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Unless otherwise stated, The Voice of Hope Kenya owns the intellectual property rights for platform content and official outreach media. When you submit a community review or blog story, you grant us permission to display your testimonial on our platform to inspire fellow supporters.
                        </p>
                    </section>

                    <Card className="bg-muted/40 border-border rounded-2xl">
                        <CardContent className="p-6 sm:p-8 space-y-4">
                            <h2 className="text-2xl font-bold text-foreground">5. Contact Information</h2>
                            <p className="text-muted-foreground text-sm sm:text-base">
                                If you have any questions about these Terms and Conditions, please contact our Nairobi Headquarters:
                            </p>
                            <div className="flex flex-wrap gap-6 pt-2 text-sm font-medium">
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
                                    Nairobi, Kenya
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
