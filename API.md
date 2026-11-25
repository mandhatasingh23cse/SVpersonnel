# Workforce web routes
GET /discover accepts skill and city and renders search results. GET /staffing accepts type=corporate or permanent. POST /staffing accepts URL-encoded type, city, requirement and email. Success returns HTTP 201 with a stored reference. Invalid requests return 422. Database failures return 503. These are HTML endpoints.

GET /admin/staffing?page=1 requires an admin session. Each page lists up to 25 enquiries, newest first. Responses disable caching of contact details.
