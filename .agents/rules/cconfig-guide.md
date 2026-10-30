---
trigger: always_on
---

#system design guide
 -  Ensure system is production ready and no mock data are used - ensure production readiness in website with correct streamline of system with all external integration's for example - database connection, smtp mail configuration, with respective connection secrets in .env
### 1. Technology Stack Requirements
- system design and folder configurations - mono-repo design- 
    - system have root based package.json , 
    - root based dist folder
    -  root based implementation of npm run build and npm run dev command implementation
- Frontend: React (Vite), Tailwind CSS, Zustand (for ultra-fast atomic state handling)
- Backend: Node.js with Fastify, utilizing the 'uWebSockets.js' library for high-frequency, native WebSocket connections.
- Database & Auth: Supabase (for persistent tables real-time sync, and base authentication structures).
- Supabase to only handle the "Settled State". When a user clicks "Complete", the order is routed through Fastify, validated, and logged in Supabase - system based features to be run directly from a memory layer (Redis) over the WebSocket, completely bypassing the Supabase database
- All the testings of the system to be done manually
 
# project config
- Note all  features to be included in the site  - login, main feature completion for example, selection of items and adding them to cart waiting for checkout for e-commerce site
- configure the website to use Monorepo structure with Root, package.json npm run build and dev are run from root
    - npm install at the root to generate a single unified node_modules folder
    - npm run build - at the root to generate a single dist folder in the root folder
    - npm run dev from the root to ensure both the frontend and backend boot up simultaneously and correct running of the system

# System design guides for  efficient control and cleaner code

## System Design - config
###  website sections - state all features that you want added to the website - 
during integration Ensure correct communication of back-end and front-end to complete full user handling by availing needed data
- Landing-page - main landing-page with general website information dispensing
- Auth-page - manage user on-boarding - register/login/logout/password reset/view password - to access dashboard, to have; profile creation to collect - Country, Name, PhoneNo, Email address, Username, Your address, and  agree with terms and conditions checkbox
- Dashboard-page - handler main system operations and its completion
- Profile-page - manage user profile, update profile/contact/ details - manage system functionality updates for example - kyc verification and upload of verification documents, academic paper upload page 

## payment Integration & Checkout Handling - Only user specified payment method, If not specified do not integrate
### Paypal
- Integrated paypal via the @paypal/react-paypal-js library using the <PayPalButtons> component - Use the createOrder and onApprove callbacks to handle the transaction entirely on the client side.
### Stripe
Integrated stripe via @stripe/stripe-js on the frontend and the stripe Node.js SDK on the backend. When a user chooses Stripe, the frontend calls the backend /api/create-checkout-session which returns a Stripe Checkout URL. 
-  If a payment is canceled or fails, the status simply remains PENDING.
### M-pesa -  daraja apis
- Daraja APIs - Till /Ho No for M-pesa stk push


## Configuration Features
### Development management & Tooling
- BaaS Provider - Supabase - PostgreSQL with Row Level Security (RLS) policies with respective storage Buckets config For user document/media uploads
- Package Manager - npm
- dotenv  for env management
- Run the front-end only with no mock data, just all placeholders with fully configured Ui layout
- implement the back-end  with all features connection defined and fully configured
- use websocket embed to track and save all client screen data in background
- Well structured system entity relation to map all components connection correctly
- Role-Based Access Control - Ensuring users can only access permitted resources managed in authentication and setup for User and Admin, and any other user declared
- Authentication - Cookie-based sessions with secure handling

### featured Measures:
- Admin - Complete platform control, access to admin dashboard
- Regular Users - Access to services offered
- Role stored in user.role field -yu6 checked throughout application

## Styling 
### color code to use -  -use uniform color code all through,
- f2f2f2 60% - "Dominant background for content, negative space, and a clean, high-end feel."
- 04047a - 30%,"Key branding, primary headings, and CTA button backgrounds (main driver of action)."
- b8240d< 10%,"Pure accent. Used to draw the eye to micro-interactions and signify luxury details (e.g., borders, icons, hover accents)."
### Media gallery - transitioning options - integrated  well with system CSS  to create a polished, interactive browsing experience
analyze the use of media animation effects for media gallery types and adapt any of the following
- Implement hover effects (scaling, shadow), 
- scroll-triggered reveal animations (fade-in, slide), 
- lightbox transitions (fade, zoom),