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

## 🚀 Deployment (GitHub Workflow)

This project is optimized for **Firebase App Hosting**.

### How to update GitHub after changes:
1. Open your terminal in the project folder.
2. Run `git add .` to stage all changes.
3. Run `git commit -m "Your description of changes"` to save them locally.
4. Run `git push` to send the changes to GitHub.

### Connecting GitHub to Firebase:
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Navigate to **App Hosting**.
3. Click **Connect to GitHub** and select this repository.
4. Firebase will automatically detect the Next.js environment and deploy your server-side AI features every time you `git push`.
5. **Set Secrets**: In the App Hosting dashboard, go to the **Secrets** tab and add `GOOGLE_GENAI_API_KEY` with your Gemini API key.

## 📱 Mobile Setup (Android)

QuizNova uses Capacitor to wrap the web experience:

1. Deploy the web app first to get your production URL.
2. Update `server.url` in `capacitor.config.ts` with your live URL.
3. Run `npm run build`.
4. Run `npx cap sync`.
5. Open in Android Studio: `npx cap open android`.

---
*Developed for excellence in education. 9 Days to Exams Challenge!*
