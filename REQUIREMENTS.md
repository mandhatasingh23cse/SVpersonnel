# SV PERSONNEL 2.0 — Complete Workforce Technology Platform

Act as a senior software architect, full-stack developer, mobile application developer, UI/UX designer, database architect, cybersecurity engineer, DevOps engineer, and product manager.

Your objective is to transform my existing website, https://svpersonnel.in/, into a complete, scalable, production-oriented, hyperlocal workforce and manpower services ecosystem.

The platform should be inspired by Pronto's instant household service booking model while expanding into professional services, permanent hiring, corporate staffing, manpower outsourcing, agency partnerships, workforce management, and recruitment.

Retain the existing SV Personnel brand identity, domain, business information, and service catalogue.

Do not build an unrelated application or merely redesign the homepage. Build a complete business operating system.

---

# MODULE 1: EXISTING PROJECT AUDIT

Before modifying the application:

- Inspect the existing codebase.
- Identify the frontend, backend, database and hosting infrastructure.
- Identify existing authentication and registration systems.
- Inspect all customer, professional and partner workflows.
- Identify incomplete functionality, security issues and technical debt.
- Preserve existing customer and worker data.
- Preserve working APIs and features wherever practical.
- Create a migration and rollback strategy.
- Maintain existing public URLs or implement proper redirects.
- Never delete existing data without explicit authorization.
- Back up the database before destructive migrations.
- Produce a gap analysis between the existing website and proposed platform.

---

# MODULE 2: BUSINESS VERTICALS

Organize the entire platform into four primary business verticals.

## A. Instant Household Services

Provide on-demand household workers with a target arrival time of 10–15 minutes in operationally supported service zones.

Services:

- Sweeping
- Mopping
- Dusting
- Dishwashing
- Laundry
- Ironing
- Folding clothes
- Kitchen assistance
- Cooking assistance
- Bathroom cleaning
- Balcony cleaning
- Window cleaning
- Refrigerator cleaning
- Fan cleaning
- Wardrobe organization
- Gardening
- Car exterior cleaning
- Party preparation
- Post-party cleaning
- Packing and unpacking
- General household assistance

Booking duration:

- 30 minutes
- 1 hour
- 1.5 hours
- 2 hours
- 3 hours
- 4 hours
- Custom duration

Allow customers to combine multiple tasks into a single booking.

Administrators must control the hourly pricing.

Display realistic arrival estimates based on actual worker availability. Never advertise guaranteed instant availability where it cannot be fulfilled.

## B. Professional Services

Provide skilled professionals for task-based, hourly, inspection-based or quotation-based services.

Examples:

- Electricians
- Plumbers
- Carpenters
- AC technicians
- HVAC technicians
- Solar technicians
- Mechanics
- Painters
- Appliance repair specialists
- Interior designers
- Tutors
- Religious service professionals
- Other skilled service professionals

Support inspection charges, quotations, spare parts, material charges, warranties and follow-up visits.

## C. Permanent Hiring

Allow customers to hire:

- Full-time maids
- Cooks
- Drivers
- Nannies
- Babysitters
- Caregivers
- Gardeners
- Office assistants
- Personal assistants
- Security guards
- Receptionists
- Other permanent staff

Support direct hiring, placement services, interview scheduling, salary negotiation, candidate shortlisting, offer acceptance and replacement guarantees.

## D. Corporate and Bulk Manpower

Provide B2B staffing and workforce outsourcing.

Support:

- Hospitals
- Hotels
- Restaurants
- Factories
- Offices
- Warehouses
- Construction companies
- Residential societies
- Schools
- Retail stores
- Event organizers
- Logistics companies

Businesses should be able to request one worker or hundreds of workers.

Support shift management, attendance, payroll calculations, workforce contracts, monthly invoices, statutory compliance records, and replacement requests.

---

# MODULE 3: EXISTING SERVICE CATALOGUE

Preserve all 15 existing SV Personnel categories:

1. Healthcare and Hospital Staffing
2. Security Services
3. Housekeeping and Facility Management
4. Office and Corporate Staff
5. Industrial and Factory Workforce
6. Construction and Civil Workers
7. Technical and Maintenance Staff
8. Hospitality and Hotel Staff
9. Domestic and Personal Staff
10. Logistics and Transportation
11. Retail and Sales Staff
12. Event Management Staff
13. Education Staffing
14. Agriculture and Farming Staff
15. Pandit and Religious Services

Add Instant Household Help as a dedicated service vertical.

Build a dynamic category and subcategory management system.

Each service must contain configurable fields:

- Service name
- Description
- Images
- Required skills
- Required certifications
- Verification requirements
- Minimum experience
- Booking types
- Pricing type
- Base price
- Minimum duration
- Availability rules
- Service zones
- Required equipment
- Cancellation rules
- Subscription eligibility
- Commission percentage
- Tax classification
- Insurance eligibility
- Risk classification

Support regulated services only after appropriate qualifications, licenses, permissions and compliance requirements have been verified.

Do not treat healthcare emergencies or high-risk licensed services as ordinary instant household bookings.

---

