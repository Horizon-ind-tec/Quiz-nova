
# QuizNova - Your AI-Powered Learning App

QuizNova is a high-performance Next.js application designed for interactive learning and AI-driven study assistance.

## 🚀 How to Make the App 24/7 Live

The current workstation URL is for development only. To host the app permanently for your students:

1.  **Go to the Firebase Console**: Visit [console.firebase.google.com](https://console.firebase.google.com/).
2.  **Enable App Hosting**: Navigate to the "App Hosting" section in the left sidebar.
3.  **Connect your GitHub Repository**: Follow the setup wizard to connect your code.
4.  **Configure Environment Variables**: In the App Hosting settings, ensure you add your `RESEND_API_KEY` and any other secrets.
5.  **Deploy**: Firebase will automatically build and deploy your app to a global CDN with a permanent `web.app` or `firebaseapp.com` URL that stays live 24/7.

---

## 📱 How to Build the Android App (Native)

Follow these steps to generate an `.apk` file using Capacitor.

### Prerequisites
1.  **Node.js**: Installed from [nodejs.org](https://nodejs.org/).
2.  **Android Studio**: Required for building the final APK.

### Step 1: Build the Web Application
```bash
npm run build
```

### Step 2: Sync Files with Capacitor
```bash
npx cap sync
```

### Step 3: Open in Android Studio
```bash
npx cap open android
```

### Step 4: Build the APK
In Android Studio, go to **Build** -> **Build Bundle(s) / APK(s)** -> **Build APK(s)**. Locate the `app-debug.apk` once finished.
