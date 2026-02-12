# QuizNova - AI-Powered Learning App

QuizNova is a high-performance Next.js application designed for interactive learning and AI-driven study assistance.

## 🚀 URGENT: How to Deploy for your Exams

To ensure all AI features (Tutor, Homework Helper, Quiz Generator) work, you **must** use **Firebase App Hosting**. Standard `firebase deploy` only supports static sites and will disable your AI.

### 1. Web Deployment (The AI way)
1.  **GitHub**: Push your current code to a GitHub repository.
2.  **Firebase Console**: Go to [console.firebase.google.com](https://console.firebase.google.com/).
3.  **App Hosting**: Navigate to "App Hosting" in the left sidebar.
4.  **Connect**: Follow the setup to connect your GitHub repo. Firebase will automatically detect Next.js and deploy it with full AI support.
5.  **Environment Variables**: Add your `GOOGLE_GENAI_API_KEY` in the App Hosting settings in the Firebase Console.

### 2. Android App (Capacitor)
Since the AI needs a server, the Android app should "wrap" your live hosted URL:
1.  Deploy your web app first using **App Hosting**.
2.  Open `capacitor.config.ts`.
3.  Add/Update the server section:
    ```ts
    server: {
      url: 'https://your-app-name.web.app', // Your App Hosting URL
      cleartext: true
    }
    ```
4.  Run:
    ```bash
    npm run build
    npx cap sync
    npx cap open android
    ```

---

## 🛠 Troubleshooting Terminal Errors
If you see "Experiment webframeworks is not enabled" when running `firebase deploy`:
- **Fix**: Simply don't use `firebase deploy`. Use the **App Hosting** UI in the Firebase Console. It is more reliable for Next.js 15 apps.
- If you absolutely must use the terminal, run: `firebase experiments:enable webframeworks` first.
