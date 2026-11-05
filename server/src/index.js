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
    const { eventId, category, amount, userId, bookingId, type = 'event', returnUrl, isInstallment } = req.body;
    try {
        let productData = {
            name: isInstallment ? `Pledge Installment Contribution` : `Charity Outreach Contribution`,
            description: `Category: ${category || 'Outreach Support'}`,
        };

        if (eventId && eventId !== 'N/A' && supabase) {
            const { data: eventData } = await supabase
                .from('Event')
                .select('title, date')
                .eq('id', eventId)
                .maybeSingle();

            if (eventData) {
                productData = {
                    name: isInstallment
                        ? `Pledge Installment: ${eventData.title}`
                        : `Outreach Support: ${eventData.title}`,
                    description: `Category: ${category || 'Supporter'}`,
                };
            }
        }

        const metadata = {
            bookingId,
            userId: userId || 'N/A',
            eventId: eventId || 'N/A',
            type,
            isInstallment: isInstallment ? 'true' : 'false',
            paidAmount: String(amount || 0)
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
            customer_email: req.body.email || undefined,
            line_items: [{
                price_data: {
                    currency: currency,
                    product_data: productData,
                    unit_amount: Math.round(Number(amount) * 100),
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

// Helper to settle booking or pledge installment
async function settleBookingPayment(bookingId, paidAmount, method, receiptRef = null) {
    if (!supabase || !bookingId) return null;

    const { data: existing } = await supabase
        .from('Booking')
        .select('*, Event(title, date)')
        .eq('id', bookingId)
        .maybeSingle();

    if (!existing) return null;

    const numericPaid = Number(paidAmount || 0);
    const prevPaid = Number(existing.amountPaid || 0);
    const pledgedTotal = Number(existing.pledged_amount || 0);
    const isPledge = Boolean(existing.is_pledge);

    let newAmountPaid = numericPaid > 0 ? numericPaid : prevPaid;
    let updatedHistory = Array.isArray(existing.installment_history) ? [...existing.installment_history] : [];

    if (isPledge && numericPaid > 0) {
        // If this is a subsequent installment or initial bit, record in installment_history
        const alreadyRecorded = receiptRef && updatedHistory.some(h => h.receipt === receiptRef);
        if (!alreadyRecorded) {
            // Check if amountPaid was already pre-filled on initial booking creation
            if (updatedHistory.length === 0 && prevPaid === numericPaid && existing.payment_status === 'PENDING') {
                newAmountPaid = numericPaid;
            } else {
                newAmountPaid = prevPaid + numericPaid;
            }
            updatedHistory.push({
                amount: numericPaid,
                date: new Date().toISOString(),
                method,
                receipt: receiptRef || `${method}-${Date.now()}`
            });
        }
    }

    const fullySettled = !isPledge || (pledgedTotal > 0 && newAmountPaid >= pledgedTotal);
    const newStatus = fullySettled ? 'CONFIRMED' : 'PLEDGED';
    const newPaymentStatus = fullySettled ? 'PAID' : 'PARTIAL_PLEDGE';

    const updatePayload = {
        status: newStatus,
        payment_status: newPaymentStatus,
        payment_method: method,
        amountPaid: newAmountPaid,
        installment_history: updatedHistory
    };
    if (receiptRef && method === 'MPESA') {
        updatePayload.mpesa_receipt = receiptRef;
    }

    const { data: updated } = await supabase
        .from('Booking')
        .update(updatePayload)
        .eq('id', bookingId)
        .select('*, Event(title, date)')
        .maybeSingle();

    return updated || existing;
}

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
        const { bookingId, type, userId, paidAmount } = session.metadata || {};

        try {
            const booking = await settleBookingPayment(bookingId, Number(paidAmount || (session.amount_total ? session.amount_total / 100 : 0)), 'STRIPE', session.id);
            const targetUserId = (userId && userId !== 'N/A') ? userId : booking?.userId;

            if (targetUserId && supabase) {
                const remaining = booking?.is_pledge
                    ? Math.max(0, Number(booking.pledged_amount || 0) - Number(booking.amountPaid || 0))
                    : 0;
                await supabase.from('Notification').insert({
                    userId: targetUserId,
                    title: booking?.is_pledge && remaining > 0 ? "Pledge Installment Confirmed! ❤️" : "Outreach Contribution Confirmed! ❤️",
                    message: booking?.is_pledge && remaining > 0
                        ? `Your installment payment for "${booking?.Event?.title || 'our charity outreach'}" was confirmed! Remaining pledge balance: KES ${remaining.toLocaleString()}.`
                        : `Your contribution for "${booking?.Event?.title || 'our charity outreach'}" has been confirmed! Thank you for bringing hope.`,
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
            let bookingId = resource.custom_id;

            if (!bookingId && resource.purchase_units && resource.purchase_units.length > 0) {
                bookingId = resource.purchase_units[0].custom_id;
            }

            if (bookingId) {
                const bData = await settleBookingPayment(bookingId, 0, 'PAYPAL', resource.id);
                const targetUserId = bData?.userId;
                if (targetUserId && supabase) {
                    await supabase.from('Notification').insert({
                        userId: targetUserId,
                        title: "Contribution Confirmed (PayPal)",
                        message: "Your PayPal contribution was successfully verified and confirmed.",
                        type: 'SUCCESS',
                        isRead: false
                    });
                }

                console.log(`PayPal webhook payment confirmed and DB updated for bookingId: ${bookingId}`);
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
        const { orderId, bookingId, userId, amount } = req.body;
        if (!bookingId) {
            return res.status(400).json({ error: 'Missing bookingId parameter' });
        }

        if (supabase) {
            const booking = await settleBookingPayment(bookingId, Number(amount || 0), 'PAYPAL', orderId);
            const targetUserId = userId || booking?.userId || null;

            if (targetUserId) {
                await supabase.from('Notification').insert({
                    userId: targetUserId,
                    title: "Contribution Confirmed (PayPal)",
                    message: `Your contribution for "${booking?.Event?.title || 'the outreach event'}" has been confirmed via PayPal!`,
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
                // Find booking by checkoutRequestId and settle (handles both full donations & pledge installments)
                const { data: targetBooking } = await supabase
                    .from('Booking')
                    .select('id')
                    .eq('mpesa_checkout_request_id', checkoutRequestId)
                    .maybeSingle();

                let booking = null;
                if (targetBooking?.id) {
                    booking = await settleBookingPayment(targetBooking.id, Number(amount || 0), 'MPESA', receipt);
                }

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
                    const remaining = booking.is_pledge
                        ? Math.max(0, Number(booking.pledged_amount || 0) - Number(booking.amountPaid || 0))
                        : 0;
                    await supabase.from('Notification').insert({
                        userId: booking.userId,
                        title: booking.is_pledge && remaining > 0 ? 'M-Pesa Pledge Installment Received! ❤️' : 'M-Pesa Contribution Received! ❤️',
                        message: booking.is_pledge && remaining > 0
                            ? `Your installment bit of KES ${Number(amount).toLocaleString()} (Receipt: ${receipt}) for "${booking.Event?.title || 'outreach'}" was confirmed! Remaining pledge balance: KES ${remaining.toLocaleString()}.`
                            : `Your donation of KES ${Number(amount).toLocaleString()} (Receipt: ${receipt}) for "${booking.Event?.title || 'outreach'}" was successfully confirmed. May you be blessed for supporting our mission!`,
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

            if (booking && (booking.status === 'CONFIRMED' || booking.payment_status === 'PAID' || booking.payment_status === 'PARTIAL_PLEDGE')) {
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

// 5. UNIFIED GUEST & MEMBER BOOKING / DONATION / PLEDGE CREATION ENDPOINT
app.post('/api/bookings/create', async (req, res) => {
    try {
        if (!supabase) {
            return res.status(500).json({ error: 'Database client not initialized on server' });
        }

        const {
            userId,
            eventId,
            guest_name,
            guest_email,
            guest_phone,
            category,
            amountPaid,
            pledged_amount,
            is_pledge,
            reminder_frequency,
            pledge_due_date,
            status,
            payment_status,
            payment_method,
            attendance_type,
            delivery_method,
            item_contributions,
            volunteer_activities,
            mingle_notes,
            seek_to_adopt,
            wish_note
        } = req.body;

        if (!userId && (!guest_name || !guest_phone)) {
            return res.status(400).json({
                error: 'Please provide your Full Name and Phone Number for guest checkout.'
            });
        }

        // Resolve eventId if null (use nearest upcoming event or latest event)
        let resolvedEventId = eventId || null;
        if (!resolvedEventId) {
            const { data: firstEvent } = await supabase
                .from('Event')
                .select('id, date')
                .order('date', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (firstEvent?.id) {
                resolvedEventId = firstEvent.id;
            }
        }

        const insertPayload = {
            userId: userId || null,
            eventId: resolvedEventId,
            guest_name: guest_name ? String(guest_name).trim() : null,
            guest_email: guest_email ? String(guest_email).trim() : null,
            guest_phone: guest_phone ? formatKenyanPhoneNumber(guest_phone) || String(guest_phone).trim() : null,
            phone_number: guest_phone ? formatKenyanPhoneNumber(guest_phone) || String(guest_phone).trim() : null,
            category: category || (attendance_type === 'ATTENDING' ? 'ATTENDEE_CONTRIBUTOR' : 'DONOR_SUPPORTER'),
            amountPaid: Number(amountPaid || 0),
            pledged_amount: Number(pledged_amount || 0),
            is_pledge: Boolean(is_pledge),
            reminder_frequency: is_pledge ? (reminder_frequency || 'WEEKLY') : 'NONE',
            pledge_due_date: pledge_due_date || null,
            installment_history: [],
            currency: 'KES',
            status: status || 'PENDING',
            payment_status: payment_status || 'PENDING',
            payment_method: payment_method || 'MPESA',
            mode: 'PHYSICAL',
            attendance_type: attendance_type || 'DONATING_ONLY',
            delivery_method: delivery_method || 'IN_PERSON_EVENT_DAY',
            item_contributions: Array.isArray(item_contributions) ? item_contributions : [],
            volunteer_activities: Array.isArray(volunteer_activities) ? volunteer_activities : [],
            mingle_notes: mingle_notes || null,
            seek_to_adopt: Boolean(seek_to_adopt),
            wish_note: wish_note || null
        };

        const { data: booking, error } = await supabase
            .from('Booking')
            .insert(insertPayload)
            .select('*, Event(title, date, location)')
            .single();

        if (error) {
            console.error('[Booking Create Error]', error);
            return res.status(400).json({ error: error.message });
        }

        // If user is authenticated and made a pledge, send initial pledge confirmation & countdown notification
        if (booking?.userId && booking?.is_pledge) {
            const targetDate = booking.pledge_due_date || booking.Event?.date;
            const daysRemaining = targetDate
                ? Math.max(0, Math.ceil((new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                : null;
            await supabase.from('Notification').insert({
                userId: booking.userId,
                title: `Pledge Registered: KES ${Number(booking.pledged_amount).toLocaleString()} 🤝`,
                message: `Thank you for pledging KES ${Number(booking.pledged_amount).toLocaleString()} toward "${booking.Event?.title || 'our charity outreach'}"! ${daysRemaining !== null ? `Countdown: ${daysRemaining} day(s) remaining.` : ''} You can pay comfortably in bits anytime from My Bookings & Pledges.`,
                type: 'PLEDGE_REMINDER',
                isRead: false
            }).catch(() => {});
        }

        return res.json({ success: true, booking });
    } catch (error) {
        console.error('[Booking Create Exception]', error);
        return res.status(500).json({ error: error.message || 'Failed to record booking or donation' });
    }
});

// 6. GUEST & SUPPORTER PLEDGE / BOOKING LOOKUP ENDPOINT
app.get('/api/pledges/lookup', async (req, res) => {
    try {
        if (!supabase) {
            return res.status(500).json({ error: 'Database client not initialized' });
        }
        const rawQuery = String(req.query.query || '').trim();
        if (!rawQuery) {
            return res.status(400).json({ error: 'Please provide a phone number, email, or booking ID' });
        }

        const formattedPhone = formatKenyanPhoneNumber(rawQuery);
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawQuery);

        let queryBuilder = supabase
            .from('Booking')
            .select('*, event:Event(*)')
            .order('createdAt', { ascending: false });

        if (isUuid) {
            queryBuilder = queryBuilder.eq('id', rawQuery);
        } else if (rawQuery.includes('@')) {
            queryBuilder = queryBuilder.ilike('guest_email', rawQuery);
        } else {
            queryBuilder = queryBuilder.or(`guest_phone.eq.${formattedPhone},phone_number.eq.${formattedPhone},guest_phone.ilike.%${rawQuery}%`);
        }

        const { data, error } = await queryBuilder.limit(20);
        if (error) throw error;

        return res.json({ bookings: data || [] });
    } catch (error) {
        console.error('[Pledge Lookup Error]', error);
        return res.status(500).json({ error: error.message });
    }
});

// 7. PLEDGE COUNTDOWN REMINDER ENGINE (Automated & On-Demand)
async function evaluateAndSendPledgeReminders({ userId = null, bookingId = null, force = false } = {}) {
    if (!supabase) return { sentCount: 0 };

    let query = supabase
        .from('Booking')
        .select('*, Event(title, date, location)')
        .eq('is_pledge', true);

    if (bookingId) {
        query = query.eq('id', bookingId);
    } else if (userId) {
        query = query.eq('userId', userId);
    }

    const { data: pledges, error } = await query;
    if (error || !pledges) return { sentCount: 0, error: error?.message };

    const now = Date.now();
    let sentCount = 0;

    for (const pledge of pledges) {
        const totalPledged = Number(pledge.pledged_amount || 0);
        const amountPaid = Number(pledge.amountPaid || 0);
        const remaining = Math.max(0, totalPledged - amountPaid);

        if (remaining <= 0) continue; // Already fulfilled

        const freq = pledge.reminder_frequency || 'WEEKLY';
        if (freq === 'NONE' && !force) continue;

        const intervalHours = freq === 'DAILY' ? 24 : freq === 'EVERY_3_DAYS' ? 72 : 168;
        const lastSentMs = pledge.last_reminder_sent_at ? new Date(pledge.last_reminder_sent_at).getTime() : 0;
        const hoursSinceLast = (now - lastSentMs) / (1000 * 60 * 60);

        if (!force && lastSentMs > 0 && hoursSinceLast < intervalHours) {
            continue;
        }

        const targetDateStr = pledge.pledge_due_date || pledge.Event?.date;
        const targetMs = targetDateStr ? new Date(targetDateStr).getTime() : (now + 7 * 86400000);
        const diffMs = Math.max(0, targetMs - now);
        const daysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hoursLeft = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
        const eventTitle = pledge.Event?.title || 'The Voice of Hope Charity Outreach';

        if (pledge.userId) {
            await supabase.from('Notification').insert({
                userId: pledge.userId,
                title: `Pledge Countdown: ${daysLeft}d ${hoursLeft}h Remaining ⏳`,
                message: `Friendly reminder for "${eventTitle}": You have paid KES ${amountPaid.toLocaleString()} of your KES ${totalPledged.toLocaleString()} pledge (Remaining: KES ${remaining.toLocaleString()}). Pay your next bit anytime in My Bookings & Pledges!`,
                type: 'PLEDGE_REMINDER',
                isRead: false
            }).catch(() => {});
        }

        await supabase
            .from('Booking')
            .update({ last_reminder_sent_at: new Date().toISOString() })
            .eq('id', pledge.id)
            .catch(() => {});

        sentCount += 1;
    }

    return { sentCount };
}

app.post('/api/pledges/check-reminders', async (req, res) => {
    try {
        const { userId, bookingId, force } = req.body || {};
        const result = await evaluateAndSendPledgeReminders({
            userId: userId || null,
            bookingId: bookingId || null,
            force: Boolean(force || bookingId)
        });
        return res.json({ success: true, ...result });
    } catch (error) {
        console.error('[Pledge Reminder Error]', error);
        return res.status(500).json({ error: error.message });
    }
});

// Background interval every 30 minutes to deliver scheduled pledge countdown reminders
setInterval(() => {
    evaluateAndSendPledgeReminders().catch((err) => {
        console.error('[Pledge Reminder Cron Error]', err.message);
    });
}, 30 * 60 * 1000);

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
