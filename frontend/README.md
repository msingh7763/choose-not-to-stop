# Choose Not To Stop - Frontend

AI-powered Emotional Resilience Platform - React Frontend

## 🚀 Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Create `.env` file (optional):**
   Create a `.env` file in the `frontend` directory if you need to customize the API URL:

   ```env
   VITE_API_URL=http://localhost:5001/api
   ```

3. **Start development server:**

   ```bash
   npm run dev
   ```

   The app will start on `http://localhost:5173`

4. **Build for production:**

   ```bash
   npm run build
   ```

   The built files will be in the `dist` directory.

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Layout.jsx          # Main layout with navigation
│   │   └── ProtectedRoute.jsx  # Route protection wrapper
│   ├── context/
│   │   └── AuthContext.jsx     # Authentication state management
│   ├── pages/
│   │   ├── Login.jsx           # Login page
│   │   ├── Register.jsx       # Registration page
│   │   ├── Dashboard.jsx       # Analytics dashboard
│   │   ├── MoodTracking.jsx   # Mood tracking page
│   │   ├── Journal.jsx        # Journal entry page
│   │   ├── Insights.jsx       # Emotional insights page
│   │   ├── CrisisMode.jsx      # Crisis support page
│   │   └── AnonymousWall.jsx   # Anonymous wall page
│   ├── services/
│   │   └── api.js              # API service layer
│   ├── App.jsx                 # Main app component with routing
│   ├── main.jsx                # Entry point
│   └── index.css               # Global styles with Tailwind
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## 🎨 Design System

### Colors

- **Navy**: Primary background (`navy-900`, `navy-800`, etc.)
- **Electric Blue**: Accent color (`electric-500`, `electric-600`)
- **Glassmorphism**: Glass effect cards with backdrop blur

### Components

- **Glass Cards**: `.glass` and `.glass-strong` classes
- **Buttons**: `.btn-primary` and `.btn-secondary`
- **Inputs**: `.input-field` class

## 🔑 Features

### Authentication

- User registration and login
- JWT token-based authentication
- Protected routes
- Auto-logout on token expiration

### Dashboard

- Mood trend line chart (last 14 days)
- Sentiment distribution bar chart
- Resilience score gauge
- Recent insights summary

### Mood Tracking

- Daily mood selection (Happy, Neutral, Sad, Anxious, Stressed)
- Optional sleep hours tracking
- Notes field
- Prevents duplicate entries per day
- Recent entries sidebar

### Journal

- Text journal entries
- Automatic sentiment analysis
- Edit and delete entries
- Recent entries list

### Insights

- Mood streak detection
- Mood drop alerts
- Pattern recognition (weekend vs weekday)
- Negative sentiment percentage
- Personalized insight messages

### Crisis Mode

- Automatic activation based on negative patterns
- Manual activation button
- Breathing exercise animation
- Coping strategies list
- Emergency helpline information (India)

### Anonymous Wall

- Anonymous posts
- 24-hour auto-expiration
- Supportive reactions (no comments)
- Real-time updates

## 🛠️ Technologies

- **React 18** - UI library
- **Vite** - Build tool
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **Chart.js** - Data visualization
- **Axios** - HTTP client

## 📱 Responsive Design

The app is fully responsive and works on:

- Desktop (1920px+)
- Laptop (1024px+)
- Tablet (768px+)
- Mobile (320px+)

## 🔐 Security

- JWT tokens stored in localStorage
- Automatic token refresh on API calls
- Protected routes require authentication
- CORS configured for backend communication

## 🚀 Deployment

1. Build the project: `npm run build`
2. Serve the `dist` folder with a static file server
3. Configure environment variables for production API URL
4. Ensure backend CORS allows your frontend domain
