import { z } from 'zod';

export const insertEventSchema = z.object({
    title: z.string().min(1, "Title is required"),
    theme: z.string().optional(),
    description: z.string().min(1, "Description is required"),
    date: z.string(),
    location: z.string(),
    price: z.coerce.number().min(0).default(0),
    heroImageUrl: z.string().optional(),
    imageUrls: z.array(z.string()).default([]),
    activities: z.array(z.any()).optional().default([]),
    features: z.array(z.any()).optional().default([]),
    speakers: z.array(z.any()).optional().default([]),
    journey: z.any().optional().default({}),
    faqs: z.array(z.any()).optional().default([]),
    type: z.enum(['PHYSICAL', 'VIRTUAL', 'BOTH']).default('PHYSICAL'),
    meeting_link: z.string().optional(),
    target_amount: z.coerce.number().optional().default(0),
    accepted_contributions: z.array(z.string()).default([
        "Money / Financial Donation",
        "Food & Groceries",
        "Clothing & Warm wear",
        "Learning materials & Books",
        "Electronics",
        "Laptops",
        "Phones",
        "Computers",
        "Shoes",
        "Utensils & Household",
        "Self (In-Person Presence)"
    ]),
    volunteer_roles: z.array(z.string()).default([
        "Work in kitchen (cook together)",
        "Play games & sports",
        "Mingle with kids & mentorship",
        "Seek to adopt (adoption orientation inquiry)"
    ]),
    organizer_contact: z.string().optional().default("+254 798 182 108 / +254 798 332 690"),
    youtube_video_url: z.string().optional(),
});

export type InsertEvent = z.infer<typeof insertEventSchema>;

export interface EventActivity {
    day: number;
    date: string;
    items: {
        time?: string;
        title: string;
        description: string;
    }[];
}

export interface EventSpeaker {
    name: string;
    role: string;
    bio: string;
    imageUrl?: string;
}

export interface EventFAQ {
    question: string;
    answer: string;
}

export interface Event extends InsertEvent {
    id: string;
    activities: EventActivity[];
    speakers: EventSpeaker[];
    faqs: EventFAQ[];
    journey: any;
    createdAt?: string;
}

export interface PledgeInstallment {
    amount: number;
    date: string;
    method: string;
    receipt?: string;
}

export interface Booking {
    id: string;
    userId?: string | null;
    eventId?: string | null;
    guest_name?: string | null;
    guest_email?: string | null;
    guest_phone?: string | null;
    category: string;
    amountPaid: number;
    pledged_amount?: number;
    is_pledge?: boolean;
    reminder_frequency?: 'DAILY' | 'EVERY_3_DAYS' | 'WEEKLY';
    pledge_due_date?: string | null;
    last_reminder_sent_at?: string | null;
    installment_history?: PledgeInstallment[];
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED';
    payment_status?: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'PENDING_CASH_ON_ARRIVAL';
    payment_method?: string;
    currency?: string;
    phone_number?: string;
    mpesa_receipt?: string;
    mode: 'PHYSICAL' | 'VIRTUAL';
    attendance_type?: 'ATTENDING' | 'DONATING_ONLY';
    delivery_method?: 'ONLINE_DELIVERY' | 'IN_PERSON_EVENT_DAY';
    item_contributions?: string[];
    volunteer_activities?: string[];
    mingle_notes?: string;
    seek_to_adopt?: boolean;
    wish_note?: string;
    createdAt: string;
    event?: Event;
    Event?: Event;
    user?: User;
    User?: User;
}

export const insertTestimonialSchema = z.object({
    content: z.string().min(5, "Review must be at least 5 characters"),
    rating: z.coerce.number().min(1).max(5).default(5),
    authorName: z.string().optional(),
    authorRole: z.string().optional().default("Supporter"),
    authorAvatar: z.string().optional(),
});

export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;

export interface Testimonial extends InsertTestimonial {
    id: string;
    authorId: string;
    status: 'PENDING' | 'APPROVED';
    createdAt: string;
    user?: User;
}

export interface User {
    id: string;
    email: string;
    name: string;
    phone?: string;
    country?: string;
    city?: string;
    address?: string;
    role: 'USER' | 'ADMIN';
    createdAt?: string;
    updatedAt?: string;
}

export const insertBlogPostSchema = z.object({
    title: z.string().min(1, "Title is required"),
    content: z.string().min(1, "Content is required"),
    imageUrl: z.string().optional(),
    authorId: z.string(),
});

export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;

export interface BlogPost extends InsertBlogPost {
    id: string;
    createdAt: string;
    updatedAt: string;
}

// Live Support
export const insertSupportMessageSchema = z.object({
    conversationId: z.string(),
    message: z.string().min(1, "Message cannot be empty"),
    senderRole: z.enum(['USER', 'ADMIN', 'GUEST']).default('USER'),
    senderName: z.string().min(1, "Sender name is required"),
});

export type InsertSupportMessage = z.infer<typeof insertSupportMessageSchema>;

export interface SupportMessage {
    id: string;
    conversationId: string;
    senderId?: string | null;
    senderRole: 'USER' | 'ADMIN' | 'GUEST';
    senderName: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

export interface SupportConversation {
    id: string;
    userId?: string | null;
    guestName?: string | null;
    guestEmail?: string | null;
    guestSessionId?: string | null;
    status: 'OPEN' | 'PENDING' | 'RESOLVED';
    unreadUserCount: number;
    unreadAdminCount: number;
    lastMessageAt: string;
    createdAt: string;
    updatedAt: string;
    user?: User;
    messages?: SupportMessage[];
}
