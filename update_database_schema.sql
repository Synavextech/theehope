-- ==============================================================================
-- UPDATE_DATABASE_SCHEMA.SQL
-- The Voice of Hope Kenya: Full System Streamline & Charity Overhaul Migration
-- Run this in your Supabase SQL Editor to ensure all tables, columns,
-- and RLS policies match the production charity specifications.
-- ==============================================================================

-- 1. STREAMLINE "Event" TABLE FOR CHARITY OUTREACH & KES CURRENCY
ALTER TABLE IF EXISTS "Event" ADD COLUMN IF NOT EXISTS "target_amount" DECIMAL(12,2) DEFAULT 0;
ALTER TABLE IF EXISTS "Event" ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'KES';
ALTER TABLE IF EXISTS "Event" ADD COLUMN IF NOT EXISTS "heroImageUrl" TEXT;
ALTER TABLE IF EXISTS "Event" ADD COLUMN IF NOT EXISTS "accepted_contributions" JSONB DEFAULT '["Money", "Food", "Clothing", "Learning materials", "Electronics", "Laptops", "Phones", "Computers", "Shoes", "Utensils", "Self"]'::JSONB;
ALTER TABLE IF EXISTS "Event" ADD COLUMN IF NOT EXISTS "volunteer_roles" JSONB DEFAULT '["Work in kitchen", "Play games", "Mingle with kids", "Seek to adopt"]'::JSONB;
ALTER TABLE IF EXISTS "Event" ADD COLUMN IF NOT EXISTS "organizer_contact" TEXT DEFAULT '+254798182108 / +254798332690';
ALTER TABLE IF EXISTS "Event" ADD COLUMN IF NOT EXISTS "youtube_video_url" TEXT;

-- 2. STREAMLINE "Booking" TABLE FOR DONATIONS, ATTENDANCE & M-PESA CHECKOUT
CREATE TABLE IF NOT EXISTS "Booking" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "eventId" UUID NOT NULL REFERENCES "Event"(id) ON DELETE CASCADE,
    category TEXT NOT NULL DEFAULT 'ATTENDEE_CONTRIBUTOR',
    "amountPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure all needed charity fields exist on "Booking"
ALTER TABLE "Booking" ALTER COLUMN "userId" SET DEFAULT auth.uid();
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "mode" TEXT DEFAULT 'PHYSICAL';
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "attendance_type" TEXT DEFAULT 'ATTENDING'; -- 'ATTENDING' or 'DONATING_ONLY'
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "delivery_method" TEXT DEFAULT 'IN_PERSON_EVENT_DAY'; -- 'IN_PERSON_EVENT_DAY' or 'ONLINE_DELIVERY'
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "item_contributions" JSONB DEFAULT '[]'::JSONB;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "volunteer_activities" JSONB DEFAULT '[]'::JSONB;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "mingle_notes" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "seek_to_adopt" BOOLEAN DEFAULT FALSE;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "wish_note" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "payment_method" TEXT DEFAULT 'MPESA'; -- 'MPESA', 'CASH_EVENT_DAY', 'STRIPE', 'PAYPAL'
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "payment_status" TEXT DEFAULT 'PENDING'; -- 'PENDING', 'PAID', 'PENDING_CASH_ON_ARRIVAL'
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'KES';
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "phone_number" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "mpesa_receipt" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "mpesa_checkout_request_id" TEXT;

-- 3. M-PESA TRANSACTIONS AUDIT LOG TABLE
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

-- 4. STREAMLINE "Testimonial" (REVIEWS) TABLE & LIVE COMMUNITY INTEGRATION
CREATE TABLE IF NOT EXISTS "Testimonial" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    "authorId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    rating INTEGER DEFAULT 5,
    status TEXT DEFAULT 'APPROVED',
    "authorName" TEXT,
    "authorRole" TEXT DEFAULT 'Volunteer',
    "authorAvatar" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure all fields exist on "Testimonial"
ALTER TABLE "Testimonial" ADD COLUMN IF NOT EXISTS "rating" INTEGER DEFAULT 5;
ALTER TABLE "Testimonial" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'APPROVED';
ALTER TABLE "Testimonial" ADD COLUMN IF NOT EXISTS "authorName" TEXT;
ALTER TABLE "Testimonial" ADD COLUMN IF NOT EXISTS "authorRole" TEXT DEFAULT 'Volunteer';
ALTER TABLE "Testimonial" ADD COLUMN IF NOT EXISTS "authorAvatar" TEXT;
ALTER TABLE "Testimonial" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 5. ROW LEVEL SECURITY (RLS) POLICIES FOR SECURE ACCESS
ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MpesaTransaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Testimonial" ENABLE ROW LEVEL SECURITY;

-- Booking Policies
DROP POLICY IF EXISTS "Users can view own bookings" ON "Booking";
CREATE POLICY "Users can view own bookings" ON "Booking"
    FOR SELECT TO authenticated
    USING ("userId" = auth.uid());

DROP POLICY IF EXISTS "Users can insert own bookings" ON "Booking";
CREATE POLICY "Users can insert own bookings" ON "Booking"
    FOR INSERT TO authenticated
    WITH CHECK ("userId" = auth.uid());

DROP POLICY IF EXISTS "Service role has full access to bookings" ON "Booking";
CREATE POLICY "Service role has full access to bookings" ON "Booking"
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- Testimonial Policies
DROP POLICY IF EXISTS "Public can view approved testimonials" ON "Testimonial";
CREATE POLICY "Public can view approved testimonials" ON "Testimonial"
    FOR SELECT TO anon, authenticated
    USING (status = 'APPROVED');

DROP POLICY IF EXISTS "Authenticated users can submit testimonials" ON "Testimonial";
CREATE POLICY "Authenticated users can submit testimonials" ON "Testimonial"
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = "authorId");

DROP POLICY IF EXISTS "Users can manage own testimonials" ON "Testimonial";
CREATE POLICY "Users can manage own testimonials" ON "Testimonial"
    FOR ALL TO authenticated
    USING (auth.uid() = "authorId");

-- MpesaTransaction Policies
DROP POLICY IF EXISTS "Service role has full access to MpesaTransaction" ON "MpesaTransaction";
CREATE POLICY "Service role has full access to MpesaTransaction" ON "MpesaTransaction"
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own mpesa transactions" ON "MpesaTransaction";
CREATE POLICY "Users can view own mpesa transactions" ON "MpesaTransaction"
    FOR SELECT TO authenticated
    USING ("userId" = auth.uid());

-- Done
COMMENT ON TABLE "Booking" IS 'Tracks charity event attendance declarations, voluntary financial donations, item pledges, and delivery statuses.';
COMMENT ON TABLE "Testimonial" IS 'Community feedback, reviews, and stories from volunteers, donors, and partners.';
COMMENT ON TABLE "MpesaTransaction" IS 'Audit records for Safaricom Daraja STK Push requests and callbacks.';
