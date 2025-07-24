
# Project Summary: AI Debate Platform

This document provides a detailed summary of the AI Debate Platform, a web application designed to help users practice and improve their debating skills through real-time interaction with an AI opponent.

## 1. Overview

The AI Debate Platform is a single-page application (SPA) built with React and TypeScript. It provides a comprehensive learning experience, including a structured skill tree, live debate simulations, and performance tracking. The application leverages the Groq API for AI-powered features, Firebase for backend services, and a variety of modern web technologies to deliver a seamless and engaging user experience.

## 2. Major Components

### 2.1. Frontend

*   **Framework:** React with TypeScript
*   **Build Tool:** Vite
*   **Styling:** Tailwind CSS
*   **Animations:** Framer Motion
*   **Routing:** React Router DOM
*   **Key Libraries:**
    *   `lucide-react` for icons
    *   `react-helmet-async` for managing the document head
    *   `react-query` for data fetching and caching
    *   `recharts` for data visualization

### 2.2. AI Integration

*   **AI Model:** Meta's LLaMA 3
*   **API:** Groq API
*   **Service:** The `src/services/groqService.ts` file encapsulates the logic for making API requests to the Groq service. It includes methods for generating AI responses, evaluating exercises, and creating debate cases.

### 2.3. Database

*   **Service:** Firebase
*   **Features:**
    *   **Firestore:** Used as the primary database for storing user data, debate history, and skill tree progress.
    *   **Firebase Authentication:** Manages user authentication and session management.
    *   **Firebase Storage:** Used for storing user-generated content, such as profile pictures.

### 2.4. Learning Path Module

*   **Component:** `src/components/SkillTree/SkillTreeView.tsx`
*   **Functionality:** Implements a Duolingo-style skill tree that provides a structured learning path for users. It visually represents skills, their dependencies, and the user's progress.

### 2.5. Real-time Features

*   **Component:** `src/pages/LiveDebatePage.tsx`
*   **Features:**
    *   **Speech Transcription:** Uses the browser's `SpeechRecognition` API to transcribe the user's speech in real-time.
    *   **Timer:** Manages the duration of each debate round.
    *   **Scoring:** Includes a "Live Scoring" section that provides real-time feedback on the user's performance.

### 2.6. User & Session Management

*   **Context:** `src/contexts/AuthContext.tsx`
*   **Functionality:** Provides an authentication context that manages the user's session, profile information, and authentication state.

### 2.7. Privacy & Security

*   **Utilities:** `src/utils/security.ts`
*   **Features:**
    *   **Input Sanitization:** Protects against cross-site scripting (XSS) attacks.
    *   **Rate Limiting:** Prevents abuse of the application's resources.
    *   **CSRF Protection:** Protects against cross-site request forgery attacks.
    *   **Secure Storage:** Provides a secure wrapper for storing sensitive data in the browser's local storage.

## 3. Folder Structure and Workflows

The project follows a well-organized folder structure that separates concerns and promotes code reusability.

*   **`src/`**: The main source directory.
    *   **`components/`**: Contains reusable React components, organized by feature.
    *   **`pages/`**: Contains the top-level components for each page/route.
    *   **`services/`**: Encapsulates services for interacting with external APIs.
    *   **`contexts/`**: Contains React context providers for managing global state.
    *   **`hooks/`**: Contains custom React hooks for encapsulating reusable logic.
    *   **`lib/`**: Contains library initializations, such as Firebase.
    *   **`utils/`**: Contains utility functions, such as security helpers.

## 4. Key Features and Functionalities

*   **User Authentication:** Users can sign up, log in, and manage their profiles.
*   **Skill Tree:** Users can progress through a structured learning path to improve their debating skills.
*   **Live Debates:** Users can engage in real-time debates with an AI opponent.
*   **Case Preparation:** Users can prepare for debates by generating arguments and evidence.
*   **Debate Results:** Users can review their debate performance and receive feedback.
*   **Leaderboard:** Users can compare their performance with other users.
*   **Admin Dashboard:** Administrators can manage the application's content and users.

## 5. External API Integrations

*   **Groq API:** For AI-powered features, such as generating AI responses and evaluating exercises.
*   **Whisper (SpeechRecognition API):** For speech transcription during live debates.
*   **Firebase:** For backend services, including database, authentication, and storage.