# MODULE 4: USER ROLES AND ACCESS CONTROL

Implement role-based and permission-based authorization.

User roles:

- Individual Customer
- Corporate Customer
- Worker
- Skilled Professional
- Manpower Agency Partner
- Society Manager
- Field Supervisor
- City Operations Manager
- Customer Support Executive
- Verification Officer
- Finance Manager
- Recruiter
- Administrator
- Super Administrator

Allow a single user to hold multiple authorized roles where appropriate.

Create custom roles and configurable permissions.

All administrative permissions must be enforced through backend authorization, not just hidden frontend buttons.

---

# MODULE 5: CUSTOMER APPLICATION

Create a responsive customer web application, Progressive Web App and mobile application.

Features:

- Mobile number OTP registration
- Email registration
- Profile management
- Saved addresses
- Location detection with permission
- Manual address selection
- Society and apartment information
- Serviceability checking
- Intelligent service search
- Voice-assisted search
- Service recommendation
- Service categories
- Service details
- Shopping cart for multiple tasks
- Booking history
- Repeat booking
- Favourite professionals
- Preferred workers
- Saved payment methods through payment providers
- Notifications
- Referral system
- Loyalty credits
- Coupons
- Subscription management
- Support tickets
- Emergency safety assistance
- Account deletion
- Privacy controls

Provide four prominent homepage actions:

- Book Instant Help
- Find a Professional
- Hire Permanent Staff
- Hire Bulk Manpower

---

# MODULE 6: BOOKING ENGINE

Support the following booking models:

- Instant booking
- Scheduled booking
- Hourly booking
- Task-based booking
- Recurring booking
- Daily booking
- Weekly booking
- Monthly booking
- Shift-based booking
- Contractual hiring
- Permanent hiring
- Inspection booking
- Quotation-based booking
- Bulk hiring

Implement a centralized booking state machine.

Booking states:

- Draft
- Pending Payment
- Confirmed
- Searching for Worker
- Worker Assigned
- Worker Accepted
- On the Way
- Arrived
- Waiting for Start OTP
- Service In Progress
- Extension Requested
- Service Paused
- Waiting for Completion
- Completed
- Settlement Pending
- Settled
- Cancelled
- Replacement Required
- Disputed
- Refund Pending
- Refunded

Every state transition must have authorization, validation, timestamps and audit history.

Prevent invalid status changes, duplicate bookings and overlapping assignments.

---

# MODULE 7: INTELLIGENT WORKER DISPATCH

Build a hyperlocal worker assignment engine.

Match workers using:

- Current service zone
- Distance from customer
- Estimated travel time
- Availability
- Skills
- Qualification
- Verification status
- Existing assignments
- Worker working-hour limits
- Customer preferences
- Worker preferences
- Ratings
- Previous customer experience
- Punctuality and reliability
- Agency affiliation
- Equipment availability

Dispatch workflow:

1. Check serviceability and available capacity.
2. Calculate the required worker skills.
3. Identify eligible nearby workers.
4. Rank eligible workers using transparent matching criteria.
5. Send booking request to an eligible worker.
6. Start an acceptance countdown.
7. Automatically offer the request to another worker if declined or expired.
8. Confirm the first valid acceptance atomically.
9. Notify customer.
10. Begin active booking tracking.

Include configurable assignment timeout, retry limits, search radius and escalation rules.

Provide manual assignment and reassignment through the operations panel.

Avoid discriminatory matching and unfair automatic worker penalties.

---

# MODULE 8: LIVE GPS TRACKING

Implement real-time location tracking for active service assignments.

Customer tracking screen must display:

- Assigned worker name
- Profile photograph
- Verification badge
- Vehicle details where applicable
- Current worker location
- Customer service location
- Estimated arrival time
- Remaining distance
- Route progress
- Last location update
- Booking status
- Masked calling
- In-app messaging
- Support and SOS controls

Worker application should support background location tracking during authorized active assignments.

Use:

- Google Maps or Mapbox
- Location permissions
- Geolocation APIs
- WebSockets
- Redis for latest active location
- Geospatial matching
- Geofencing

Privacy requirements:

- Track workers only within explicitly authorized operational periods.
- Do not expose worker home addresses.
- Stop customer-facing location tracking when the assignment ends.
- Show stale-location warnings rather than fabricated movement.
- Minimize stored GPS history.
- Encrypt sensitive location records.
- Implement consent and configurable retention periods.

Admin live tracking dashboard must show active assignments, available workers, delayed bookings and service zones without exposing unnecessary private information.

---

# MODULE 9: OTP SERVICE VERIFICATION

Implement separate secure OTP workflows for:

- Customer login
- Worker login
- Agency login
- Mobile verification
- Start-service confirmation
- Service-completion confirmation
- Permanent hiring joining confirmation
- Sensitive account changes

Service workflow:

1. Worker arrives at the service location.
2. Worker marks arrival.
3. Geofence check runs where permitted.
4. Customer receives a start-service OTP.
5. Worker enters the OTP.
6. Backend validates the OTP.
7. Service timer begins.
8. Worker completes tasks.
9. Customer reviews service duration and additional charges.
10. Customer provides completion OTP.
11. Backend validates completion.
12. Settlement is processed according to payment rules.

