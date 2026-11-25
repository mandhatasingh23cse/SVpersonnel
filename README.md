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

## Workforce marketplace development
Use Node.js 24 and MySQL 8.4. Set STAFFING_MYSQL_URL to the development database connection URI. From the repo run:
```sh
npm ci
mysql -h "$MYSQL_HOST" -P "${MYSQL_PORT:-3306}" -u "$MYSQL_USER" -p "$MYSQL_DATABASE" < database/mysql-staffing.sql
npm start
```
Use the existing Supabase configuration for accounts and bookings. Visit /discover for search and /staffing for permanent or corporate hiring intake. See ROADMAP.md for planned modules.

### Deploying the current release on Render
Use the existing render.yaml Blueprint with a single web instance. Supply a dedicated Supabase project with database/schema.sql, schema_v2.sql and migrations v3 through v6 applied in order. Supply SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY through Render settings. Apply database/mysql-staffing.sql to a reachable MySQL 8.4 database and set STAFFING_MYSQL_URL. Render generates SESSION_SECRET. The build installs locked production dependencies and runs npm start. The health endpoint is /ping. Test signup, login and a staffing submission after configuring the databases.

Use a staging deployment first. Existing file-backed operations require durable storage for data/, sessions/ and upload directories before taking customer traffic. Review access controls for uploaded documents before importing any uploads. Production skips demo administrator creation. Rotate any existing demo administrator credentials and previously embedded PayU credentials. Payments require separately configured gateway credentials and end-to-end callback validation before launch.
