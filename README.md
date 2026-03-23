# ⚡ GigTrack

> **Delivery earnings tracker for gig workers** — built for Glovo, Uber Eats & Bolt.

[![Live Demo](https://img.shields.io/badge/Live-Preview-brightgreen.svg)](https://zingy-griffin-ab9195.netlify.app/)
[![Developer](https://img.shields.io/badge/Developer-Morshadul-blue)](https://morshadul.eu/)
[![Location](https://img.shields.io/badge/Location-Lisbon%2C%20Portugal%20%F0%9F%87%B5%F0%9F%87%B9-orange)](#)

GigTrack helps freelance delivery riders take control of their business by tracking income, monitoring expenses, and tracking investment recovery. 

---

## ✨ Features

- **💶 Earnings Tracking**: Monitor weekly and total earnings per delivery platform.
- **📤 Expense Management**: Log fuel, maintenance, repairs, platform fees, and accessories.
- **⚡ Smart Deductions**: Automatic 8% fleet deduction calculation for Uber Eats & Bolt.
- **🛵 Investment Recovery**: Track ROI progress for scooter, insurance, and registration costs.
- **⏳ Pending Costs**: Keep a clear eye on upcoming or pending expenses.
- **🔒 Secure Data Storage**: User authentication and seamless cloud syncing via **Supabase**.

## 🛠 Tech Stack

GigTrack is built using modern web technologies for a fast, reactive experience:

- **[React 18](https://react.dev/)** + **[Vite](https://vitejs.dev/)** - Next Generation Frontend Tooling
- **[Recharts](https://recharts.org/)** - Composable charting library for earnings data
- **[Supabase](https://supabase.com/)** - Authentication and PostgreSQL database
- **Hosting**: Deployed rapidly on **Netlify**

## 🚀 Run locally

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed on your machine.
You will also need to add your Supabase credentials in a `.env` file (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`).

### Installation

```bash
# Clone the repository
git clone https://github.com/Hiremorshadul/gigtrack.git
cd gigtrack

# Install dependencies
npm install

# Start the development server
npm run dev
```

## 📦 Deploy

Connected to **Netlify** — every push to `main` auto-deploys.

---

*Built and maintained by [Morshadul Alam](https://morshadul.eu/)*
