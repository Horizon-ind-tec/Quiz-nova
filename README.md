
# QuizNova - AI-Powered Learning App

QuizNova is a high-performance Next.js application designed for interactive learning and AI-driven study assistance.

## 🚀 Deployment Guide (9 Days to Exams!)

To ensure all AI features (Tutor, Homework Helper, Quiz Generator) work, your app needs a server. Choose one of the two methods below:

### Method 1: No GitHub (Manual Terminal Deployment)
If you don't want to use GitHub, use your computer's terminal:
1.  **Enable Web Support**: Run this command first:
    ```bash
    firebase experiments:enable webframeworks
    ```
2.  **Deploy**: Run:
    ```bash
    firebase deploy
    ```
    *Note: Firebase will automatically build your Next.js app and set up the server for you.*

### Method 2: With GitHub (Recommended for Reliability)
1.  **GitHub**: Push your code to a GitHub repository.
2.  **Firebase Console**: Go to "App Hosting" in the left sidebar.
3.  **Connect**: Connect your repo. Firebase handles every update automatically when you push code.

---

## 📱 Android App (Capacitor)
Since the AI needs a server, the Android app should "wrap" your live hosted URL:
1.  Deploy your web app first using one of the methods above.
2.  Get your live URL (e.g., `https://your-app.web.app`).
3.  Open `capacitor.config.ts` and update the server section:
    ```ts
    server: {
      url: 'https://your-app.web.app',
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

## 🛠 Troubleshooting
- **"Experiment webframeworks is not enabled"**: You missed Step 1 of the "No GitHub" guide. Run `firebase experiments:enable webframeworks`.
- **AI not responding**: Ensure your `GOOGLE_GENAI_API_KEY` is added to the "Functions" or "App Hosting" environment variables in the Firebase Console.
