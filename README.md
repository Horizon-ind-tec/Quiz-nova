# QuizNova - AI-Powered Learning App

QuizNova is a high-performance Next.js application designed for interactive learning and AI-driven study assistance.

## 🚀 How to Deploy the App (without the 'out' folder)

Standard "Static Hosting" does not support AI. You must use **Firebase App Hosting**:

1.  **Push your code to GitHub**.
2.  **Go to the Firebase Console**: Visit [console.firebase.google.com](https://console.firebase.google.com/).
3.  **Enable App Hosting**: Navigate to the "App Hosting" section in the left sidebar.
4.  **Connect your Repository**: Follow the setup wizard. Firebase will detect Next.js automatically and build the app for you (no `out/` folder needed!).
5.  **Configure Secrets**: Add your `RESEND_API_KEY` and `GOOGLE_GENAI_API_KEY` in the App Hosting dashboard settings under "Environment Variables".
6.  **Live URL**: Firebase will give you a `web.app` or `firebaseapp.com` URL that supports all AI features perfectly.

---

## 📱 How to Build the Android App

Since this app uses AI, the Android app should point to your live hosted URL:

1.  **Deploy your web app** first using the App Hosting steps above.
2.  **Update `capacitor.config.ts`**:
    ```ts
    server: {
      url: 'https://your-app-name.web.app', // Your live URL here
      cleartext: true
    }
    ```
3.  **Sync and Build**:
    ```bash
    npm run build
    npx cap sync
    npx cap open android
    ```
4.  **Generate APK**: In Android Studio, go to **Build** -> **Build APK(s)**.

**Note:** This ensures your AI tutor, homework helper, and quiz generator work perfectly inside the mobile app by connecting to the server.