Implement:

- OTP expiration
- Resend cooldown
- Attempt limits
- One-time OTP consumption
- Hashed OTP storage
- Booking-specific OTP binding
- Audit logging
- Admin-assisted fallback for legitimate OTP failures
- Fraud detection

Never display the customer OTP inside the worker application.

---

# MODULE 10: SERVICE TIMER AND ATTENDANCE

Build a real-time server-authoritative service timer.

Display:

- Scheduled start time
- Actual start time
- Booked duration
- Remaining time
- Elapsed time
- Authorized breaks
- Overtime
- Expected completion time
- Additional approved charges

Allow customers to request service extensions.

Before approving an extension:

- Check the worker's availability.
- Check the next scheduled assignment.
- Calculate the additional price.
- Obtain customer and worker confirmation.
- Process additional billing.
- Update the booking duration.

For corporate staff, include:

- Site attendance
- QR code attendance
- OTP attendance
- Consent-based geofence attendance
- Check-in and check-out
- Shift scheduling
- Leave requests
- Overtime
- Late arrival records
- Attendance correction requests
- Supervisor approval
- Monthly timesheets

---

# MODULE 11: WORKER APPLICATION

Create a dedicated mobile-first worker application.

Features:

- Mobile OTP login
- Multilingual onboarding
- Identity verification
- Profile photo
- Skills and service registration
- Experience
- Qualification documents
- Training modules
- Online and offline availability toggle
- Working-hour schedule
- Preferred service zones
- Incoming booking requests
- Booking acceptance countdown
- Navigation to customer
- In-app messaging
- Masked calling
- Arrival confirmation
- Start-service OTP entry
- Live service timer
- Task checklist
- Service extension requests
- Completion OTP entry
- Earnings dashboard
- Daily and weekly earnings
- Payment history
- Incentives
- Referral rewards
- Bank account information
- Payout tracking
- Ratings and feedback
- Safety reporting
- SOS assistance
- Leave and break management
- Complaints
- Account appeals

Workers must be able to decline assignments and report unsafe working conditions.

Provide a transparent breakdown of earnings, deductions and commissions.

---

# MODULE 12: AUTOMATED KYC AND VERIFICATION

Create a comprehensive verification system.

Verification categories:

- Mobile number verification
- Email verification
- Government identity verification
- PAN verification where applicable
- Address verification
- Bank account verification
- Consent-based selfie matching where lawful
- Background verification
- Police verification where applicable
- Employment history verification
- Professional qualification verification
- Driving license verification
- Business registration verification
- GST verification where applicable
- Required industry-specific licenses

Verification statuses:

- Not Submitted
- Pending
- Processing
- Manual Review
- Verified
- Rejected
- Expiring Soon
- Expired
- Suspended

Integrate authorized verification providers through modular adapters.

Possible integrations include DigiLocker-supported document flows and authorized KYC/background-screening providers.

Do not claim verification has succeeded unless the provider confirms it.

Implement document expiry reminders, duplicate-account detection, manual review, rejection reasons and resubmission.

Never require or store unnecessary Aadhaar information. Use only legally permitted verification methods.

Protect sensitive documents with encryption, private storage, short-lived signed URLs and strict access permissions.

---

# MODULE 13: TRAINING AND QUALITY MANAGEMENT

Build a worker learning and certification system.

Include:

- Training videos
- Service instructions
- Safety training
- Customer communication training
- Hygiene standards
- Service-specific quizzes
- Practical assessment records
- Training completion certificates
- Skill badges
- Certification expiry
- Refresher courses

Only assign workers to services for which they meet required qualification and training criteria.

Track complaints, service quality and recurring customer feedback.

Provide human review and an appeals process before significant worker account restrictions.

---

# MODULE 14: CUSTOMER SUBSCRIPTIONS

Create flexible recurring service plans.

Examples:

- Daily Household Help
- Weekly Cleaning
- Monthly Household Plan
- Daily Kitchen Assistance
- Premium Home Care
- Multi-Service Family Plan
- Senior Citizen Assistance Plan
- Custom Service Plan

Allow customers to configure:

- Number of visits
- Duration per visit
- Service frequency
- Preferred days
- Preferred time slots
- Preferred worker
- Multiple addresses
- Subscription start date
- Eligible services
- Automatic renewal
- Prepaid or per-visit billing

Subscription features:

- Pause subscription
- Resume subscription
- Skip visit
- Reschedule visit
- Upgrade plan
- Downgrade plan
- Cancel plan
- Change preferred worker
- Subscription renewal reminders
- Replacement worker when required
- Transparent billing
- Credit expiry rules
- Refund calculation

Generate recurring bookings automatically using reliable scheduled background jobs.

Prevent duplicate recurring bookings.

Check capacity before selling recurring service commitments.

---

# MODULE 15: AGENCY PARTNER PORTAL

Create a complete agency operating dashboard.

Agency onboarding:

