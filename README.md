<div align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=40&pause=1000&color=3B82F6&center=true&vCenter=true&width=600&lines=Welcome+to+NimbusGuard;Intelligent+Cloud+FinOps;" alt="Typing SVG" />

  <p align="center">
    <strong>Intelligent Cloud FinOps Dashboard & Cost Anomaly Detector</strong>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/Next.js-16.1.6-black?style=for-the-badge&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-Ready-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/AWS-Cost_Explorer-FF9900?style=for-the-badge&logo=amazon-aws" alt="AWS" />
    <img src="https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase" alt="Firebase" />
  </p>
</div>

---

## 🚀 Overview

**NimbusGuard** is a proactive Cloud FinOps dashboard built to prevent cloud bill shock. By securely connecting to your AWS account via cross-account IAM roles, NimbusGuard continuously monitors your cloud spend, establishes cost baselines, and alerts you the moment spending deviates from the norm.

### ✨ Key Features

- **🛡️ Secure AWS Integration:** Uses AWS STS (`AssumeRole`) to securely access your cloud data without requiring hardcoded, long-term credentials for user accounts.
- **📊 Automated Anomaly Detection:** Intelligent engine establishes a 6-day baseline and flags anomalies (e.g., > 20% cost spikes).
- **🚨 Real-Time Slack Alerts:** Instantly notifies your team via Slack webhooks with severity levels, expected costs, and implicated services.
- **📈 Interactive Dashboards:** Visualize your cloud waste and service breakdown using responsive `recharts` and Tailwind CSS v4.
- **⚡ Serverless Backend:** Powered by Next.js 16 App Router and Firebase Firestore for lightning-fast, scalable data synchronization.

---

## 📸 Visuals

*(Replace the placeholder links with your actual project screenshots)*

<div align="center">
  <h3>🖥️ Main Dashboard</h3>
  <img src="https://raw.githubusercontent.com/karan-katakdhond/nimbusguard/main/public/dashboard-placeholder.png" alt="NimbusGuard Dashboard" width="800" style="border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />
  <p><i>Monitor daily spending and service breakdowns.</i></p>

  <br />

  <h3>🚨 Anomaly Reports & Alerts</h3>
  <img src="https://raw.githubusercontent.com/karan-katakdhond/nimbusguard/main/public/anomaly-placeholder.png" alt="Anomaly Alerts" width="800" style="border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />
  <p><i>View detected anomalies and Slack notification integrations.</i></p>
</div>

---

## 🏗️ Architecture & Workflow

NimbusGuard operates on a robust serverless architecture combining AWS SDKs and Firebase Admin:

1. **Connection Verification (`/api/aws/verify`):** When a user adds an AWS IAM Role ARN, the app uses `STSClient` to assume the role and performs a dry-run against the AWS Cost Explorer API to verify permissions.
2. **Cost Analysis & Sync (`/api/analyze-costs`):** - A cron job or manual trigger hits the API.
   - The app assumes the user's active AWS role.
   - Fetches the last 7 days of `UnblendedCost` data, grouped by `SERVICE`.
3. **Anomaly Engine:** Calculates the average daily cost over the first 6 days. If the 7th day exceeds the baseline by a set threshold (>120% and >$5), it is flagged as an anomaly.
4. **Data Persistence:** Batches the daily metrics and anomaly reports into Firebase Firestore using `db.batch()` to ensure atomicity.
5. **Notification System:** If an anomaly is detected, NimbusGuard formats a rich message block and dispatches it to the user's configured Slack Webhook.

---

## 📂 File Structure

```text
nimbusguard/
├── app/
│   ├── api/                   # Serverless Backend
│   │   ├── analyze-costs/     # Core anomaly detection & AWS fetching logic
│   │   ├── aws/verify/        # AWS STS Role verification
│   │   └── cron/sync-all/     # Automated background syncing
│   ├── dashboard/             # Protected FinOps dashboards & settings
│   ├── login/                 # Authentication views
│   ├── register/              # Onboarding views
│   ├── globals.css            # Tailwind v4 entry point
│   └── layout.tsx             # Root layout & context providers
├── components/                # Modular React UI Components
│   └── features/
│       ├── anomalies/         # Alert components
│       └── dashboard/         # Recharts integration (CostChart)
├── contexts/                  # React Contexts (Settings, Theme, Auth)
├── hooks/                     # Custom React hooks (useAuth)
├── lib/                       # SDK Initializations
│   ├── firebaseAdmin.ts       # Secure server-side Firestore access
│   └── firebaseClient.ts      # Client-side Firebase init
├── types/                     # Global TypeScript interfaces
├── utils/                     # Helper functions (formatters)
└── package.json               # Dependencies & Scripts

```
## 🛠️ Getting Started (Local Development)
 ### Prerequisites
- **Node.js** (v20+ recommended)

- **AWS Account** (with permissions to create IAM roles and access Cost Explorer)

- **Firebase Project** (Firestore enabled)

### Installation
  Clone the repository:
  ```
  git clone https://github.com/karan-katakdhond/nimbusguard.git
  cd nimbusguard
  ```
  Install dependencies:
```
npm install 
```
   Set up Environment Variables:
   Create a .env.local file in the root directory. You will need your own master AWS credentials (to execute the STS AssumeRole) and Firebase Admin credentials.
   ```
   # AWS Master Credentials (Used to assume user roles)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1

# Firebase Admin SDK configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY="your_private_key"
```

   Run the development server:
   ```
   npm run dev
```


## 🤝 Contributing

Contributions are completely open and highly encouraged! Whether it's fixing bugs, improving the anomaly detection algorithm, or adding new cloud providers (GCP/Azure), your help is welcome.

### How to Contribute

1. **Fork the Project**
2. **Create your Feature Branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your Changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the Branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

Please ensure your code passes linting (`npm run lint`) and adheres to the existing TypeScript strictness.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

