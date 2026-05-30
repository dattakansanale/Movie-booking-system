Complete Project Report
1. Project Structure
backend
Backend server code
server.js starts the Express app
config/database.js sets up MySQL connection pool
routes/ contains REST API routing
middleware/auth.js handles JWT authentication
frontend
Static website pages and client JS
index.html, movies.html, login.html, register.html, etc.
css/ contains styling
js/ contains frontend behavior and API interaction
schema.sql
MySQL schema and sample seed data
2. Technologies Used
Backend
Node.js
Express
MySQL via mysql2
bcryptjs for password hashing
jsonwebtoken for JWT auth
helmet for HTTP security headers
cors for cross-origin requests
express-rate-limit for request throttling
express-validator for input validation
morgan for request logging
dotenv for environment configuration
Frontend
HTML
CSS
JavaScript
Google Fonts
Font Awesome icons
3. How the Backend Works
server.js
Initializes Express
Uses security middleware:
helmet
cors
express-rate-limit
Serves static frontend from ../frontend
Mounts API routes:
/api/auth
/api/movies
/api/showtimes
/api/bookings
/api/theaters
Provides utility endpoints:
/api/health
/api/test
Serves index.html for non-API routes
Returns 404 JSON for unknown API paths
database.js
Creates a MySQL connection pool
Reads DB credentials from environment variables
Verifies database connection on startup
4. Authentication
auth.js
POST /api/auth/register
validates name, email, password, phone
hashes password with bcryptjs
inserts new user
returns JWT token and user info
POST /api/auth/login
validates credentials
verifies password
returns JWT token and user info
auth.js
Validates Authorization: Bearer <token>
Verifies JWT using process.env.JWT_SECRET
Confirms user exists in users table
Attaches req.user for protected routes
5. Main API Endpoints
Authentication
POST /api/auth/register
POST /api/auth/login
Movies
GET /api/movies?status=now_showing|coming_soon|ended
GET /api/movies/:id
GET /api/movies/:id/showtimes?date=YYYY-MM-DD
Showtimes
GET /api/showtimes/:id
GET /api/showtimes/:id/seats
Theaters
GET /api/theaters
GET /api/theaters/:id
GET /api/theaters/:id/seats
Bookings
POST /api/bookings (authenticated)
GET /api/bookings (authenticated)
POST /api/bookings/:id/cancel (authenticated)
6. Database Schema
Key tables:

users
movies
theaters
seats
showtimes
bookings
booking_seats
Relationships:

users → bookings
movies → showtimes
theaters → seats
theaters → showtimes
showtimes → bookings
bookings → booking_seats
seats → booking_seats
ER Diagram


7. Frontend Behavior
Static pages render the UI and layout
JavaScript handles:
API requests
login/register flows
session storage of JWT and user data
movie selection and booking workflow
seat selection and confirmation
index.html is the landing page
login.html and register.html handle auth
UI updates are driven by client-side JS and token state


8. Key Notes
The backend is a REST API + static file server
Booking operations are transactional
The design separates:
user auth
movie/showtime retrieval
theater and seat details
bookings and cancellations

