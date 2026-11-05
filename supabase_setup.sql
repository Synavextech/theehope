-- ==============================================================================
-- THE VOICE OF HOPE KENYA - CONSOLIDATED PRODUCTION DATABASE SCHEMA & MIGRATION
-- Optimized for Charity Outreach, Guest & Member Donations, Installment Pledges,
-- M-Pesa Daraja STK Push, Stripe, PayPal, and Row Level Security (RLS).
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('event-media', 'event-media', true),
  ('user-documents', 'user-documents', false),
  ('documents', 'documents', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- 3. ENUMS
DO $$ BEGIN
    CREATE TYPE role AS ENUM ('USER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. DROP LEGACY UNUSED TABLES & COLUMNS (Safe Cleanup)
DROP TABLE IF EXISTS "VisaInvitation" CASCADE;
DROP TABLE IF EXISTS "Proposals" CASCADE;
DROP TABLE IF EXISTS "Applications" CASCADE;

-- 5. TABLES

-- Users table
CREATE TABLE IF NOT EXISTS "User" (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    country TEXT,
    city TEXT,
    address TEXT,
    role role DEFAULT 'USER',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table (Streamlined for Charity Outreach)
CREATE TABLE IF NOT EXISTS "Event" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    theme TEXT,
    description TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT NOT NULL,
    price DECIMAL(12,2) NOT NULL DEFAULT 0,
    "target_amount" DECIMAL(12,2) DEFAULT 0,
    currency TEXT DEFAULT 'KES',
    "heroImageUrl" TEXT,
    "imageUrls" TEXT[] DEFAULT '{}',
    "accepted_contributions" JSONB DEFAULT '["Money", "Food", "Clothing", "Finances", "Learning materials", "Electronics", "Laptops", "Phones", "Computers", "Shoes", "Utensils", "Self"]'::JSONB,
    "volunteer_roles" JSONB DEFAULT '["Work in kitchen", "Play games", "Mingle with kids", "Seek to adopt"]'::JSONB,
    "organizer_contact" TEXT DEFAULT '+254 798 182 108 / +254 798 332 690',
    "youtube_video_url" TEXT,
    activities JSONB DEFAULT '[]',
    features JSONB DEFAULT '[]',
    speakers JSONB DEFAULT '[]',
    journey JSONB DEFAULT '{}',
    faqs JSONB DEFAULT '[]',
    type TEXT DEFAULT 'PHYSICAL',
    meeting_link TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure columns exist on existing Event table and drop legacy seat/proposal/alignment columns
ALTER TABLE "Event" DROP COLUMN IF EXISTS "self_funded_seats";
ALTER TABLE "Event" DROP COLUMN IF EXISTS "partially_funded_seats";
ALTER TABLE "Event" DROP COLUMN IF EXISTS "fully_funded_seats";
ALTER TABLE "Event" DROP COLUMN IF EXISTS "requires_proposal";
ALTER TABLE "Event" DROP COLUMN IF EXISTS "alignment";
ALTER TABLE "Event" DROP COLUMN IF EXISTS "benefits";
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "target_amount" DECIMAL(12,2) DEFAULT 0;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'KES';
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "heroImageUrl" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "accepted_contributions" JSONB DEFAULT '["Money", "Food", "Clothing", "Finances", "Learning materials", "Electronics", "Laptops", "Phones", "Computers", "Shoes", "Utensils", "Self"]'::JSONB;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "volunteer_roles" JSONB DEFAULT '["Work in kitchen", "Play games", "Mingle with kids", "Seek to adopt"]'::JSONB;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "organizer_contact" TEXT DEFAULT '+254 798 182 108 / +254 798 332 690';
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "youtube_video_url" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "type" TEXT DEFAULT 'PHYSICAL';
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "meeting_link" TEXT;

-- Bookings table (Supports Authenticated Members, Account-Free Guests, and Installment Pledges)
CREATE TABLE IF NOT EXISTS "Booking" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
    "eventId" UUID REFERENCES "Event"(id) ON DELETE CASCADE,
    category TEXT NOT NULL DEFAULT 'ATTENDEE_CONTRIBUTOR',
    "amountPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "pledged_amount" DECIMAL(12,2) DEFAULT 0,
    "is_pledge" BOOLEAN DEFAULT FALSE,
    "reminder_frequency" TEXT DEFAULT 'NONE', -- 'DAILY', 'EVERY_3_DAYS', 'WEEKLY', 'NONE'
    "pledge_due_date" TIMESTAMP WITH TIME ZONE,
    "last_reminder_sent_at" TIMESTAMP WITH TIME ZONE,
    "installment_history" JSONB DEFAULT '[]'::JSONB,
    "guest_name" TEXT,
    "guest_email" TEXT,
    "guest_phone" TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'CONFIRMED', 'PLEDGED', 'CANCELLED'
    mode TEXT DEFAULT 'PHYSICAL',
    attendance_type TEXT DEFAULT 'ATTENDING', -- 'ATTENDING' or 'DONATING_ONLY'
    delivery_method TEXT DEFAULT 'IN_PERSON_EVENT_DAY', -- 'IN_PERSON_EVENT_DAY' or 'ONLINE_DELIVERY'
    item_contributions JSONB DEFAULT '[]'::JSONB,
    volunteer_activities JSONB DEFAULT '[]'::JSONB,
    mingle_notes TEXT,
    seek_to_adopt BOOLEAN DEFAULT FALSE,
    wish_note TEXT,
    payment_method TEXT DEFAULT 'MPESA', -- 'MPESA', 'CASH_EVENT_DAY', 'STRIPE', 'PAYPAL', 'PLEDGE'
    payment_status TEXT DEFAULT 'PENDING', -- 'PENDING', 'PAID', 'PARTIAL_PLEDGE', 'PENDING_CASH_ON_ARRIVAL'
    currency TEXT DEFAULT 'KES',
    phone_number TEXT,
    mpesa_receipt TEXT,
    mpesa_checkout_request_id TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure Booking columns & nullable userId for guest donations
ALTER TABLE "Booking" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "Booking" ALTER COLUMN "eventId" DROP NOT NULL;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "pledged_amount" DECIMAL(12,2) DEFAULT 0;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "is_pledge" BOOLEAN DEFAULT FALSE;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "reminder_frequency" TEXT DEFAULT 'NONE';
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "pledge_due_date" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "last_reminder_sent_at" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "installment_history" JSONB DEFAULT '[]'::JSONB;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "guest_name" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "guest_email" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "guest_phone" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "mode" TEXT DEFAULT 'PHYSICAL';
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "attendance_type" TEXT DEFAULT 'ATTENDING';
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "delivery_method" TEXT DEFAULT 'IN_PERSON_EVENT_DAY';
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "item_contributions" JSONB DEFAULT '[]'::JSONB;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "volunteer_activities" JSONB DEFAULT '[]'::JSONB;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "mingle_notes" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "seek_to_adopt" BOOLEAN DEFAULT FALSE;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "wish_note" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "payment_method" TEXT DEFAULT 'MPESA';
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "payment_status" TEXT DEFAULT 'PENDING';
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'KES';
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "phone_number" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "mpesa_receipt" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "mpesa_checkout_request_id" TEXT;

-- M-Pesa Transactions Audit Log Table
CREATE TABLE IF NOT EXISTS "MpesaTransaction" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "bookingId" UUID REFERENCES "Booking"(id) ON DELETE SET NULL,
    "userId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
    "merchantRequestId" TEXT,
    "checkoutRequestId" TEXT UNIQUE,
    "responseCode" TEXT,
    "responseDescription" TEXT,
    "customerMessage" TEXT,
    "phoneNumber" TEXT,
    "amount" DECIMAL(12,2),
    "mpesaReceiptNumber" TEXT,
    "transactionDate" TEXT,
    "resultCode" INTEGER,
    "resultDesc" TEXT,
    status TEXT DEFAULT 'PENDING', -- 'PENDING', 'COMPLETED', 'FAILED'
    "rawCallback" JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- BlogPosts table
CREATE TABLE IF NOT EXISTS "BlogPost" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    "imageUrl" TEXT,
    "authorId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Testimonials table
CREATE TABLE IF NOT EXISTS "Testimonial" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    "authorId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    rating INTEGER DEFAULT 5,
    status TEXT DEFAULT 'APPROVED',
    "authorName" TEXT,
    "authorRole" TEXT DEFAULT 'Supporter',
    "authorAvatar" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS "Notification" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'INFO',
    "isRead" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wallets table
CREATE TABLE IF NOT EXISTS "Wallet" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    balance DECIMAL(12,2) DEFAULT 0,
    currency TEXT DEFAULT 'KES',
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stats table
CREATE TABLE IF NOT EXISTS "Stats" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "eventsAttended" INTEGER DEFAULT 0,
    "blogPostsCount" INTEGER DEFAULT 0,
    "points" INTEGER DEFAULT 0,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- IdentityVerification table
CREATE TABLE IF NOT EXISTS "IdentityVerification" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'PENDING',
    "documentUrls" TEXT[] DEFAULT '{}',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SupportConversations table
CREATE TABLE IF NOT EXISTS "SupportConversation" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID REFERENCES "User"(id) ON DELETE CASCADE,
    "guestName" TEXT,
    "guestEmail" TEXT,
    "guestSessionId" TEXT,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'PENDING', 'RESOLVED')),
    "unreadUserCount" INTEGER DEFAULT 0,
    "unreadAdminCount" INTEGER DEFAULT 0,
    "lastMessageAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SupportMessages table
CREATE TABLE IF NOT EXISTS "SupportMessage" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "conversationId" UUID NOT NULL REFERENCES "SupportConversation"(id) ON DELETE CASCADE,
    "senderId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
    "senderRole" TEXT NOT NULL DEFAULT 'USER' CHECK ("senderRole" IN ('USER', 'ADMIN', 'GUEST')),
    "senderName" TEXT NOT NULL,
    message TEXT NOT NULL,
    "isRead" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. INDEXES
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_event_date ON "Event"(date);
CREATE INDEX IF NOT EXISTS idx_booking_user_id ON "Booking"("userId");
CREATE INDEX IF NOT EXISTS idx_booking_event_id ON "Booking"("eventId");
CREATE INDEX IF NOT EXISTS idx_booking_guest_phone ON "Booking"("guest_phone");
CREATE INDEX IF NOT EXISTS idx_booking_is_pledge ON "Booking"("is_pledge");
CREATE INDEX IF NOT EXISTS idx_blog_post_author_id ON "BlogPost"("authorId");
CREATE INDEX IF NOT EXISTS idx_testimonial_author_id ON "Testimonial"("authorId");
CREATE INDEX IF NOT EXISTS idx_support_conv_user_id ON "SupportConversation"("userId");
CREATE INDEX IF NOT EXISTS idx_support_conv_guest_id ON "SupportConversation"("guestSessionId");
CREATE INDEX IF NOT EXISTS idx_support_conv_status ON "SupportConversation"(status);
CREATE INDEX IF NOT EXISTS idx_support_msg_conv_id ON "SupportMessage"("conversationId");
CREATE INDEX IF NOT EXISTS idx_support_msg_created_at ON "SupportMessage"("createdAt");

-- 7. FUNCTIONS & TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_updated_at ON "User";
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_updated_at ON "Event";
CREATE TRIGGER update_event_updated_at BEFORE UPDATE ON "Event" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_blog_post_updated_at ON "BlogPost";
CREATE TRIGGER update_blog_post_updated_at BEFORE UPDATE ON "BlogPost" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wallet_updated_at ON "Wallet";
CREATE TRIGGER update_wallet_updated_at BEFORE UPDATE ON "Wallet" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stats_updated_at ON "Stats";
CREATE TRIGGER update_stats_updated_at BEFORE UPDATE ON "Stats" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_identity_verification_updated_at ON "IdentityVerification";
CREATE TRIGGER update_identity_verification_updated_at BEFORE UPDATE ON "IdentityVerification" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_support_conversation_updated_at ON "SupportConversation";
CREATE TRIGGER update_support_conversation_updated_at BEFORE UPDATE ON "SupportConversation" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- New User Handler Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_name TEXT;
    user_phone TEXT;
    user_country TEXT;
    user_city TEXT;
    user_address TEXT;
BEGIN
    user_name := COALESCE(NEW.raw_user_meta_data->>'name', 'User');
    user_phone := NEW.raw_user_meta_data->>'phone';
    user_country := NEW.raw_user_meta_data->>'country';
    user_city := NEW.raw_user_meta_data->>'city';
    user_address := NEW.raw_user_meta_data->>'address';

    INSERT INTO public."User" (id, email, name, role, phone, country, city, address)
    VALUES (NEW.id, NEW.email, user_name, 'USER', user_phone, user_country, user_city, user_address)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public."Wallet" ("userId") VALUES (NEW.id) ON CONFLICT DO NOTHING;
    INSERT INTO public."Stats" ("userId") VALUES (NEW.id) ON CONFLICT DO NOTHING;
    
    INSERT INTO public."Notification" ("userId", title, message, type)
    VALUES (NEW.id, 'Welcome to The Voice of Hope Kenya!', 'Thank you for joining our charity family! Together we bring hope to the hopeless and help the needy.', 'WELCOME');
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. ENABLE RLS
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MpesaTransaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BlogPost" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Testimonial" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Wallet" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Stats" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IdentityVerification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SupportConversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SupportMessage" ENABLE ROW LEVEL SECURITY;

-- 9. SECURITY HELPER FUNCTION
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public."User"
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 10. RLS POLICIES

-- >>> USERS
DROP POLICY IF EXISTS "Users can read own data" ON "User";
DROP POLICY IF EXISTS "Users can update own profile" ON "User";
DROP POLICY IF EXISTS "Admins can read all users" ON "User";

CREATE POLICY "Users can read own data" ON "User" FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON "User" FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can read all users" ON "User" FOR SELECT USING (is_admin());

-- >>> EVENTS
DROP POLICY IF EXISTS "Public events are viewable by everyone" ON "Event";
DROP POLICY IF EXISTS "Admins can manage all events" ON "Event";

CREATE POLICY "Public events are viewable by everyone" ON "Event" FOR SELECT USING (true);
CREATE POLICY "Admins can manage all events" ON "Event" FOR ALL USING (is_admin());

-- >>> BOOKINGS (Supports Authenticated Users, Guest Checkout, and Admins)
DROP POLICY IF EXISTS "Users can read own bookings" ON "Booking";
DROP POLICY IF EXISTS "Users can view own bookings" ON "Booking";
DROP POLICY IF EXISTS "Users can insert own bookings" ON "Booking";
DROP POLICY IF EXISTS "Anyone can insert bookings" ON "Booking";
DROP POLICY IF EXISTS "Users can update own bookings" ON "Booking";
DROP POLICY IF EXISTS "Admins can view all bookings" ON "Booking";
DROP POLICY IF EXISTS "Admins can update all bookings" ON "Booking";
DROP POLICY IF EXISTS "Service role has full access to bookings" ON "Booking";

CREATE POLICY "Users can read own bookings" ON "Booking" FOR SELECT USING (auth.uid() = "userId" OR "userId" IS NULL);
CREATE POLICY "Anyone can insert bookings" ON "Booking" FOR INSERT WITH CHECK (auth.uid() = "userId" OR "userId" IS NULL);
CREATE POLICY "Users can update own bookings" ON "Booking" FOR UPDATE USING (auth.uid() = "userId" OR "userId" IS NULL);
CREATE POLICY "Admins can view all bookings" ON "Booking" FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update all bookings" ON "Booking" FOR UPDATE USING (is_admin());
CREATE POLICY "Service role has full access to bookings" ON "Booking" FOR ALL TO service_role USING (true) WITH CHECK (true);

-- >>> MPESA TRANSACTIONS
DROP POLICY IF EXISTS "Service role has full access to MpesaTransaction" ON "MpesaTransaction";
DROP POLICY IF EXISTS "Users can view own mpesa transactions" ON "MpesaTransaction";

CREATE POLICY "Service role has full access to MpesaTransaction" ON "MpesaTransaction" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can view own mpesa transactions" ON "MpesaTransaction" FOR SELECT TO authenticated USING ("userId" = auth.uid() OR is_admin());

-- >>> NOTIFICATIONS, WALLETS, STATS, IDENTITY VERIFICATION
DROP POLICY IF EXISTS "Users can read own notifications" ON "Notification";
DROP POLICY IF EXISTS "Users can update own notifications" ON "Notification";
DROP POLICY IF EXISTS "Admins can manage all notifications" ON "Notification";
CREATE POLICY "Users can read own notifications" ON "Notification" FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Users can update own notifications" ON "Notification" FOR UPDATE USING (auth.uid() = "userId");
CREATE POLICY "Admins can manage all notifications" ON "Notification" FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Users can read own wallet" ON "Wallet";
DROP POLICY IF EXISTS "Admins can manage all wallets" ON "Wallet";
CREATE POLICY "Users can read own wallet" ON "Wallet" FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Admins can manage all wallets" ON "Wallet" FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Users can read own stats" ON "Stats";
DROP POLICY IF EXISTS "Admins can manage all stats" ON "Stats";
CREATE POLICY "Users can read own stats" ON "Stats" FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Admins can manage all stats" ON "Stats" FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Users can read own identity verification" ON "IdentityVerification";
DROP POLICY IF EXISTS "Users can insert own identity verification" ON "IdentityVerification";
DROP POLICY IF EXISTS "Admins can manage all identity verifications" ON "IdentityVerification";
CREATE POLICY "Users can read own identity verification" ON "IdentityVerification" FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Users can insert own identity verification" ON "IdentityVerification" FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "Admins can manage all identity verifications" ON "IdentityVerification" FOR ALL USING (is_admin());

-- >>> BLOG & TESTIMONIALS
DROP POLICY IF EXISTS "Blog posts are publicly readable" ON "BlogPost";
DROP POLICY IF EXISTS "Admins can manage all blog posts" ON "BlogPost";
CREATE POLICY "Blog posts are publicly readable" ON "BlogPost" FOR SELECT USING (true);
CREATE POLICY "Admins can manage all blog posts" ON "BlogPost" FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Testimonials are publicly readable" ON "Testimonial";
DROP POLICY IF EXISTS "Users can insert own testimonials" ON "Testimonial";
DROP POLICY IF EXISTS "Users can update own testimonials" ON "Testimonial";
DROP POLICY IF EXISTS "Users can delete own testimonials" ON "Testimonial";
DROP POLICY IF EXISTS "Admins can manage all testimonials" ON "Testimonial";
CREATE POLICY "Testimonials are publicly readable" ON "Testimonial" FOR SELECT USING (true);
CREATE POLICY "Users can insert own testimonials" ON "Testimonial" FOR INSERT WITH CHECK (auth.uid() = "authorId");
CREATE POLICY "Users can update own testimonials" ON "Testimonial" FOR UPDATE USING (auth.uid() = "authorId");
CREATE POLICY "Users can delete own testimonials" ON "Testimonial" FOR DELETE USING (auth.uid() = "authorId");
CREATE POLICY "Admins can manage all testimonials" ON "Testimonial" FOR ALL USING (is_admin());

-- >>> LIVE SUPPORT CHAT
DROP POLICY IF EXISTS "Admins can manage all support conversations" ON "SupportConversation";
DROP POLICY IF EXISTS "Users and guests can select own support conversations" ON "SupportConversation";
DROP POLICY IF EXISTS "Users and guests can insert own support conversations" ON "SupportConversation";
DROP POLICY IF EXISTS "Users and guests can update own support conversations" ON "SupportConversation";

CREATE POLICY "Admins can manage all support conversations" ON "SupportConversation" FOR ALL USING (public.is_admin());
CREATE POLICY "Users and guests can select own support conversations" ON "SupportConversation" FOR SELECT USING (auth.uid() = "userId" OR "guestSessionId" IS NOT NULL);
CREATE POLICY "Users and guests can insert own support conversations" ON "SupportConversation" FOR INSERT WITH CHECK (auth.uid() = "userId" OR "guestSessionId" IS NOT NULL);
CREATE POLICY "Users and guests can update own support conversations" ON "SupportConversation" FOR UPDATE USING (auth.uid() = "userId" OR "guestSessionId" IS NOT NULL);

DROP POLICY IF EXISTS "Admins can manage all support messages" ON "SupportMessage";
DROP POLICY IF EXISTS "Users and guests can select support messages" ON "SupportMessage";
DROP POLICY IF EXISTS "Users and guests can insert support messages" ON "SupportMessage";

CREATE POLICY "Admins can manage all support messages" ON "SupportMessage" FOR ALL USING (public.is_admin());
CREATE POLICY "Users and guests can select support messages" ON "SupportMessage" FOR SELECT USING (
  EXISTS (SELECT 1 FROM "SupportConversation" sc WHERE sc.id = "conversationId" AND (sc."userId" = auth.uid() OR sc."guestSessionId" IS NOT NULL))
);
CREATE POLICY "Users and guests can insert support messages" ON "SupportMessage" FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM "SupportConversation" sc WHERE sc.id = "conversationId" AND (sc."userId" = auth.uid() OR sc."guestSessionId" IS NOT NULL))
);

-- >>> STORAGE
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage own objects" ON storage.objects;

CREATE POLICY "Public Read Access" ON storage.objects FOR SELECT
USING ( bucket_id IN ('documents', 'event-media') );

CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT
WITH CHECK ( 
  auth.role() = 'authenticated' AND 
  (bucket_id = 'documents' OR bucket_id = 'event-media')
);

CREATE POLICY "Users can manage own objects" ON storage.objects 
FOR ALL 
USING ( auth.uid()::text = (storage.foldername(name))[1] )
WITH CHECK ( auth.uid()::text = (storage.foldername(name))[1] );

-- 11. ENABLE REALTIME
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE "SupportConversation";
    ALTER PUBLICATION supabase_realtime ADD TABLE "SupportMessage";
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