- Agency name
- Owner details
- Registered address
- Operating cities
- Service zones
- Business documents
- Bank verification
- Relevant licenses
- GST details where applicable
- Service categories
- Workforce capacity

Agency workforce management:

- Invite workers
- Create worker onboarding requests with consent
- Assign workers to agency teams
- Maintain worker profiles
- Track verification status
- Manage availability
- Assign bookings
- Monitor active assignments
- Manage shifts
- View attendance
- Manage worker replacements
- Track earnings
- Review payouts
- Generate reports
- Bulk-import worker records

Agencies must not own or control workers' personal accounts without their knowledge.

Workers should retain access to their profiles and personal information.

Allow safe agency affiliation changes and prevent unauthorized deductions or record changes.

---

# MODULE 16: AGENCY SUBSCRIPTIONS AND LEAD MARKETPLACE

Create configurable agency subscription plans.

Plan benefits may include:

- Monthly lead credits
- Workforce management limits
- Premium analytics
- Multiple branch support
- Priority placement
- Reduced service commission
- Bulk hiring opportunities
- Advanced reporting
- Dedicated account support

Allow agencies to discover customer requirements within their authorized service areas.

Display lead previews containing:

- Required worker category
- Approximate location
- Salary range
- Number of workers required
- Employment type
- Expected joining date
- Requirement description

Hide customer contact details until an authorized lead-unlocking transaction occurs.

Only unlock contact details when the customer has consented to agency contact.

Support:

- Pay-per-lead
- Lead credit packages
- Subscription-included leads
- Agency wallet ledger
- Purchase history
- Refund requests
- Invalid lead reporting
- Duplicate purchase prevention
- Limited-access windows
- Lead expiration
- Lead conversion analytics

---

# MODULE 17: PERMANENT HIRING AND JOB PORTAL

Build a complete job and recruitment module.

Clients can:

- Post job requirements
- Select employment type
- Set salary range
- Set location
- Describe responsibilities
- Specify qualifications
- Receive applications
- Shortlist candidates
- Schedule interviews
- Request agency assistance
- Negotiate offers
- Hire candidates
- Request replacements

Workers and professionals can:

- Browse jobs
- Filter by location and salary
- Apply for positions
- Upload resumes
- Track application status
- Receive interview invitations
- Accept offers
- Confirm joining

Agencies can:

- Discover job requirements
- Submit candidate profiles with consent
- Schedule interviews
- Submit commercial quotations
- Track placements
- Receive placement payments
- Manage replacement obligations

Application stages:

- Applied
- Screening
- Shortlisted
- Interview Scheduled
- Interview Completed
- Offer Released
- Offer Accepted
- Joined
- Rejected
- Withdrawn
- Replacement Requested

---

# MODULE 18: CORPORATE MANPOWER MANAGEMENT

Create a B2B enterprise dashboard.

Features:

- Corporate registration
- Organization verification
- Multiple office locations
- Department management
- Authorized HR and site managers
- Bulk manpower requirements
- Requests for quotations
- Agency bidding
- Contract management
- Worker deployment
- Shift planning
- Attendance monitoring
- Supervisor assignments
- Replacement requests
- Monthly timesheets
- Payroll calculations
- Overtime reports
- Compliance document management
- Service-level agreements
- Monthly invoicing
- Purchase orders
- Payment reconciliation
- Workforce performance reports

Support organization-specific access permissions and strict tenant isolation.

---

# MODULE 19: PRICING ENGINE

Create a centralized, administrator-controlled pricing engine.

Support:

- Hourly pricing
- Half-hour pricing
- Fixed task pricing
- Per-visit pricing
- Quotation-based pricing
- Inspection charges
- Shift pricing
- Daily wages
- Monthly contract pricing
- Permanent placement fees
- Subscription pricing
- Lead-unlocking charges

Pricing rules:

- City-based pricing
- Zone-based pricing
- Peak-hour pricing
- Weekend pricing
- Holiday pricing
- Minimum booking duration
- Urgency charges
- Material charges
- Travel charges
- Approved overtime
- Coupons
- Loyalty discounts
- Taxes
- Platform commission

Store a permanent price snapshot for every confirmed booking.

Provide customers with a complete price breakdown before confirmation.

No hidden charges.

---

# MODULE 20: PAYMENT, FINANCE AND PAYOUTS

Integrate Razorpay or another suitable payment provider.

Support:

- UPI
- Cards
- Net banking
- Payment links
- Recurring payments
- Supported payment mandates
- Corporate invoices
- Refunds
- Partial refunds
- Promotional credits
- Subscription payments
- Lead-credit payments
- Worker payouts
- Agency payouts

Build a financial ledger system.

Track:

- Gross booking value
- Discounts
- Taxes
- Platform commission
- Worker earnings
- Agency earnings
- Cancellation charges
- Refunds
- Payout adjustments
- Payment processing fees
- Net platform revenue

Implement verified webhooks, idempotency, payment reconciliation and tamper-resistant transaction records.

Use appropriate licensed payment products for collecting, splitting and settling funds.

Do not create an unregulated transferable customer wallet.

Provide downloadable invoices and payout statements.

