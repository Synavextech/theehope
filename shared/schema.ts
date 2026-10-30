import { z } from 'zod';

export const insertEventSchema = z.object({
    title: z.string().min(1, "Title is required"),
    theme: z.string().optional(),
    description: z.string().min(1, "Description is required"),
    date: z.string(),
    location: z.string(),
    price: z.coerce.number().min(0),
    heroImageUrl: z.string().optional(),
    imageUrls: z.array(z.string()).default([]),
    activities: z.array(z.any()).optional().default([]),
    alignment: z.any().optional().default({}),
    features: z.array(z.any()).optional().default([]),
    speakers: z.array(z.any()).optional().default([]),
    journey: z.any().optional().default({}),
    faqs: z.array(z.any()).optional().default([]),
    self_funded_seats: z.number().default(0),
    partially_funded_seats: z.number().default(0),
    fully_funded_seats: z.number().default(0),
    benefits: z.array(z.any()).default([]),
    requires_proposal: z.boolean().default(false),
    type: z.enum(['PHYSICAL', 'VIRTUAL', 'BOTH']).default('PHYSICAL'),
    meeting_link: z.string().optional(),
    target_amount: z.coerce.number().optional().default(0),
    accepted_contributions: z.array(z.string()).default([
        "Money", "Food", "Clothing", "Finances", "Learning materials", "Electronics", "Laptops", "Phones", "Computers", "Shoes", "Utensils", "Self"
    ]),
    volunteer_roles: z.array(z.string()).default([
        "Work in kitchen", "Play games", "Mingle with kids", "Seek to adopt"
    ]),
    organizer_contact: z.string().optional().default("+254798182108 / +254798332690"),
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
    alignment: any;
    journey: any;
    createdAt?: string;
}

export interface Booking {
    id: string;
    userId: string;
    eventId: string;
    category: string;
    amountPaid: number;
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED';
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
    user?: User;
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

export interface VisaInvitation {
    id: string;
    userId: string;
    eventId: string;
    status: 'PENDING' | 'PAID' | 'APPROVED' | 'REJECTED';
    amountPaid: number;
    paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
    letterUrl?: string;
    createdAt: string;
    updatedAt: string;
    user?: User;
    event?: Event;
}

// Proposals
export const insertProposalSchema = z.object({
    eventId: z.string(),
    description: z.string().min(50, "Description must be at least 50 characters"),
    documentUrl: z.string().optional(),
});

export interface Proposal {
    id: string;
    userId: string;
    eventId: string;
    description: string;
    documentUrl?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    autoApproveAt?: string;
    createdAt: string;
    updatedAt: string;
    user?: User;
    event?: Event;
}

// Applications
export const insertApplicationSchema = z.object({
    type: z.enum(['SPEAKER', 'SPONSOR', 'NEXTGEN', 'GLOBAL_FORUM']),
    description: z.string().min(50, "Description must be at least 50 characters"),
    documentUrl: z.string().optional(),
    donationAmount: z.number().min(100, "Minimum donation is KES 100"),
});

export interface Application {
    id: string;
    userId: string;
    type: 'SPEAKER' | 'SPONSOR' | 'NEXTGEN' | 'GLOBAL_FORUM';
    description: string;
    documentUrl?: string;
    donationAmount: number;
    paymentStatus: 'PENDING' | 'PAID';
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
    updatedAt: string;
    user?: User;
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

