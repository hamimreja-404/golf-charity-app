# 🌟 ImpactClub

ImpactClub is a modern, subscription-based charity and rewards platform. Subscribers allocate a percentage of their monthly membership fee directly to a charity of their choice, while the remainder funds a community prize pool. Members earn entries into a monthly draw (selecting numbers 1-45) to win cash prizes, including a rolling jackpot!

## 🚀 Tech Stack

* **Frontend:** Next.js (App Router), React, Tailwind CSS
* **Animations:** Framer Motion
* **Icons:** Lucide React
* **Backend & Auth:** Supabase (PostgreSQL, Auth, Admin API)
* **Payments:** Stripe (Subscriptions, Webhooks)

---

## ✨ Key Features

### 👤 User Dashboard
* **Subscription Management:** Seamless Stripe checkout for Monthly and Yearly plans. Premium features lock automatically if the subscription becomes inactive.
* **Charity Impact Slider:** Users dynamically choose what percentage (e.g., 10% - 50%) of their subscription goes to charity and select their preferred cause.
* **Interactive Score Manager:** Users input their lucky numbers (1-45). Features **Optimistic UI** updates and smooth Framer Motion list animations (keeps a rolling list of the 5 most recent entries).
* **Performance Metrics:** Real-time tracking of Total Winnings, Pending Payouts, and the precise "Next Renewal Date" synced via Stripe Webhooks.
* **Winner Verification:** A dedicated portal for winners to upload proof/verification images to claim their prizes.

### 🛡️ Admin Command Center
* **Live Analytics:** Tracks Total Users, Active Subscribers, and calculates the Live Estimated Prize Pool (including previous month rollovers).
* **Advanced Draw Engine:** * *Standard Draw:* Automatically generates 5 random winning numbers, cross-references all user scores for the current month, calculates the tier splits (3-Match, 4-Match, 5-Match), and distributes the prize pool.
    * *Force Jackpot (Dev Mode):* Guarantees a Tier-5 Jackpot win by pulling numbers from an active user for testing.
* **Verification Queue:** Admins can review user-submitted proof images and mark payouts as "Paid" with a single click.
* **Charity Directory Manager:** Add and manage the charities available for users to select.
* **Secure User Impersonation:** HR/Admins can click "Login as User" to instantly securely authenticate into a user's dashboard via Supabase Silent Magic Links—without needing their password.

### 🔐 Authentication & Developer Tools
* **Custom Auth Flow:** Built-in Sign Up / Sign In using Supabase Auth, combined with role assignment (`public`, `subscriber`, `admin`).
* **Dev-Mode Quick Fill:** A convenient side-panel on the login screen to instantly auto-fill credentials for Admin, HR, and Standard User test accounts.

---

## 🗄️ Database Schema Overview (Supabase)

The platform relies on a relational PostgreSQL database structure:
* `profiles`: Stores user data, subscription status, Stripe IDs, role, and charity preferences. Links securely to `auth.users`.
* `scores`: Logs every number sequence entered by users, timestamped for monthly filtering.
* `charities`: Directory of available charities.
* `draws`: Historical record of all monthly draws, winning numbers, and total prize pools.
* `winners`: Junction table linking `draws` and `profiles`, storing match tiers, prize splits, and payout status.

---

## ⚙️ Getting Started

### Prerequisites
* Node.js (v18+ recommended)
* Supabase Account & Project
* Stripe Account (with Subscriptions configured)

### 1. Clone & Install
```bash
git clone [https://github.com/yourusername/impactclub.git](https://github.com/yourusername/impactclub.git)
cd impactclub
npm install