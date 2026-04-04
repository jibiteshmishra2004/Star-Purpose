# STAR PURPOSE
**Quick Tasks, Instant Earnings**

<div align="center">
  <img src="./public/screenshot.png" alt="STAR PURPOSE Project Screenshot" width="100%" />
</div>

Welcome to **STAR PURPOSE**, a modern, minimal SaaS marketplace designed to turn idle minutes into instant money. Our platform seamlessly connects "Sellers" who need quick tasks done with "Users" who are ready to complete them for instant rewards.

---

## What is STAR PURPOSE?

STAR PURPOSE is a two-sided marketplace:
- **For Users (Earners):** Have 10 spare minutes? Log in, click the "I Have 10 Minutes" button, and get matched with quick, actionable tasks. Complete them and get paid instantly.
- **For Sellers (Posters):** Need something done fast? Post a task with a time estimate and a reward, and our network of users will jump on it immediately.

We've built this platform to be professional, fast, and incredibly easy to use, featuring a robust tech stack, real-time updates, and a crisp user interface.

---

## Key Features

### User Experience
- **"I Have 10 Minutes" Mode:** A single click instantly matches users with available tasks.
- **Real-Time Task Feed:** Live updates as new tasks are posted by sellers.
- **Instant Payments:** Simulated instant wallet updates and transaction history with engaging animations.

### Seller Experience
- **Frictionless Task Creation:** Post tasks quickly with time estimates and rewards.
- **Live Tracking:** Monitor task status (pending, in-progress, completed) in real-time.
- **Analytics Dashboard:** Graphical charts showing task completion rates, average times, and spending metrics.

### Admin Experience
- **Centralized Control:** Comprehensive dashboard to oversee users, sellers, tasks, and transactions.
- **Moderation Tools:** Ability to flag suspicious activity, review queues, and manage platform health.
- *Hidden Access:* Click the main logo 5 times from any page to reveal the hidden admin login.

---

## Technology Stack

We've chosen a modern, powerful stack to ensure a professional and snappy experience:

**Frontend:**
- **[React 18](https://react.dev/)** & **[Vite](https://vitejs.dev/)**: For blazing-fast development and user experience.
- **[Tailwind CSS](https://tailwindcss.com/)**: For clean, utility-first styling and a beautiful SaaS aesthetic.
- **[Framer Motion](https://www.framer.com/motion/)**: For smooth, professional page transitions and micro-interactions.
- **[Radix UI](https://www.radix-ui.com/)**: For accessible, high-quality unstyled UI components.
- **[Recharts](https://recharts.org/)**: For responsive admin and seller analytics charts.

**Backend & Data:**
- **[Node.js](https://nodejs.org/)** & **[Express](https://expressjs.com/)**: A lightweight, robust server architecture.
- **[Better-SQLite3](https://github.com/WiseLibs/better-sqlite3)**: A fast, efficient, file-based database for reliable local data storage.
- **[Socket.io](https://socket.io/)**: Powering the real-time, live updates across the platform (like task status changes).

---

## Getting Started

Follow these simple steps to get STAR PURPOSE running on your local machine.

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your computer.

### Installation

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <your-repo-url>
   cd Star-Purpose
   ```

2. **Install the dependencies:**
   ```bash
   npm install
   ```

### Running the Application

To experience the full application (Frontend + Backend real-time syncing), you need to run two terminal windows.

**Terminal 1: Start the Backend Server**
```bash
npm run server
```
*This starts the Express server and the SQLite database locally.*

**Terminal 2: Start the Frontend Development Server**
```bash
npm run dev
```
*This starts the Vite React application.*

Once both are running, open your web browser and navigate to the local URL provided by Vite (e.g., `http://localhost:8080` or `http://localhost:5173`) to see STAR PURPOSE in action.

---

## Project Structure

```text
Star-Purpose/
├── .lovable/             # Planning and design notes
├── data/                 # SQLite database storage (marketplace.db)
├── public/               # Static assets (logos, screenshots)
├── src/                  # React Frontend Code
│   ├── components/       # Reusable UI components
│   ├── context/          # React Context providers
│   ├── data/             # Mock data
│   ├── hooks/            # Custom React hooks
│   ├── layout/           # Shared page layouts
│   ├── pages/            # Main application views/pages
│   └── utils/            # Helper functions
├── .env.example          # Example environment variables
├── db.js                 # Better-SQLite3 configuration and schema
├── package.json          # Project dependencies and scripts
├── server.js             # Node.js Express backend & Socket.io
├── tailwind.config.ts    # Tailwind CSS configuration
└── vite.config.ts        # Vite configuration
```

---

*Built with purpose. Turn idle minutes into instant value.*
