# GigConnect

GigConnect is a full-stack local services marketplace for Indian users. It helps clients discover nearby professionals, compare service options, create booking requests, and manage activity through dedicated client and professional dashboards.

## Overview

- Search local professionals by service and location
- Compare pricing, experience, ratings, and verification
- Create booking requests with INR budgets
- Manage live booking status through role-based dashboards
- Submit and display reviews after completed services
- Store contact form data, accounts, bookings, and reviews in Supabase

## Screenshots

### Home

![GigConnect home page](docs/screenshots/home.png)

### Professional Search

![GigConnect search page](docs/screenshots/search.png)

### Client Dashboard

![GigConnect client dashboard](docs/screenshots/client-dashboard.png)

### Professional Dashboard

![GigConnect professional dashboard](docs/screenshots/professional-dashboard.png)

## Core Features

### Public experience

- Premium landing page with quick search
- Service discovery and featured professionals
- Contact page for inquiries

### Client experience

- Client signup and login
- Booking request creation
- Dashboard for tracking request status
- Rating and review submission for completed services

### Professional experience

- Professional registration and login
- Service mapping with pricing
- Dashboard for incoming requests
- Booking status updates for pending and confirmed work

## Tech Stack

- Node.js
- Express.js
- EJS
- Supabase (PostgreSQL)
- Express Session
- bcryptjs

## Project Structure

- `app.js` - Express app entry point and routes
- `views/` - EJS pages, layout, and partials
- `public/` - static assets, frontend JavaScript, and styling
- `lib/` - Supabase access and application data helpers
- `data/` - content and seed data
- `database/schema.sql` - reference schema for Supabase PostgreSQL

## Local Setup

1. Clone the repository
2. Install dependencies
3. Create a [Supabase](https://supabase.com) project
4. Copy `.env.example` to `.env` and add your Supabase credentials
5. Start the app (schema and seed data are applied automatically on first run)

```bash
npm install
npm start
```

Open:

```text
http://localhost:3000
```

## Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Open **Project Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`
3. Open **Project Settings → Database → Connection string**
   - Choose **URI** and copy the connection string → `DATABASE_URL`
   - For production/server apps, use the **Transaction pooler** string (port `6543`)
4. Start the app — tables, views, triggers, and demo data are bootstrapped automatically

Alternatively, you can run `database/schema.sql` manually in the Supabase SQL Editor before starting the app.

## Environment Variables

Create a `.env` file using `.env.example` and configure:

```env
PORT=3000
SESSION_SECRET=your-secret
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres.your-project-ref:password@aws-0-region.pooler.supabase.com:6543/postgres
```

## Demo Accounts

### Client

- Email: `rahul.khanna@gigconnect.in`
- Password: `Client@123`

### Professional

- Email: `ravi.kumar@gigconnect.in`
- Password: `Pro@123`

## Database Notes

- The app bootstraps schema and seed data automatically when valid Supabase credentials are available.
- If Supabase is unavailable, the UI can still open in limited fallback mode.
- Live authentication, bookings, reviews, and contact storage require a working Supabase connection.

## Highlights

- Indian service categories and INR pricing
- Role-based client and professional flows
- Dynamic Supabase-backed search, booking, and dashboard data
- Clean EJS structure with reusable layouts and partials
