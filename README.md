# Choose Not To Stop

**AI-powered Emotional Resilience Platform**

A full-stack MERN application that helps users track their emotional well-being, gain insights into their mood patterns, and build resilience through data-driven analysis.

## 🎯 Features

### Complete Website Feature List

#### Authentication & Access

- ✅ JWT-based authentication with protected routes
- ✅ Strong password policy (uppercase, lowercase, number, special character)
- ✅ Registration, login, current-user profile (`/api/auth/me`)

#### Mood Tracking

- ✅ Daily mood check-ins (Happy, Neutral, Sad, Anxious, Stressed)
- ✅ Sleep hours and notes with each mood entry
- ✅ One mood record per user per day (duplicate prevention)
- ✅ Mood history with date filtering and analytics support

#### Journal & Story Writing

- ✅ Rich journal entry creation, edit, delete
- ✅ Sentiment analysis for every journal entry
- ✅ Journal timeline and quick access in Wall "My Story Records"

#### Insights & Analytics

- ✅ Insight engine for streaks, mood drops, pattern detection, sentiment trends
- ✅ Dashboard with mood trend charts, sentiment distribution, and resilience widgets
- ✅ Multi-period behavior summaries for short and long windows

#### Resilience Scoring

- ✅ Weekly resilience score (0-100)
- ✅ Score components: mood consistency, sentiment %, coping actions, weekly trend
- ✅ Current-week score retrieval with history fallback behavior in UI

#### Early Warning / Risk Detection

- ✅ ML-powered risk evaluation (`SAFE`, `WARNING`, `CRITICAL`)
- ✅ Forecast windows (3, 5, 7, and 100-day behavior windows)
- ✅ Risk history endpoint for trend charting
- ✅ Backend fallback heuristic when ML service is unavailable

#### Crisis & Support Tools

- ✅ Crisis mode auto-activation based on recent negative signals
- ✅ Guided breathing animation and coping strategies
- ✅ Emergency helpline section (India)
- ✅ Personal Safety Plan reflection from Mind Care inside Support section

#### Wellness Coach

- ✅ Guided check-in flow (mood, stress, energy, sleep)
- ✅ Breathing patterns and grounding steps
- ✅ Personalized action plan generation
- ✅ Reflection prompts and journal handoff

#### Mind Care Studio

- ✅ Thought reframing tool
- ✅ Gratitude booster list
- ✅ Personal Safety Plan builder
- ✅ Local private persistence of safety plan and gratitude entries

#### Wall Experience

- ✅ Anonymous community wall with supportive reactions
- ✅ Auto-refresh feed behavior
- ✅ "Read more / Show less" for longer posts
- ✅ Private "My Story Records" section sourced from journal entries
- ✅ Rule-based retention: posts with more than 4 lines stay; shorter posts expire after 24 hours

#### Daily Tasks

- ✅ Daily mental wellness task generation
- ✅ Task completion toggle and progress tracking

#### Security, Reliability, and Observability

- ✅ Helmet, CORS allowlist, request size limits, and route-specific rate limiting
- ✅ Input validation across auth/content routes
- ✅ Request IDs and structured request logging
- ✅ Frontend error and web-vitals telemetry ingestion endpoints
- ✅ Global error handling middleware

#### Quality & DevOps

- ✅ Backend unit/integration tests (Jest + Supertest)
- ✅ ESLint in frontend and backend
- ✅ CI workflow for lint, tests, and frontend build

## 🛠️ Tech Stack

### Backend

- Node.js + Express.js
- MongoDB (Mongoose)
- JWT Authentication
- bcrypt for password hashing
- Sentiment analysis (sentiment package)
- Node-cron for scheduled tasks

### Frontend

- React 18 (Vite)
- Tailwind CSS
- React Router
- Axios
- Chart.js (react-chartjs-2)

## 📦 Installation

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**

   ```bash
   cd backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Create `.env` file:**

   ```env
   PORT=5001
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/choose-not-to-stop
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=7d
   FRONTEND_URL=http://localhost:5173
   ML_SERVICE_URL=http://localhost:8000
   APP_NAME=Choose Not To Stop
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM=Choose Not To Stop <your-email@gmail.com>
   ```

4. **Start MongoDB** (if using local MongoDB)

5. **Seed sample data (optional):**

   ```bash
   npm run seed
   ```

   Creates test user: `test@example.com` / `password123`

6. **Start backend server:**
   ```bash
   npm run dev
   ```
   Server runs on `http://localhost:5001`

### Frontend Setup

1. **Navigate to frontend directory:**

   ```bash
   cd frontend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Create `.env` file (optional):**

   ```env
   VITE_API_URL=http://localhost:5001/api
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```
   App runs on `http://localhost:5173`

## 🚀 Quick Start

1. Start MongoDB
2. Start backend: `cd backend && npm run dev`
3. Start frontend: `cd frontend && npm run dev`
4. Open `http://localhost:5173` in your browser
5. Register a new account or login with test credentials