---

# MODULE 21: REVENUE STREAMS

Build configurable revenue models for:

1. Commission on household bookings
2. Commission on professional services
3. Customer subscription plans
4. Agency subscription plans
5. Professional subscription plans
6. Paid qualified leads
7. Permanent placement fees
8. Corporate manpower contracts
9. Workforce management software fees
10. Premium listing fees
11. Enterprise service agreements
12. Property and society management plans
13. Optional training packages
14. Verified partner programmes
15. Optional insurance partnerships through authorized providers

Track every revenue source separately.

Allow administrators to enable or disable individual monetization methods.

Clearly distinguish platform revenue from total transaction value and worker earnings.

---

# MODULE 22: COMMUNICATION SYSTEM

Implement:

- Real-time in-app chat
- Customer-worker communication
- Customer-agency communication
- Worker-agency communication
- Admin-user communication
- Corporate staffing communication
- Masked phone calls
- Push notifications
- SMS notifications
- Email notifications
- Optional WhatsApp Business integration

Notification events:

- Booking confirmed
- Worker assigned
- Worker approaching
- Worker arrived
- OTP generated
- Service started
- Service ending
- Service completed
- Payment received
- Refund processed
- Subscription renewal
- Verification update
- New job application
- Interview scheduled
- Lead purchased
- Payout completed

Implement delivery status, retry handling, user notification preferences and consent management.

---

# MODULE 23: SAFETY AND TRUST

Implement:

- Verified worker profiles
- Customer verification
- Emergency support
- SOS button
- Trusted-contact service sharing
- Booking details sharing
- Masked personal contact information
- Incident reporting
- Harassment reporting
- Unsafe-location reporting
- Worker and customer blocking
- Dispute management
- Fraud monitoring
- Emergency escalation workflow

Support optional before-and-after service photographs with explicit consent.

Do not implement continuous camera or audio surveillance by default.

Any future recording features must undergo separate legal, privacy and security review.

Provide support escalation for both customers and workers.

---

# MODULE 24: QUALITY, REVIEWS AND DISPUTES

Implement two-sided ratings.

Customers can review workers and agencies.

Workers can provide private safety and assignment feedback.

Include:

- Punctuality
- Professional behaviour
- Work quality
- Task completion
- Communication
- Overall satisfaction

Dispute management:

- Complaint submission
- Booking evidence
- Secure attachment upload
- Support ticket assignment
- Investigation
- Resolution
- Refund approval
- Replacement approval
- Appeal mechanism

Prevent fake reviews by requiring a verified booking or completed placement.

Do not automatically suspend workers solely because of a single low rating.

---

# MODULE 25: ADMIN SUPER DASHBOARD

Build a comprehensive centralized administrative dashboard.

Overview metrics:

- Total customers
- Total workers
- Online workers
- Available workers
- Active agencies
- Verified professionals
- Active bookings
- Pending assignments
- Completed services
- Cancelled bookings
- Replacement requests
- Active subscriptions
- Job postings
- Corporate contracts
- Total transaction value
- Platform revenue
- Pending payouts
- Refund requests
- Customer retention

Admin modules:

- Customer management
- Worker management
- Agency management
- Corporate management
- Service catalogue
- Pricing management
- Booking management
- Hiring management
- Subscription management
- Lead management
- Wallet and ledger management
- Payment reconciliation
- Payout management
- Verification management
- Training management
- Complaints and disputes
- Marketing and coupons
- Referral management
- Notification templates
- CMS
- City management
- Service zone management
- User roles and permissions
- System configuration
- Audit logs
- Reports and exports

Use real database-driven statistics.

---

# MODULE 26: CITY OPERATIONS AND SERVICE HUBS

Create a dedicated city operations panel.

Administrators can define:

- Countries
- States
- Cities
- PIN codes
- Service zones
- Geographic polygons
- Residential societies
- Worker hubs
- Service operating hours
- Available service categories
- Maximum booking capacity
- Worker deployment targets

Operations dashboard:

- Live demand map
- Worker supply map
- Active bookings
- Delayed bookings
- Unassigned bookings
- Upcoming subscriptions
- Zone-wise service capacity
- Worker attendance
- Worker hub assignments
- Manual dispatch
- Automatic dispatch
- Worker replacement
- Shift planning

Include demand forecasting to help operations managers deploy workers closer to expected customer demand.

Do not advertise instant service in inactive or unsupported areas.

---

# MODULE 27: AI AND AUTOMATION

Introduce practical AI-powered features.

- Natural-language service search
- English and Hindi booking assistant
- Service recommendation
- Worker matching assistance
- Estimated job duration
- Suggested professional quotations
- Customer support chatbot
- Complaint categorization
- Smart FAQ suggestions
- Demand forecasting
- Workforce capacity forecasting
- Duplicate profile detection assistance
- Anomaly detection
- Document extraction assistance
- Automated recurring booking generation
- Automated booking reminders
- Automated replacement suggestions
- Automated subscription renewal reminders
- Automated report generation

AI must not independently approve KYC, make unsafe staffing decisions, finalize high-impact worker penalties or determine regulated professional eligibility.

