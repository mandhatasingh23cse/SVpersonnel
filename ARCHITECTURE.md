# Application architecture
Express renders EJS views. Public discovery uses the existing worker search function. Staffing submissions traverse Express validation and a mysql2 connection pool before the receipt renders. Supabase continues to serve authentication and the existing marketplace. Socket.IO serves chat.
