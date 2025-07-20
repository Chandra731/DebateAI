# DebateAI: Your AI-Powered Debate Training Platform

A free, open-source, and production-ready platform designed to help students master the art of argumentation through AI-powered debate practice.

## ✨ Features

*   **AI Sparring Partner:** Practice your debate skills against intelligent AI opponents that adapt to your level.
*   **Structured Learning Paths:** Progress through guided skill trees with lessons and exercises covering various debate techniques.
*   **Real-time Feedback:** Get instant analysis of your performance, identifying strengths and areas for improvement.
*   **Case Preparation Tool:** Utilize AI to help structure your arguments, generate contentions, rebuttals, and supporting evidence.
*   **Progress Tracking:** Monitor your XP, level, debate history, and skill mastery.
*   **Offline Functionality (PWA):** Access core features even without an internet connection.
*   **Mobile-First Design:** A responsive and touch-friendly interface for learning on the go.
*   **Comprehensive Analytics:** Gain insights into your learning progress and debate performance.

## 🚀 Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

*   Node.js (LTS version recommended)
*   npm (comes with Node.js)
*   A Firebase project (free tier is sufficient)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd ai-debate-platform
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Firebase:**
    *   Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
    *   Enable **Firestore Database** and **Authentication**.
    *   Register a new web app within your Firebase project settings.
    *   Copy your Firebase project configuration (it will look like a JavaScript object).

4.  **Configure environment variables:**
    *   Create a `.env` file in the project root by copying the example:
        ```bash
        cp .env.example .env
        ```
    *   Update `.env` with your Firebase credentials. Replace the placeholder values with your actual Firebase config:
        ```env
        VITE_FIREBASE_API_KEY=your_firebase_api_key
        VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
        VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
        VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
        VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
        VITE_FIREBASE_APP_ID=your_firebase_app_id
        
        # Optional: Groq API Key for advanced AI features (e.g., AI judging, more nuanced responses)
        # VITE_GROQ_API_KEY=your_groq_api_key_here
        ```

5.  **Set up Firestore Security Rules:**
    *   In the Firebase Console, navigate to **Firestore Database** -> **Rules**.
    *   Configure your security rules to allow read/write access for authenticated users to `profiles`, `topics`, `cases`, `debates`, `achievements`, `user_achievements`, `user_lesson_completions`, `user_exercise_attempts`, `user_skill_progress`, `skill_categories`, `lessons`, `exercises`, `skill_dependencies`, `user_learning_goals`, `ai_feedback_templates`, `user_review_schedule`, `features`, `testimonials`, and `statistics`.
    *   *Example (for development only - tighten for production!):*
        ```firestore
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            match /{document=**} {
              allow read, write: if request.auth != null;
            }
          }
        }
        ```

6.  **Seed the database:**
    *   This script populates your Firestore with initial debate topics, features, and other necessary data.
    *   ```bash
        npm run seed
        ```

7.  **Start the development server:**
    ```bash
    npm run dev
    ```
    The application should now be running at `http://localhost:5173`.

## 🔑 Admin Access

To access the admin dashboard, you need to grant admin privileges to a user account. This is done directly in your Firebase Firestore database for security reasons:

1.  **Create a regular user account** through the application's signup page (`http://localhost:5173/signup`).
2.  **Open your Firebase project** in the [Firebase Console](https://console.firebase.google.com/).
3.  Navigate to **Build** > **Firestore Database**.
4.  In the `profiles` collection, find the document corresponding to the user you just created (the document ID will be the user's UID).
5.  **Add a new field** to this user's document:
    *   **Field Name:** `isAdmin`
    *   **Type:** `boolean`
    *   **Value:** `true`
6.  Save the changes. The user associated with this profile will now have access to the admin dashboard when they log in.

## 📸 Screenshots

To make this README more visually appealing and informative for your debate team, consider adding screenshots of key application pages here.

**Recommended Screenshots:**

*   **Login/Signup Page:** Show the initial entry point.
*   **Dashboard Page:** Highlight the user's personalized dashboard with stats and quick actions.
*   **Skill Tree Page:** Illustrate the interactive skill tree with unlocked/locked skills.
*   **Lesson Page:** Show an example of a lesson with text content or a quiz.
*   **Exercise Page:** Display an exercise interface (e.g., MCQ, text input).
*   **Live Debate Page:** Capture the debate interface with transcript and controls.
*   **Case Preparation Page:** Show the AI-powered case generation in action.
*   **Admin Dashboard:** Provide a glimpse of the user management or content management sections.

**How to Add Screenshots:**

1.  Capture screenshots of the desired pages.
2.  Create a folder (e.g., `docs/screenshots`) in your project root to store these images.
3.  Update this section of the `README.md` using Markdown image syntax:
    ```markdown
    ### Login Page
    ![Login Page Screenshot](docs/screenshots/login-page.png)

    ### Dashboard
    ![Dashboard Screenshot](docs/screenshots/dashboard.png)
    ```
    (Repeat for each screenshot)

## 📂 Project Structure

Here is an overview of the most important files and directories:

```
/src
├── App.tsx                # Main application component with routing
├── main.tsx               # Application entry point
├── components/            # Shared UI components
│   ├── Admin/             # Components for the admin dashboard
│   ├── Auth/              # Components for authentication (login, signup, etc.)
│   └── ...
├── contexts/              # React context providers for state management
│   ├── AuthContext.tsx    # Manages user authentication and profile data
│   └── ...
├── hooks/                 # Custom React hooks for business logic
│   ├── useAdmin.ts        # Hook for admin dashboard data and mutations
│   └── ...
├── pages/                 # Top-level page components for each route
│   ├── AdminDashboard.tsx # The main component for the admin dashboard
│   └── ...
├── services/              # Services for interacting with external APIs
│   ├── database.ts        # Abstracts all interactions with the Firestore database
│   └── ...
├── types.ts               # TypeScript type definitions
└── ...
```

## 🧪 Testing

The project uses Vitest for unit and component testing.

*   **Run tests:**
    ```bash
    npm run test
    ```
*   **Run tests with UI:**
    ```bash
    npm run test:ui
    ```
*   **Run tests with coverage:**
    ```bash
    npm run test:coverage
    ```

## 🚀 Deployment

The application is designed for easy deployment to static hosting services.

### Netlify (Recommended)

1.  Connect your GitHub repository to Netlify.
2.  Set build command: `npm run build`
3.  Set publish directory: `dist`
4.  Add environment variables in Netlify dashboard (matching your `.env` file).
5.  Configure automatic deploys on every push.

### Vercel (Alternative)

1.  Connect your repository to Vercel.
2.  Configure build settings (`npm run build`, `dist` directory).
3.  Add environment variables.
4.  Deploy.

### GitHub Pages (Static)

1.  Build the project: `npm run build`
2.  Deploy the `dist` folder to GitHub Pages.

## 📊 Monitoring & Analytics

The platform includes basic, free monitoring and analytics capabilities using browser APIs and local storage.

*   **Built-in Monitoring:** Browser console logging, error tracking with stack traces, performance monitoring, and memory usage tracking.
*   **Data Export:** Functionality to export logs and analytics data for manual analysis.
*   **Health Checks:** Basic checks for browser support and performance.

## 🔒 Security Features

DebateAI incorporates several client-side security measures:

*   **Rate Limiting:** Client-side rate limiting for API calls to prevent abuse.
*   **Input Sanitization:** Cleans user inputs to prevent XSS and other injection attacks.
*   **CSRF Protection:** Basic Cross-Site Request Forgery protection.
*   **Secure Storage:** Utilities for securely storing sensitive data in local storage.
*   **Password Strength Validation:** Guides users to create strong passwords.

## 🎯 Performance Optimizations

The application is optimized for performance to ensure a smooth user experience:

*   **Code Splitting:** Route-based code splitting and component lazy loading for faster initial load times.
*   **Image Optimization:** Lazy loading, client-side compression, and responsive image sizes.
*   **Memory Management:** Automatic cleanup of event listeners and memory usage monitoring.
*   **PWA Capabilities:** Service Worker for caching assets and enabling offline functionality.

## 🤝 Contributing

We welcome contributions to DebateAI! If you'd like to contribute, please follow these steps:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes, ensuring they adhere to the project's coding style.
4.  Add relevant tests if applicable.
5.  Submit a pull request with a clear description of your changes.

## 📄 License

This project is licensed under the MIT License. Feel free to use it for personal or commercial purposes.