Sensitive decisions require validated rules and appropriate human oversight.

---

# MODULE 28: MARKETING AND CUSTOMER RETENTION

Implement:

- Referral codes
- First-booking discounts
- Promotional campaigns
- Seasonal offers
- Loyalty credits
- Subscription upgrade offers
- Gift vouchers
- Society-specific promotions
- Corporate partner offers
- Abandoned booking reminders with consent
- Customer segmentation
- Campaign analytics
- Landing page management
- SEO-friendly service pages
- City-specific service pages

Include opt-out controls for marketing communication.

---

# MODULE 29: UI/UX DESIGN

Maintain the SV Personnel brand.

Create a premium mobile-first user experience inspired by the convenience of Pronto, the service discovery of modern home-service platforms and the recruitment functionality of job portals.

Do not copy competitor logos, proprietary assets or exact interfaces.

Design guidelines:

- Clean typography
- Minimal visual clutter
- Consistent brand colours
- Accessible interfaces
- Clear booking actions
- Modern cards
- Consistent spacing
- Professional icons
- Responsive grids
- Skeleton loading
- Empty states
- Toast notifications
- Helpful validation messages
- Accessible colour contrast

Customer mobile navigation:

- Home
- Services
- Bookings
- Subscriptions
- Profile

Worker mobile navigation:

- Home
- Jobs
- Earnings
- Schedule
- Profile

Agency desktop navigation:

- Overview
- Workforce
- Bookings
- Leads
- Recruitment
- Subscriptions
- Finance
- Reports
- Settings

Provide English and Hindi language support with an expandable localization architecture.

---

# MODULE 30: TECHNOLOGY STACK

Prefer preserving the existing technology stack if it is secure and maintainable.

If rebuilding is justified, use the following architecture.

Public website and customer web application:

- Next.js
- React
- TypeScript
- Tailwind CSS
- ShadCN UI
- Progressive Web App

Mobile applications:

- React Native
- Expo
- Supported native background location services
- Push notifications

Admin, agency and corporate portals:

- Next.js
- TypeScript
- Shared component library

Backend:

- Node.js
- NestJS
- TypeScript
- REST APIs
- OpenAPI documentation
- WebSockets
- Modular service architecture

Database:

- MySQL 8
- Prisma ORM
- Database migrations
- Transactions
- Indexes
- Spatial location support where appropriate

Infrastructure:

- Redis
- BullMQ background jobs
- Object storage
- Docker
- Nginx
- GitHub Actions
- Error monitoring
- Automated backups

External integrations:

- Maps provider
- Payment gateway
- SMS and OTP provider
- Firebase Cloud Messaging
- Email provider
- Authorized verification provider
- Background screening provider
- Cloud storage

Start with a modular monolith rather than unnecessarily introducing many independently deployed microservices.

Maintain module boundaries that allow future extraction into separate services.

---

# MODULE 31: COMPLETE PROJECT FOLDER STRUCTURE

Use a scalable monorepo architecture.

```text
sv-personnel/
├── apps/
│   ├── website/
│   ├── customer-web/
│   ├── customer-mobile/
│   ├── worker-mobile/
│   ├── agency-portal/
│   ├── corporate-portal/
│   ├── admin-panel/
│   ├── operations-panel/
│   └── api/
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── users/
│       │   │   ├── permissions/
│       │   │   ├── customers/
│       │   │   ├── workers/
│       │   │   ├── professionals/
│       │   │   ├── agencies/
│       │   │   ├── corporate/
│       │   │   ├── societies/
│       │   │   ├── services/
│       │   │   ├── categories/
│       │   │   ├── bookings/
│       │   │   ├── dispatch/
│       │   │   ├── availability/
│       │   │   ├── tracking/
│       │   │   ├── geofencing/
│       │   │   ├── otp/
│       │   │   ├── attendance/
│       │   │   ├── shifts/
│       │   │   ├── kyc/
│       │   │   ├── documents/
│       │   │   ├── training/
│       │   │   ├── pricing/
│       │   │   ├── subscriptions/
│       │   │   ├── recurring-bookings/
│       │   │   ├── payments/
│       │   │   ├── refunds/
│       │   │   ├── payouts/
│       │   │   ├── commissions/
│       │   │   ├── invoices/
│       │   │   ├── ledger/
│       │   │   ├── leads/
│       │   │   ├── jobs/
│       │   │   ├── recruitment/
│       │   │   ├── interviews/
│       │   │   ├── contracts/
│       │   │   ├── payroll/
│       │   │   ├── chat/
│       │   │   ├── notifications/
│       │   │   ├── coupons/
│       │   │   ├── referrals/
│       │   │   ├── loyalty/
│       │   │   ├── reviews/
│       │   │   ├── disputes/
│       │   │   ├── support/
│       │   │   ├── safety/
│       │   │   ├── analytics/
│       │   │   ├── reports/
│       │   │   ├── ai/
│       │   │   ├── cities/
│       │   │   ├── zones/
│       │   │   ├── cms/
│       │   │   ├── audit/
│       │   │   └── admin/
│       │   ├── common/
│       │   │   ├── guards/
│       │   │   ├── decorators/
│       │   │   ├── filters/
│       │   │   ├── interceptors/
│       │   │   ├── middleware/
│       │   │   └── validation/
│       │   ├── integrations/
│       │   ├── config/
│       │   ├── queues/
│       │   ├── database/
│       │   ├── app.module.ts
│       │   └── main.ts
│       └── test/
├── packages/
│   ├── ui/
│   ├── types/
│   ├── api-client/
│   ├── database/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   ├── validation/
│   ├── authentication/
│   ├── localization/
│   ├── configuration/
│   └── utilities/
├── infrastructure/
│   ├── docker/
│   ├── nginx/
│   ├── monitoring/
│   └── deployment/
├── docs/
│   ├── architecture/
│   ├── api/
│   ├── database/
│   ├── user-flows/
│   ├── security/
│   ├── compliance/
│   └── deployment/
├── scripts/
├── tests/
├── .github/workflows/
├── .env.example
├── docker-compose.yml
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
└── README.md
```

