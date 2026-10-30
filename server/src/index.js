import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import cookieParser from 'cookie-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseServiceKey)
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

if (!supabase) {
    console.warn('⚠️ [Server Warning] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in .env. Database actions will require these secrets.');
}

// Stripe Setup
const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;

if (!stripe) {
    console.warn('⚠️ [Server Warning] STRIPE_SECRET_KEY is missing in .env. Card checkout endpoints require this secret.');
}

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Auth Persistence Endpoints
app.post('/api/auth/set-session', (req, res) => {
    const { access_token, refresh_token } = req.body;

    if (!access_token || !refresh_token) {
        return res.status(400).json({ error: 'Missing tokens' });
    }

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/', // Ensure cookie is available for all routes
        maxAge: 60 * 60 * 24 * 7 * 1000 // 1 week
    };

    console.log(`[Server] Setting auth cookies for session (Production: ${process.env.NODE_ENV === 'production'})`);
    res.cookie('sb-access-token', access_token, cookieOptions);
    res.cookie('sb-refresh-token', refresh_token, cookieOptions);

    res.json({ status: 'Session set in cookies' });
});

app.get('/api/auth/get-session', (req, res) => {
    const accessToken = req.cookies['sb-access-token'];
    const refreshToken = req.cookies['sb-refresh-token'];

    if (!accessToken || !refreshToken) {
        console.log('[Server] No auth cookies found');
        return res.status(401).json({ error: 'No session found' });
    }

    console.log('[Server] Auth cookies retrieved successfully');
    res.json({ access_token: accessToken, refresh_token: refreshToken });
});

app.post('/api/auth/clear-session', (req, res) => {
    console.log('[Server] Clearing auth cookies');
    res.clearCookie('sb-access-token', { path: '/' });
    res.clearCookie('sb-refresh-token', { path: '/' });
    res.json({ status: 'Session cleared' });
});

