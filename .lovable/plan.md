

## STAR PURPOSE — Full Frontend Prototype Plan

### Design System
- **Palette**: Soft blue (#6366F1 indigo, #8B5CF6 purple), white backgrounds, light gray cards, subtle blue-purple gradients on hero sections only
- **Style**: Clean, minimal — generous whitespace, soft shadows, rounded-lg corners, Inter/system font
- **Animations**: Framer Motion for page transitions, card entrances, button micro-interactions, status changes, and notification toasts

---

### Pages & Features

#### 1. Shared Landing Page (`/`)
- Hero with tagline "Turn Idle Minutes into Instant Money"
- Two CTA paths: "I'm a User — Start Earning" / "I'm a Seller — Post Tasks"
- Features grid, How It Works steps, testimonials carousel
- **Hidden admin**: clicking logo 5 times opens admin login modal
- Smooth scroll animations on section entry

#### 2. User Landing (`/for-users`)
- Focused hero on earning, feature cards (instant tasks, real-time matching, instant payment)
- CTA → User signup

#### 3. Seller Landing (`/for-sellers`)
- Focused hero on getting tasks done fast, use case examples
- CTA → Seller signup

#### 4. Auth Pages
- `/login` — Clean form with role toggle (User/Seller), social login buttons (visual only), link to signup
- `/signup` — Registration form with simple onboarding step (pick interests/skills)
- Admin login — modal triggered by 5x logo click from any page

#### 5. User Dashboard (`/dashboard`)
- **"I Have 10 Minutes" toggle** — prominent animated button that activates task matching mode with a glowing/pulsing visual state
- **Task Feed** — scrollable cards showing task title, time estimate, reward, difficulty badge, accept button
- **Accept flow** — click Accept → animated status change → timer starts → complete → instant payment success screen with confetti
- **Wallet UI** — balance display, recent transactions, withdraw button
- **Task History** — completed/pending tabs with status indicators
- **Profile page** — avatar, stats, skills, edit form
- **Notifications panel** — slide-in with task available, payment received alerts

#### 6. Seller Dashboard (`/seller`)
- **Post Task form** — title, description, time estimate, reward amount, category
- **Active Tasks** — live status cards (pending, in-progress, completed) with animated transitions
- **Completed Tasks** — with ratings and completion time
- **Payment Overview** — total spent, pending payments, transaction list
- **Basic Analytics** — tasks completed chart, avg completion time, success rate (using Recharts)

#### 7. Admin Dashboard (`/admin`)
- **Overview cards** — total users, sellers, tasks, revenue with animated counters
- **User/Seller management** — searchable tables with status badges, flag/remove actions
- **All Tasks view** — filterable table with status, assigned user, time
- **Transaction monitoring** — recent transactions table with amounts
- **Analytics** — line/bar charts for platform metrics (Recharts)
- **Moderation** — flag suspicious activity, review queue

### Simulation Features
- Local state management for all flows (accept task → timer → complete → earn)
- Animated wallet balance updates on task completion
- Toast notifications for key events
- Loading skeletons on page transitions
- Real-time feel with simulated status polling animations

### Technical Approach
- React Router for all routes with animated page transitions
- Framer Motion for animations
- Recharts for admin/seller analytics charts
- Local state + context for simulated data flow
- Mobile-first responsive design throughout

