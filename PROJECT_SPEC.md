# Customer Behavior and Feedback Intelligence System

A full-stack MERN application that collects customer feedback and website behavior data, analyzes it with AI, and gives admins actionable business insights. Built as a Final Year Project (FYP).

**Core differentiator:** per-user correlation of behavior data with feedback data (most tools like PostHog/Matomo treat these as separate silos — this system links them).

**Questions the system must answer:**
- Are customers satisfied?
- What are customers complaining about?
- What do customers like?
- Which products/services are most popular?
- Where are users leaving the website?
- What should the business improve?
- What are current satisfaction trends?

---

## Tech Stack

| Layer | Tools |
|---|---|
| Frontend | React.js, Vite, Tailwind CSS, React Router, Axios, Recharts, Lucide React |
| Backend | Node.js, Express.js, MongoDB, Mongoose, JWT, bcrypt |
| AI | Google Gemini API — sentiment analysis, categorization, summarization, problem detection, recommendations |
| Dev practices | Git, `.env` config, REST architecture, clean folder structure, error handling, input validation |

---

## User Roles

**Customer:** register, login, browse products, view details, submit ratings + written feedback, view their own feedback history.

**Admin:** login (protected routes), view dashboard, customers, products, feedback, behavior analytics, AI insights, generate AI analysis, view recommendations.

---

## Pages

### Customer side
1. **Landing Page** — navbar, hero, how-it-works, featured products, satisfaction stats, CTA, footer
2. **Register** — name, email, password, confirm password (validated)
3. **Login** — email, password (JWT)
4. **Products/Services Page** — cards (image, name, category, description, rating, price, view details), with search/filter/sort
5. **Product Details** — full info + reviews; tracks `product_viewed`, time spent, click actions
6. **Feedback Page/Modal** — 1–5 star rating, feedback text, category (Product Quality / Price / Delivery / Customer Service / Website Experience / Other), optional suggestion

### Admin side
- Dashboard (stat cards + charts)
- Feedback management table (filterable, click to expand full record)
- Behavior Analytics page
- AI Insights page
- Settings / Logout

---

## Behavior Tracking

Events to capture: `page_view`, `product_view`, `product_click`, `search`, `feedback_submitted`, `session_start`, `session_end`

Each event stores: `userId`, `sessionId`, `eventType`, `page`, `productId`, `timestamp`, `duration`, `metadata`

**No sensitive personal data collected.**

### Metrics calculated
- **User:** total/active/new/returning users
- **Engagement:** page views, product views, avg session duration, most visited pages/products
- **Conversion:** if no purchase flow, use product views → clicks → feedback submissions as the funnel

---

## AI Features

| Feature | Behavior |
|---|---|
| Sentiment analysis | Classify feedback Positive/Negative/Neutral, return `sentimentScore` + `confidence` |
| Categorization | Sort into Product Quality / Price / Delivery / Customer Service / Website Experience / Product Availability / Other |
| Summarization | Admin-triggered "Generate AI Summary" over recent feedback |
| Problem detection | Surface recurring complaints with mention counts (e.g. "Slow delivery — 34 mentions") |
| Recommendations | Practical, reasoned suggestions tied to feedback volume/sentiment/behavior data |

**AI fallback (required):** if the AI API is down, fall back to keyword-based sentiment:
- Positive: good, excellent, amazing, great, love, perfect
- Negative: bad, poor, slow, expensive, terrible, worst

App must never fully break due to AI API failure.

---

## Dashboard Charts (Recharts)

- Feedback Sentiment — pie/donut
- Rating Distribution — bar (1–5 stars)
- Feedback Trend — line (date vs count)
- Sentiment Trend — line (date vs pos/neu/neg)
- Most Viewed Products — bar
- Most Visited Pages — bar
- Feedback Categories — pie/bar

Top stat cards: Total Customers, Total Feedback, Average Rating, Positive %, Negative %, Avg Session Duration.

---

## MongoDB Collections

**User:** name, email, password, role, createdAt
**Product:** name, description, category, price, image, rating, createdAt
**Feedback:** userId, productId, rating, comment, category, sentiment, sentimentScore, confidence, createdAt
**BehaviorEvent:** userId, sessionId, eventType, page, productId, duration, metadata, timestamp
**AIInsight:** summary, topIssues, positivePoints, recommendations, generatedAt

---

## API Routes

```
Auth
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

Products
GET    /api/products
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id

Feedback
POST   /api/feedback
GET    /api/feedback
GET    /api/feedback/:id
DELETE /api/feedback/:id

Behavior
POST   /api/behavior/event
GET    /api/behavior/analytics

Analytics
GET    /api/analytics/dashboard
GET    /api/analytics/sentiment
GET    /api/analytics/ratings
GET    /api/analytics/products
GET    /api/analytics/pages

AI
POST   /api/ai/analyze-feedback
POST   /api/ai/generate-summary
POST   /api/ai/generate-recommendations
```

---

## Security

JWT auth, bcrypt password hashing, protected admin/customer routes, role-based authorization, input validation, `.env` for secrets, proper error handling.

**Never expose in frontend:** MongoDB URI, AI API key, JWT secret.

---

## UI/UX

Modern, clean, professional, minimal, responsive. Real SaaS-analytics look — not an FYP-looking template. Use cards, tables, charts, badges, modals, toast notifications, loading/empty/error states. Keep it simple — no over-engineering the design.

---

## Demo/Seed Data

Generate: 30–50 users, 15–20 products, 100–300 feedback records, 500+ behavior events. Feedback text should include realistic positive/negative/neutral examples so the dashboard looks populated for the presentation.

---

## Folder Structure

```
customer-intelligence-system/
├── client/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── layouts/
│       ├── hooks/
│       ├── services/
│       ├── context/
│       ├── utils/
│       ├── App.jsx
│       └── main.jsx
├── server/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   ├── utils/
│   ├── config/
│   ├── seed/
│   └── server.js
├── .env.example
└── README.md
```

---

## Build Order (do NOT skip ahead)

1. **Setup** — React/Vite, Express, MongoDB, Tailwind, folder structure
2. **Auth** — register, login, JWT, roles, protected routes
3. **Products** — model, API, listing, details
4. **Feedback** — form, rating, API, DB storage
5. **Behavior Tracking** — page/product view tracking, sessions, event API
6. **Analytics** — dashboard stats, charts, behavior analytics
7. **AI** — sentiment, categorization, summarization, problem detection, recommendations
8. **Admin Dashboard** — full dashboard, feedback management, behavior analytics, AI insights
9. **Demo Data** — seed script
10. **Testing & Polish** — responsiveness, error handling, loading states, validation, security, bugs

**Rule for the coding agent:** after each phase — implement, run, test the API, fix errors, verify the DB — only then move to the next phase. Don't generate everything at once. Don't replace working code unnecessarily.

---

## Demo Flow (for presentation)

Login as customer → browse products → open a product → generate behavior events → submit review → AI analyzes it → login as admin → dashboard → customer stats → behavior analytics → sentiment analysis → common problems → generate AI summary → generate AI recommendations → explain business impact.

---

## Definition of Done

- [ ] Customer & admin auth work
- [ ] Products viewable
- [ ] Behavior tracked
- [ ] Feedback submitted & stored
- [ ] AI sentiment + categorization working
- [ ] Dashboard shows real DB data with working charts
- [ ] Behavior analytics functional
- [ ] AI summary + recommendations working
- [ ] Seed script works
- [ ] Responsive, error-handled, env-configured
- [ ] README has setup instructions
- [ ] Runs locally from a clean install