Adapt this structure based on the existing repository audit.

Do not create duplicate applications unnecessarily where shared layouts or role-based routes are sufficient.

---

# MODULE 32: DATABASE DESIGN

Create a normalized relational MySQL database.

Identity tables:

- users
- roles
- permissions
- user_roles
- role_permissions
- sessions
- otp_challenges
- consents

Profile tables:

- customer_profiles
- worker_profiles
- professional_profiles
- agencies
- agency_workers
- organizations
- organization_members
- addresses
- bank_account_references

Service tables:

- categories
- subcategories
- services
- service_tasks
- skills
- worker_skills
- worker_certifications
- service_requirements
- price_rules
- price_versions

Location and availability tables:

- cities
- service_zones
- worker_hubs
- societies
- worker_availability
- worker_shifts
- active_worker_locations
- location_events

Booking tables:

- bookings
- booking_items
- booking_assignments
- booking_status_history
- dispatch_requests
- booking_otps
- booking_extensions
- task_checklists
- service_sessions
- attendance_records

Verification tables:

- verification_requests
- verification_documents
- verification_results
- verification_audit_logs
- professional_licenses
- training_courses
- training_results

Subscription tables:

- subscription_plans
- plan_entitlements
- user_subscriptions
- recurring_schedules
- subscription_visits
- subscription_transactions

Recruitment tables:

- job_postings
- job_applications
- candidate_profiles
- interviews
- offers
- placements
- replacement_requests
- corporate_contracts

Financial tables:

- payments
- payment_attempts
- payment_webhooks
- refunds
- commissions
- financial_accounts
- ledger_entries
- payouts
- invoices
- invoice_items
- credit_transactions

Agency and lead tables:

- leads
- lead_purchases
- lead_consents
- agency_subscriptions
- quotations
- quotation_items

Communication tables:

- conversations
- conversation_members
- messages
- notifications
- notification_preferences

Support tables:

- reviews
- complaints
- disputes
- support_tickets
- safety_incidents
- evidence_attachments

Growth and administration tables:

- coupons
- coupon_redemptions
- referrals
- loyalty_transactions
- campaigns
- feature_flags
- audit_logs
- system_settings

Implement foreign keys, unique constraints, database indexes, appropriate soft deletion and financial transaction integrity.

Use UTC timestamps and display times in the user's local timezone.

Store monetary amounts using integer minor units or fixed-precision decimal types, never floating-point values.

---

# MODULE 33: API ARCHITECTURE

Create versioned REST APIs under /api/v1.

Provide API modules for:

- Authentication and OTP
- Customer profiles
- Worker onboarding
- Agency management
- Service discovery
- Location serviceability
- Availability
- Pricing quotation
- Booking creation
- Worker dispatch
- Tracking sessions
- Arrival confirmation
- Service start
- Service completion
- Booking extensions
- Booking cancellations
- Recurring schedules
- Subscription management
- KYC
- Job postings
- Job applications
- Interviews
- Lead discovery
- Lead unlocking
- Corporate contracts
- Attendance
- Payments
- Refunds
- Payouts
- Invoices
- Notifications
- Chat
- Reviews
- Support
- Admin analytics

Implement standardized response formats, input validation, pagination, filtering, sorting, idempotency keys and consistent error handling.

Document every endpoint using OpenAPI.

Use authenticated WebSocket channels for live tracking, booking updates and communication.

---

# MODULE 34: SECURITY AND PRIVACY

Implement:

- JWT or secure session-based authentication
- Refresh token rotation
- Password hashing using Argon2id or equivalent
- Administrator MFA
- Role-based access control
- Permission-based access control
- Tenant isolation
- API rate limiting
- OTP brute-force prevention
- SQL injection prevention
- XSS prevention
- CSRF protection where applicable
- Secure CORS configuration
- File upload validation
- Malware scanning
- Encryption in transit
- Encryption at rest
- Secret management
- Secure payment webhook verification
- Data retention policies
- Consent records
- Account deletion
- Security audit logs
- Backup encryption
- Disaster recovery

