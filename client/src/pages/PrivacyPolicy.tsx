import React from 'react';
import { Lock, Shield, Heart, Bell, Mail, Phone, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-background text-foreground py-16 px-4">
            <div className="container mx-auto max-w-4xl space-y-10">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider border border-primary/20">
                        <Lock className="w-4 h-4 text-[#b8240d]" />
                        Privacy & Donor Protection
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground">
                        Privacy & Contribution Policy
                    </h1>
                    <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
                        <strong>The Voice of Hope Kenya</strong> (hereinafter referred to as “The Voice of Hope,” “we,” “our,” or “us”) values your privacy and is committed to safeguarding your personal information. This policy outlines how we collect, use, and protect the data you provide when visiting our platform, donating, making an installment pledge, or registering for charity outreach events.
                    </p>
                </div>

                <div className="space-y-8">
                    <section className="space-y-3">
                        <h2 className="text-2xl font-bold text-foreground">1. Information We Collect</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Whether you contribute as a registered community member or donate directly as a guest without creating an account, we collect only the minimum information required to process your support and keep you informed:
                        </p>
                        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                            <li><strong>Supporter & Volunteer Details:</strong> Your name, email address, phone number, and optional physical address when you register for an account, book in-person outreach attendance, or make a guest donation.</li>
                            <li><strong>Donation & Pledge Records:</strong> Selected contribution items (financial donations, food, clothing, learning materials, electronics), pledge installment schedules, and M-Pesa/Stripe/PayPal transaction references.</li>
                            <li><strong>Session & Technical Data:</strong> Essential cookies used to maintain secure authentication sessions and theme preferences (Light/Dark mode).</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-bold text-foreground">2. Secure Payment Processing</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            When you make a financial donation or pay a pledge installment on our platform, your payment is processed securely through accredited payment gateways:
                        </p>
                        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                            <li><strong>Lipa Na M-Pesa (Safaricom Daraja API):</strong> Your phone number is used strictly to trigger the official STK Push prompt and verify your M-Pesa receipt number.</li>
                            <li><strong>Debit / Credit Cards (Stripe) & PayPal:</strong> Card and PayPal credentials are encrypted and handled directly by Stripe and PayPal over PCI-DSS compliant connections. The Voice of Hope Kenya never stores raw card numbers or PINs.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-bold text-foreground">3. Pledge Reminders & Communications</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            If you choose to <strong>Make a Pledge</strong> and pay in bits (installments) toward an upcoming outreach event, we use your account or contact details to deliver scheduled countdown reminders (Daily, Every 3 Days, or Weekly) showing your remaining pledge balance and time left until event day. You may adjust your reminder frequency or fulfill your pledge at any time.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-bold text-foreground">4. Children's Privacy & Media Protection</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Our platform is designed for donors, volunteers, and community supporters. We do not knowingly collect personal data from children under 13. All outreach photography from children's homes and community visits is shared strictly with institutional consent to document charitable impact.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-bold text-foreground">5. Information Sharing & Disclosure</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            The Voice of Hope Kenya does not sell, rent, or trade donor lists or personal information. Information is shared only with trusted payment processors (Safaricom M-Pesa, Stripe, PayPal) to complete your transactions or when required by Kenyan law.
                        </p>
                    </section>

                    <hr className="border-border my-8" />

                    <section className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                            <Heart className="w-3.5 h-3.5 text-[#b8240d]" />
                            Charitable Contributions & Pledges
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black text-foreground">
                            Donation, Pledge & Refund Policy
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            All monetary contributions and installment payments made to The Voice of Hope Kenya directly fund food rations, cooking ingredients, clothing, educational materials, and logistics for vulnerable children, the aged, and street families.
                        </p>
                        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                            <li><strong>Voluntary Charitable Giving:</strong> Supporters may donate any amount they are willing to give—either as a one-time contribution, in-person cash on event day, or through flexible installment pledges ("payment in bits").</li>
                            <li><strong>Refunds for Duplicate or Erroneous Transactions:</strong> Charitable donations are generally non-refundable once deployed to outreach operations. However, if an erroneous or duplicate payment occurs, please contact us within 7 days of the transaction with your receipt reference (`M-Pesa Receipt`, `Stripe/PayPal Order ID`, or `Booking ID`) for prompt verification and resolution.</li>
                            <li><strong>Pledge Adjustments:</strong> Pledges are voluntary commitments of support. If your circumstances change, you may update or close an open pledge at any time by contacting our support desk.</li>
                        </ul>
                    </section>

                    <Card className="bg-muted/40 border-border rounded-2xl mt-8">
                        <CardContent className="p-6 sm:p-8 space-y-4">
                            <h2 className="text-2xl font-bold text-foreground">Contact Our Privacy & Support Desk</h2>
                            <p className="text-muted-foreground text-sm sm:text-base">
                                To update your personal information, inquire about a donation receipt, or ask questions regarding this policy, please reach out to us:
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
                                    Nairobi, Kenya Headquarters
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
