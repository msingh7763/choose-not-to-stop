# Choose Not To Stop - Backend API

AI-powered Emotional Resilience Platform - Backend Server

## 🚀 Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Create `.env` file:**
   Create a `.env` file in the `backend` directory with the following variables:

   ```env
   PORT=5001
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/choose-not-to-stop
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=7d
   FRONTEND_URL=http://localhost:5173
   ML_SERVICE_URL=http://localhost:8000
   ML_REQUEST_TIMEOUT_MS=5000
   APP_NAME=Choose Not To Stop
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM=Choose Not To Stop <your-email@gmail.com>
   ```

3. **Start MongoDB:**
   Make sure MongoDB is running on your system. If using MongoDB Atlas, update `MONGODB_URI` with your connection string.

4. **Seed sample data (optional):**

   ```bash
   npm run seed
   ```

   This creates a test user:
   - Email: `test@example.com`
   - Password: `password123`

5. **Start the server:**

   ```bash
   # Development mode (with nodemon)
   npm run dev

   # Production mode
   npm start
   ```

The server will start on `http://localhost:5001`

## 📁 Project Structure

```
backend/
├── config/
│   └── db.js                 # MongoDB connection
├── controllers/              # Route controllers
│   ├── authController.js
│   ├── moodController.js
│   ├── journalController.js
│   ├── insightsController.js
│   ├── resilienceController.js
│   └── anonymousController.js
├── middleware/
│   ├── auth.js              # JWT authentication middleware
│   └── errorHandler.js      # Global error handling
├── models/                   # Mongoose models
│   ├── User.js
│   ├── MoodEntry.js
│   ├── JournalEntry.js
│   ├── ResilienceScore.js
│   └── AnonymousPost.js
├── routes/                   # API routes
│   ├── authRoutes.js
│   ├── moodRoutes.js
│   ├── journalRoutes.js
│   ├── insightsRoutes.js
│   ├── resilienceRoutes.js
│   └── anonymousRoutes.js
├── scripts/
│   ├── cleanupExpiredPosts.js  # Cron job for expired posts
│   └── seedData.js            # Database seeding script
├── utils/
│   ├── generateToken.js      # JWT token generation
│   ├── sentimentAnalyzer.js  # Sentiment analysis
│   ├── insightEngine.js      # Emotional insights logic
│   └── resilienceScore.js    # Resilience scoring algorithm
├── server.js                 # Main server file
└── package.json
```

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Request reset email
- `POST /api/auth/reset-password/:token` - Set new password with reset token
- `GET /api/auth/me` - Get current user (Protected)

### Mood Tracking

- `POST /api/moods` - Create mood entry (Protected)
- `GET /api/moods` - Get all mood entries (Protected)
- `GET /api/moods/:id` - Get mood entry by ID (Protected)
- `PUT /api/moods/:id` - Update mood entry (Protected)
- `DELETE /api/moods/:id` - Delete mood entry (Protected)

### Journal Entries

- `POST /api/journals` - Create journal entry (Protected)
- `GET /api/journals` - Get all journal entries (Protected)
- `GET /api/journals/:id` - Get journal entry by ID (Protected)
- `PUT /api/journals/:id` - Update journal entry (Protected)
- `DELETE /api/journals/:id` - Delete journal entry (Protected)

### Insights

- `GET /api/insights` - Get emotional insights (Protected)

### Resilience Scores

- `POST /api/resilience/calculate` - Calculate resilience score (Protected)
- `GET /api/resilience/current` - Get current week's score (Protected)
- `GET /api/resilience` - Get resilience score history (Protected)

### Anonymous Wall

- `POST /api/anonymous` - Create anonymous post (Public)
- `GET /api/anonymous` - Get all active posts (Public)
- `POST /api/anonymous/:id/reaction` - Add reaction to post (Public)

## 🔐 Authentication

Protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## 🧹 Automatic Cleanup

The server automatically runs a cron job every hour to clean up expired anonymous posts (posts older than 24 hours).

## 📝 Notes

- All timestamps are stored in UTC
- Mood entries are unique per user per day (prevents duplicates)
- Resilience scores are calculated weekly (Monday to Sunday)
- Anonymous posts automatically expire after 24 hours using MongoDB TTL index

## 🛠️ Development

- Uses ES6 modules (`import/export`)
- Error handling middleware catches all async errors
- CORS enabled for frontend communication
- Environment-based configuration
- Registration requires a 10+ character password with uppercase, lowercase, number, and special character
