# QuizNova - AI-Powered Learning Ecosystem

QuizNova is a next-generation educational platform built with **Next.js 15**, **Firebase**, and **Google Genkit**. It leverages Gemini AI to provide students with personalized study tools, automated exam grading, and adaptive learning paths.

## 🌟 Key Features

- **AI Homework Helper**: Multimodal support for solving tough questions via text, images, or PDFs.
- **Automated Exam Grader**: Scan handwritten answer sheets and get instant AI-driven scoring and feedback.
- **Dynamic Quiz Generation**: Create custom assessments based on subject, difficulty, and educational board (CBSE, ICSE, etc.).
- **AI Study Planner**: Generate personalized roadmaps based on your exam dates.
- **Chapter Notes & Expected Questions**: AI-curated study material for high-efficiency revision.

## 🛠 Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, ShadCN UI.
- **Backend**: Firebase (Auth, Firestore), Server Actions.
- **AI Engine**: Google Genkit, Gemini 2.5 Flash.
- **Mobile**: Capacitor (Android/iOS support).

## 🚀 Deployment (Optimized for GitHub)

This project is optimized for **Firebase App Hosting**.

1. **Push to GitHub**: Ensure your latest changes are in your repository.
2. **Connect to Firebase**:
   - Go to the [Firebase Console](https://console.firebase.google.com/).
   - Navigate to **App Hosting**.
   - Click **Connect to GitHub** and select this repository.
   - Firebase will automatically detect the Next.js environment and deploy your server-side AI features.
3. **Set Secrets**:
   - In the App Hosting dashboard, go to the **Secrets** tab.
   - Add `GOOGLE_GENAI_API_KEY` with your Gemini API key to enable AI functionality.

## 📱 Mobile Setup (Android)

QuizNova uses Capacitor to wrap the web experience:

1. Deploy the web app first to get your production URL.
2. Update `server.url` in `capacitor.config.ts`.
3. Run `npm run build`.
4. Run `npx cap sync`.
5. Open in Android Studio: `npx cap open android`.

---
*Developed for excellence in education. 9 Days to Exams Challenge!*