// Stripe Checkout Session
app.post('/api/create-checkout-session', async (req, res) => {
    const { eventId, category, amount, userId, bookingId, type = 'event', returnUrl } = req.body;
    try {
        let productData = {};

        if (type === 'event') {
            // Check if event has already passed
            const { data: eventData, error: eventError } = await supabase
                .from('Event')
                .select('date')
                .eq('id', eventId)
                .single();

            if (eventError || !eventData) {
                console.error('Event fetch error:', eventError);
                return res.status(404).json({ error: "Event not found" });
            }

            const eventDate = new Date(eventData.date);
            const now = new Date();
            if (eventDate < now) {
                return res.status(400).json({ error: "This event has already passed. Registration is closed." });
            }

            productData = {
                name: `Event Booking: ${eventId}`,
                description: `Category: ${category}`,
            };
        } else if (type === 'visa') {
            productData = {
                name: `Visa Invitation Request: ${eventId}`,
                description: 'Official Visa Invitation Letter',
            };
        } else if (type === 'application') {
            productData = {
                name: `Application Donation`,
                description: `Donation for Application`,
            };
        }

        const metadata = {
            bookingId,
            userId: userId || 'N/A',
            eventId: eventId || 'N/A',
            type
        };

        const frontendBase = process.env.NODE_ENV === 'production'
            ? (process.env.PRODUCTION_URL || process.env.VITE_FRONTEND_URL || 'http://localhost:3000')
            : (process.env.VITE_FRONTEND_URL || 'http://localhost:3000');
        let basePath = '/upcoming-events';
        if (returnUrl && typeof returnUrl === 'string') {
            const cleanPath = returnUrl.split('?')[0];
            if (cleanPath.startsWith('/')) {
                basePath = cleanPath;
            }
        }

        const currency = (req.body.currency || 'kes').toLowerCase();
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: req.body.email,
            line_items: [{
                price_data: {
                    currency: currency,
                    product_data: productData,
                    unit_amount: Math.round(amount * 100),
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${frontendBase}${basePath}?status=success&bookingId=${bookingId}&type=${type}`,
            cancel_url: `${frontendBase}${basePath}?status=cancelled&bookingId=${bookingId}&type=${type}&resume=true`,
            metadata
        });
        res.json({ id: session.id, url: session.url });
    } catch (error) {
        console.error('Stripe session error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Stripe Webhook for async confirmation
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const { bookingId, type, userId } = session.metadata || {};

        try {
            let targetUserId = userId && userId !== 'N/A' ? userId : null;
            let notificationTitle = "Payment Confirmed";
            let notificationMsg = `Your payment for ${type || 'service'} was confirmed.`;

            if (type === 'event') {
                const { data: booking } = await supabase
                    .from('Booking')
                    .update({ status: 'CONFIRMED' })
                    .eq('id', bookingId)
                    .select('userId, Event(title)')
                    .maybeSingle();

                if (booking) {
                    targetUserId = targetUserId || booking.userId;
                    notificationTitle = "Event Booking Confirmed";
                    notificationMsg = `Your booking for "${booking.Event?.title || 'the event'}" has been confirmed!`;
                }
            } else if (type === 'visa') {
                const { data: visa } = await supabase
                    .from('VisaInvitation')
                    .update({ status: 'PAID', paymentStatus: 'PAID' })
                    .eq('id', bookingId)
                    .select('userId')
                    .maybeSingle();

                if (visa) {
                    targetUserId = targetUserId || visa.userId;
                    notificationTitle = "Visa Invitation Request Confirmed";
                    notificationMsg = `Your payment for the Visa Invitation Letter has been confirmed and is now under processing.`;
                }
            } else if (type === 'application') {
                const { data: appData } = await supabase
                    .from('Applications')
                    .update({ status: 'APPROVED', paymentStatus: 'PAID' })
                    .eq('id', bookingId)
                    .select('userId, type')
                    .maybeSingle();

                if (appData) {
                    targetUserId = targetUserId || appData.userId;
                    notificationTitle = "Application Donation Confirmed";
                    notificationMsg = `Your application (${appData.type}) and donation have been confirmed.`;
                }
            }

            if (targetUserId) {
                await supabase.from('Notification').insert({
                    userId: targetUserId,
                    title: notificationTitle,
                    message: notificationMsg,
                    type: 'SUCCESS',
                    isRead: false
                });
            }

            console.log(`Payment confirmed, DB updated, and notification created for ${type} ${bookingId}`);
        } catch (dbError) {
            console.error('Database update error in webhook:', dbError);
        }
    }

    res.json({ received: true });
});

// PayPal Webhook for async confirmation
app.post('/api/webhook/paypal', async (req, res) => {
    try {
        const event = req.body;

        if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED' || event.event_type === 'CHECKOUT.ORDER.APPROVED') {
            const resource = event.resource;
            // Depending on PAYPAL setup, the custom_id is usually tracked in purchase_units
            // but webhook payload structure varies a bit depending on order vs capture.
            // Let's check for custom_id commonly placed in resource.custom_id or resource.purchase_units[0].custom_id

            let bookingId = resource.custom_id;

            // If it's an order approved event, custom_id is in purchase_units
            if (!bookingId && resource.purchase_units && resource.purchase_units.length > 0) {
                bookingId = resource.purchase_units[0].custom_id;
            }

            if (bookingId) {
                // Update corresponding tables safely
                const { data: bData } = await supabase.from('Booking').update({ status: 'CONFIRMED' }).eq('id', bookingId).select('userId, Event(title)').maybeSingle();
                const { data: vData } = await supabase.from('VisaInvitation').update({ status: 'PAID', paymentStatus: 'PAID' }).eq('id', bookingId).select('userId').maybeSingle();
                const { data: aData } = await supabase.from('Applications').update({ status: 'APPROVED', paymentStatus: 'PAID' }).eq('id', bookingId).select('userId, type').maybeSingle();

                const targetUserId = bData?.userId || vData?.userId || aData?.userId;
                if (targetUserId) {
                    await supabase.from('Notification').insert({
                        userId: targetUserId,
                        title: "Payment Confirmed (PayPal)",
                        message: "Your PayPal transaction was successfully verified and confirmed.",
                        type: 'SUCCESS',
                        isRead: false
                    });
                }

                console.log(`PayPal webhook payment confirmed and DB updated for bookingId: ${bookingId}`);
            } else {
                console.log('PayPal webhook received but no custom_id (bookingId) found in payload', resource);
            }
        }

        res.status(200).json({ received: true });
    } catch (error) {
        console.error('PayPal webhook error:', error);
        res.status(500).json({ error: error.message });
    }
});

// PayPal Order Verification & Settlement
app.post('/api/verify-paypal-order', async (req, res) => {
    try {
        const { orderId, bookingId, type, userId } = req.body;
        if (!bookingId) {
            return res.status(400).json({ error: 'Missing bookingId parameter' });
        }

        if (supabase) {
            let targetUserId = userId || null;
            let notificationTitle = "Payment Confirmed (PayPal)";
            let notificationMsg = "Your PayPal transaction was successfully processed and confirmed.";

            if (type === 'event') {
                const { data: booking } = await supabase
                    .from('Booking')
                    .update({
                        status: 'CONFIRMED',
                        payment_status: 'PAID',
                        payment_method: 'PAYPAL'
                    })
                    .eq('id', bookingId)
                    .select('userId, Event(title)')
                    .maybeSingle();

                if (booking) {
                    targetUserId = targetUserId || booking.userId;
                    notificationTitle = "Event Booking Confirmed";
                    notificationMsg = `Your booking for "${booking.Event?.title || 'the outreach event'}" has been confirmed via PayPal!`;
                }
            } else if (type === 'visa') {
                const { data: visa } = await supabase
                    .from('VisaInvitation')
                    .update({ status: 'PAID', paymentStatus: 'PAID' })
                    .eq('id', bookingId)
                    .select('userId')
                    .maybeSingle();

                if (visa) {
                    targetUserId = targetUserId || visa.userId;
                    notificationTitle = "Visa Invitation Request Confirmed";
                    notificationMsg = "Your PayPal payment for the Visa Invitation Letter has been confirmed.";
                }
            } else if (type === 'application') {
                const { data: appData } = await supabase
                    .from('Applications')
                    .update({ status: 'APPROVED', paymentStatus: 'PAID' })
                    .eq('id', bookingId)
                    .select('userId, type')
                    .maybeSingle();

                if (appData) {
                    targetUserId = targetUserId || appData.userId;
                    notificationTitle = "Application Donation Confirmed";
                    notificationMsg = `Your donation for application (${appData.type}) was confirmed via PayPal.`;
                }
            }

            if (targetUserId) {
                await supabase.from('Notification').insert({
                    userId: targetUserId,
                    title: notificationTitle,
                    message: notificationMsg,
                    type: 'SUCCESS',
                    isRead: false
                }).catch(err => console.log('Notification error:', err.message));
            }
        }

        console.log(`[PayPal] Payment verified and database settled for bookingId: ${bookingId}, orderId: ${orderId}`);
        res.json({ success: true, status: 'CONFIRMED', orderId, bookingId });
    } catch (error) {
        console.error('PayPal verification error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// M-PESA DARAJA STK PUSH (LIPA NA M-PESA ONLINE) & CASH ON ARRIVAL INTEGRATION
// ============================================================================

const MPESA_ENV = (process.env.MPESA_ENV || 'sandbox').toLowerCase();
const MPESA_BASE_URL = (MPESA_ENV === 'production' || MPESA_ENV === 'live')
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const MPESA_PASSKEY = process.env.MPESA_PASSKEY;
const MPESA_SHORTCODE = process.env.MPESA_HO_SHORTCODE || process.env.MPESA_SHORTCODE || '174379';
const MPESA_TILL_NUMBER = process.env.MPESA_TILL_NUMBER;
const MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL;

console.log(`[M-Pesa Setup] Environment: ${MPESA_ENV} (${MPESA_BASE_URL}), Shortcode: ${MPESA_SHORTCODE}, Till: ${MPESA_TILL_NUMBER || 'N/A'}`);

// Standardize phone number to Safaricom format: 2547XXXXXXXX or 2541XXXXXXXX
function formatKenyanPhoneNumber(phone) {
    if (!phone) return null;
    let clean = phone.toString().replace(/[\s\+\-\(\)]/g, '');
    if (clean.startsWith('0')) {
        clean = '254' + clean.slice(1);
    } else if (clean.startsWith('7') || clean.startsWith('1')) {
        clean = '254' + clean;
    }
    return clean;
}

// Generate YYYYMMDDHHmmss timestamp
function getMpesaTimestamp() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

// Cache OAuth token in memory
let mpesaTokenCache = { token: null, expiresAt: 0 };

async function getMpesaAccessToken() {
    const now = Date.now();
    if (mpesaTokenCache.token && now < mpesaTokenCache.expiresAt - 60000) {
        return mpesaTokenCache.token;
    }

    if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET) {
        throw new Error('M-Pesa Consumer Key or Consumer Secret is not configured in .env');
    }

    const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
    const response = await fetch(`${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: { Authorization: `Basic ${auth}` }
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Daraja OAuth Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    mpesaTokenCache = {
        token: data.access_token,
        expiresAt: now + (Number(data.expires_in) * 1000)
    };
    return mpesaTokenCache.token;
}

// 1. INITIATE M-PESA STK PUSH
app.post('/api/mpesa/stkpush', async (req, res) => {
    try {
        const { phoneNumber, amount, bookingId, userId, description } = req.body;

        if (!phoneNumber || !amount || !bookingId) {
            return res.status(400).json({ error: 'Missing required parameters: phoneNumber, amount, or bookingId' });
        }

        const formattedPhone = formatKenyanPhoneNumber(phoneNumber);
        if (!formattedPhone || formattedPhone.length !== 12 || !formattedPhone.startsWith('254')) {
            return res.status(400).json({ error: 'Please enter a valid Kenyan Safaricom phone number (e.g. 0712345678 or 254712345678)' });
        }

        const finalAmount = Math.max(1, Math.round(Number(amount)));
        const timestamp = getMpesaTimestamp();

        // For Till (Buy Goods), ShortCode is Head Office ShortCode, PartyB is Till Number
        const businessShortCode = MPESA_SHORTCODE;
        const partyB = MPESA_TILL_NUMBER || MPESA_SHORTCODE;
        const transactionType = MPESA_TILL_NUMBER ? 'CustomerBuyGoodsOnline' : 'CustomerPayBillOnline';
        const password = Buffer.from(`${businessShortCode}${MPESA_PASSKEY}${timestamp}`).toString('base64');

        const frontendBase = process.env.NODE_ENV === 'production'
            ? (process.env.PRODUCTION_URL || 'https://thevoiceofhope.org')
            : (process.env.VITE_FRONTEND_URL || 'http://localhost:3000');

        const callbackUrl = MPESA_CALLBACK_URL || `${frontendBase}/api/mpesa/callback`;

        const accessToken = await getMpesaAccessToken();

        const stkPayload = {
            BusinessShortCode: businessShortCode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: transactionType,
            Amount: finalAmount,
            PartyA: formattedPhone,
            PartyB: partyB,
            PhoneNumber: formattedPhone,
            CallBackURL: callbackUrl,
            AccountReference: 'VoiceOfHope',
            TransactionDesc: (description || 'Charity Donation').substring(0, 12)
        };

        console.log(`[M-Pesa STK Push] Sending request to ${MPESA_BASE_URL} for phone ${formattedPhone}, amount KES ${finalAmount}`);

        const response = await fetch(`${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(stkPayload)
        });

        const data = await response.json();
        console.log('[M-Pesa STK Push Response]', data);

        if (data.ResponseCode === '0') {
            // Update Booking in Supabase with CheckoutRequestID & Phone
            if (supabase) {
                await supabase
                    .from('Booking')
                    .update({
                        mpesa_checkout_request_id: data.CheckoutRequestID,
                        phone_number: formattedPhone,
                        payment_method: 'MPESA',
                        currency: 'KES',
                        status: 'PENDING',
                        payment_status: 'PENDING'
                    })
                    .eq('id', bookingId);

                // Log into MpesaTransaction if table exists
                await supabase
                    .from('MpesaTransaction')
                    .insert({
                        bookingId,
                        userId: userId || null,
                        merchantRequestId: data.MerchantRequestID,
                        checkoutRequestId: data.CheckoutRequestID,
                        responseCode: data.ResponseCode,
                        responseDescription: data.ResponseDescription,
                        customerMessage: data.CustomerMessage,
                        phoneNumber: formattedPhone,
                        amount: finalAmount,
                        status: 'PENDING'
                    })
                    .catch((err) => console.log('[DB notice] MpesaTransaction table insert skipped:', err.message));
            }

            return res.json({
                success: true,
                checkoutRequestId: data.CheckoutRequestID,
                merchantRequestId: data.MerchantRequestID,
                customerMessage: data.CustomerMessage || 'Please check your phone and enter your M-Pesa PIN to complete payment.'
            });
        } else {
            return res.status(400).json({
                error: data.ResponseDescription || data.errorMessage || 'Failed to initiate M-Pesa STK Push',
                details: data
            });
        }
    } catch (error) {
        console.error('[M-Pesa STK Push Error]', error);
        return res.status(500).json({ error: error.message || 'Internal server error while initiating M-Pesa STK Push' });
    }
});

// 2. M-PESA DARAJA WEBHOOK CALLBACK
app.post('/api/mpesa/callback', async (req, res) => {
    try {
        console.log('[M-Pesa Callback Received]', JSON.stringify(req.body));
        const stkCallback = req.body?.Body?.stkCallback;

        if (!stkCallback) {
            return res.status(400).json({ error: 'Invalid callback payload' });
        }

        const checkoutRequestId = stkCallback.CheckoutRequestID;
        const resultCode = stkCallback.ResultCode;
        const resultDesc = stkCallback.ResultDesc;

        if (resultCode === 0) {
            // Successful Payment
            const items = stkCallback.CallbackMetadata?.Item || [];
            const meta = {};
            items.forEach(item => {
                if (item.Name) meta[item.Name] = item.Value;
            });

            const amount = meta.Amount;
            const receipt = meta.MpesaReceiptNumber;
            const phone = meta.PhoneNumber;
            const transactionDate = meta.TransactionDate;

            console.log(`[M-Pesa Callback Success] Receipt: ${receipt}, Amount: ${amount}, Phone: ${phone}`);

            if (supabase) {
                // Update Booking
                const { data: booking } = await supabase
                    .from('Booking')
                    .update({
                        status: 'CONFIRMED',
                        payment_status: 'PAID',
                        mpesa_receipt: receipt,
                        amountPaid: amount,
                        payment_method: 'MPESA'
                    })
                    .eq('mpesa_checkout_request_id', checkoutRequestId)
                    .select('*, Event(title)')
                    .maybeSingle();

                // Update MpesaTransaction record
                await supabase
                    .from('MpesaTransaction')
                    .update({
                        status: 'COMPLETED',
                        resultCode,
                        resultDesc,
                        mpesaReceiptNumber: receipt,
                        transactionDate: transactionDate ? String(transactionDate) : null,
                        rawCallback: req.body
                    })
                    .eq('checkoutRequestId', checkoutRequestId)
                    .catch((err) => console.log('[DB notice] MpesaTransaction update skipped:', err.message));

                // Send notification to user
                if (booking?.userId) {
                    await supabase.from('Notification').insert({
                        userId: booking.userId,
                        title: 'M-Pesa Contribution Received! ❤️',
                        message: `Your donation of KES ${amount} (Receipt: ${receipt}) for "${booking.Event?.title || 'outreach'}" was successfully confirmed. May you be blessed for supporting our mission!`,
                        type: 'SUCCESS',
                        isRead: false
                    }).catch(err => console.log('Notification insert error:', err.message));
                }
            }
        } else {
            console.log(`[M-Pesa Callback Cancelled/Failed] Code: ${resultCode}, Desc: ${resultDesc}`);
            if (supabase) {
                await supabase
                    .from('MpesaTransaction')
                    .update({
                        status: 'FAILED',
                        resultCode,
                        resultDesc,
                        rawCallback: req.body
                    })
                    .eq('checkoutRequestId', checkoutRequestId)
                    .catch(() => {});
            }
        }

        // Always acknowledge Safaricom
        res.json({ ResultCode: 0, ResultDesc: 'Callback processed successfully' });
    } catch (err) {
        console.error('[M-Pesa Callback Processing Error]', err);
        res.status(500).json({ ResultCode: 1, ResultDesc: 'Callback processing error' });
    }
});

// 3. M-PESA STATUS QUERY ENDPOINT (Frontend Polling / Verification)
app.get('/api/mpesa/query/:checkoutRequestId', async (req, res) => {
    try {
        const { checkoutRequestId } = req.params;
        if (!checkoutRequestId) {
            return res.status(400).json({ error: 'Missing checkoutRequestId parameter' });
        }

        if (supabase) {
            const { data: booking } = await supabase
                .from('Booking')
                .select('id, status, payment_status, mpesa_receipt, amountPaid')
                .eq('mpesa_checkout_request_id', checkoutRequestId)
                .maybeSingle();

            if (booking && (booking.status === 'CONFIRMED' || booking.payment_status === 'PAID')) {
                return res.json({
                    status: 'COMPLETED',
                    receipt: booking.mpesa_receipt,
                    amount: booking.amountPaid,
                    bookingId: booking.id
                });
            }

            // Check MpesaTransaction
            const { data: tx } = await supabase
                .from('MpesaTransaction')
                .select('*')
                .eq('checkoutRequestId', checkoutRequestId)
                .maybeSingle();

            if (tx) {
                if (tx.status === 'COMPLETED') {
                    return res.json({ status: 'COMPLETED', receipt: tx.mpesaReceiptNumber, amount: tx.amount });
                } else if (tx.status === 'FAILED') {
                    return res.json({ status: 'FAILED', reason: tx.resultDesc || 'Payment was cancelled or failed' });
                }
            }
        }

        // Return current pending state to keep polling
        return res.json({ status: 'PENDING', message: 'Waiting for M-Pesa PIN confirmation...' });
    } catch (error) {
        console.error('[M-Pesa Query Error]', error);
        return res.status(500).json({ error: error.message });
    }
});

// 4. CASH PAY ON ARRIVAL CONFIRMATION ENDPOINT
app.post('/api/booking/pay-on-arrival', async (req, res) => {
    try {
        const { bookingId, userId, amount } = req.body;
        if (!bookingId) {
            return res.status(400).json({ error: 'Missing bookingId parameter' });
        }

        if (supabase) {
            const { data: updatedBooking, error } = await supabase
                .from('Booking')
                .update({
                    status: 'CONFIRMED',
                    payment_status: 'PENDING_CASH_ON_ARRIVAL',
                    payment_method: 'CASH_EVENT_DAY',
                    currency: 'KES'
                })
                .eq('id', bookingId)
                .select('*, Event(title, date, location)')
                .maybeSingle();

            if (error) throw error;

            if (userId) {
                await supabase.from('Notification').insert({
                    userId,
                    title: 'Attendance Confirmed (Cash on Event Day) 🤝',
                    message: `Your attendance for "${updatedBooking?.Event?.title || 'the outreach'}" has been confirmed! You pledged KES ${amount || 0} cash to be paid at reception on event day.`,
                    type: 'SUCCESS',
                    isRead: false
                }).catch(err => console.log('Notification error:', err.message));
            }

            return res.json({
                success: true,
                booking: updatedBooking,
                message: 'Booking confirmed! You may bring your cash donation on the day of the event.'
            });
        } else {
            return res.json({ success: true, message: 'Cash on arrival pledge noted.' });
        }
    } catch (error) {
        console.error('[Pay on Arrival Error]', error);
        return res.status(500).json({ error: error.message });
    }
});

// Unmatched API route handler
app.all('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../../dist')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../../dist/index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