## 📁 Project Structure

```
choose-not-to-stop/
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Auth & error handling
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── scripts/         # Seed data & cron jobs
│   ├── utils/           # Utilities (sentiment, insights, scoring)
│   └── server.js        # Main server file
│
└── frontend/
    ├── src/
    │   ├── components/  # Reusable components
    │   ├── context/     # React context (Auth)
    │   ├── pages/       # Page components
    │   ├── services/    # API service layer
    │   └── App.jsx      # Main app component
    └── index.html
```

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Request reset email
- `POST /api/auth/reset-password/:token` - Set new password with reset token
- `GET /api/auth/me` - Get current user (Protected)

### Mood Tracking

- `POST /api/moods` - Create mood entry (Protected)
- `GET /api/moods` - Get all entries (Protected)
- `PUT /api/moods/:id` - Update entry (Protected)
- `DELETE /api/moods/:id` - Delete entry (Protected)

### Journal

- `POST /api/journals` - Create journal entry (Protected)
- `GET /api/journals` - Get all entries (Protected)
- `PUT /api/journals/:id` - Update entry (Protected)
- `DELETE /api/journals/:id` - Delete entry (Protected)

### Insights

- `GET /api/insights` - Get emotional insights (Protected)

### Resilience

- `POST /api/resilience/calculate` - Calculate score (Protected)
- `GET /api/resilience/current` - Get current score (Protected)
- `GET /api/resilience` - Get score history (Protected)

### Anonymous Wall

- `POST /api/anonymous` - Create post (Public)
- `GET /api/anonymous` - Get all posts (Public)
- `POST /api/anonymous/:id/reaction` - Add reaction (Public)

### Early Warning / Risk

- `POST /api/risk/evaluate` - Evaluate current risk state (Protected)
- `GET /api/risk/forecast` - Get multi-window risk forecasts (Protected)
- `GET /api/risk/history` - Get historical risk timeline (Protected)

### Daily Tasks

- `GET /api/tasks` - Get today's tasks (Protected)
- `PUT /api/tasks/:taskId` - Toggle task completion (Protected)

### Telemetry

- `POST /api/telemetry/frontend-error` - Ingest client error logs
- `POST /api/telemetry/web-vitals` - Ingest frontend performance metrics

## 🎨 Design

- **Theme**: Dark navy + Electric blue
- **Style**: Glassmorphism cards
- **Responsive**: Fully responsive design
- **Animations**: Smooth transitions and breathing exercises

## 🔐 Security

- JWT token authentication
- Password hashing with bcrypt
- Protected API routes
- CORS configuration
- Input validation

## 📊 Resilience Score Algorithm

The resilience score (0-100) is calculated based on:

- **Mood Consistency** (0-30 points) - Lower variance = higher score
- **Positive Sentiment %** (0-30 points) - Based on journal entries
- **Coping Actions** (0-20 points) - Journal + mood tracking activity
- **Weekly Improvement Trend** (0-20 points) - Comparison with previous week

## 💡 Emotional Insights

The system detects:

- **Mood Streaks** - Consecutive days with same mood category
- **Mood Drops** - Sudden significant mood decreases
- **Patterns** - Weekend vs weekday mood differences
- **Sentiment Trends** - Weekly negative sentiment percentage

## 🆘 Crisis Mode

Automatically activates when:

- 3+ negative sentiment journal entries
- 2+ low mood entries (Sad, Anxious, Stressed)

Features:

- Breathing exercise animation
- Coping strategies
- Emergency helpline information (India)

## 🔥 Early Warning System (BEST FEATURE)

**💡 Idea:** Detect mental health risk early before symptoms escalate.

**⚙️ Logic:**
If:

- Sentiment ↓ continuously
- Sleep ↓
- Negative keywords ↑

👉 **Trigger "Risk Alert"**

**🧠 Machine Learning Integration:**

- Trains a classification model to actively categorize risk into states: `Safe / Warning / Critical`.

## 🧹 Automatic Cleanup

Backend runs a cron job every hour to clean up expired anonymous posts (24+ hours old).

## 📝 Notes

- All timestamps stored in UTC
- Mood entries are unique per user per day
- Resilience scores calculated weekly (Monday-Sunday)
- Anonymous posts auto-expire after 24 hours

## 🐛 Troubleshooting

### Backend won't start

- Check MongoDB is running
- Verify `.env` file exists with correct values
- Check port 5001 is not in use

### Frontend can't connect to backend

- Verify backend is running on port 5001
- Check CORS settings in backend
- Verify `VITE_API_URL` in frontend `.env`

### Authentication issues

- Clear localStorage and try again
- Check JWT_SECRET is set in backend `.env`
- Verify token expiration settings

## 📄 License

ISC

## 👥 Contributing

This is a production-ready application built with clean architecture and best practices. Feel free to extend and customize for your needs.

---

**Built with ❤️ for emotional resilience and mental well-being**