Follow applicable Indian data protection, consumer protection, labour, tax, licensing and payment requirements.

Do not claim legal compliance or display government authorization badges without supporting documentation.

Never expose private identity records or secret API credentials.

---

# MODULE 35: PERFORMANCE AND SCALABILITY

Implement:

- Database indexing
- Connection pooling
- Pagination
- Redis caching
- Background job queues
- Transactional assignment logic
- Efficient geospatial queries
- WebSocket scalability
- Optimized image loading
- CDN support
- Database backup automation
- Monitoring dashboards
- Error reporting
- Request tracing
- Health checks
- Retry mechanisms
- Dead-letter queues
- Graceful degradation

Load-test important endpoints including booking creation, dispatch, tracking and payment confirmation.

Design for expansion across multiple cities without hardcoding city-specific information.

---

# MODULE 36: TESTING

Create complete testing coverage for critical business workflows.

Include:

- Unit tests
- Integration tests
- End-to-end tests
- API tests
- Authentication tests
- Authorization tests
- Database migration tests
- Payment webhook tests
- OTP expiration tests
- Booking overlap tests
- Concurrent worker assignment tests
- Recurring booking tests
- Subscription cancellation tests
- Lead purchase tests
- Refund tests
- GPS permission tests
- Worker replacement tests
- Tenant isolation tests
- Responsive UI tests
- Accessibility tests

Use clearly labelled test accounts and sandbox payment credentials.

Do not mark a feature as complete unless its critical workflows are implemented and tested.

---

# MODULE 37: DEPLOYMENT

Create separate environments:

- Local development
- Testing
- Staging
- Production

Provide:

- Docker Compose
- MySQL setup
- Redis setup
- Environment variable templates
- Database migration scripts
- Seed data
- CI/CD pipelines
- HTTPS configuration
- Domain connection instructions
- Monitoring
- Automated backups
- Restore instructions
- Rollback strategy

Integrate the upgraded application with svpersonnel.in.

Potential subdomain architecture:

- svpersonnel.in — Public website
- app.svpersonnel.in — Customer application
- partner.svpersonnel.in — Agency portal
- business.svpersonnel.in — Corporate portal
- admin.svpersonnel.in — Administration
- ops.svpersonnel.in — Operations
- api.svpersonnel.in — Backend API

Protect internal dashboards using appropriate authentication and security controls.

---

# MODULE 38: DEVELOPMENT PHASES

Phase 1:

- Existing application audit
- Database architecture
- Authentication
- Roles and permissions
- Services and categories
- User profiles
- Admin foundation

Phase 2:

- Hourly household booking
- Pricing engine
- Worker onboarding
- Worker availability
- Dispatch engine
- Booking status management

Phase 3:

- GPS tracking
- Worker application
- OTP attendance
- Service timer
- Payments and payouts
- Reviews and support

Phase 4:

- Customer subscriptions
- Recurring bookings
- Agency portal
- Agency workforce management
- Paid leads

Phase 5:

- Professional services
- Quotations
- Permanent hiring
- Job portal
- Recruitment pipeline

Phase 6:

- Corporate staffing
- Bulk recruitment
- Shift management
- Attendance
- Contracts and corporate invoicing

Phase 7:

- Advanced KYC integrations
- Training modules
- Safety workflows
- AI assistance
- Marketing and analytics

Phase 8:

- Security audit
- Performance testing
- Operational pilot
- Production deployment
- Mobile application distribution

Core identity, safety and worker eligibility checks must be operational before accepting real customer bookings, even if advanced automation is delivered later.

---

# MODULE 39: FINAL DELIVERABLES

Deliver:

- Product requirements document
- Existing system audit
- Complete system architecture
- Database ER diagram
- Database schema
- Migration strategy
- User journey diagrams
- Booking state machine
- Role-permission matrix
- Complete frontend code
- Complete backend code
- Customer mobile application
- Worker mobile application
- Agency portal
- Corporate portal
- Admin panel
- Operations panel
- API documentation
- Automated tests
- Demo accounts
- Environment configuration
- Docker setup
- Deployment guide
- Security checklist
- Compliance checklist
- External integration requirements
- README with exact setup commands

# FINAL IMPLEMENTATION INSTRUCTIONS

Do not generate only a landing page or frontend dashboard.

Do not create fake APIs, non-functional buttons, hardcoded analytics, fake KYC results, fabricated GPS locations or simulated successful production payments.

Where external integrations require credentials, implement functional sandbox adapters clearly identified as test functionality.

Do not overwrite the existing application blindly.

Work in feature branches and maintain a changelog.

Before implementing each phase:

1. Explain the architecture.
2. List affected files.
3. Describe the database changes.
4. Implement the features.
5. Run the tests.
6. Report actual results.
7. List any unresolved dependencies.
8. Update documentation.

Continue until all planned modules are implemented or explicitly documented as deferred.

The final product should transform SV Personnel into a unified workforce platform capable of serving households, individuals, professionals, manpower agencies, residential societies and corporate organizations through one secure and scalable technology ecosystem.
