
# QuizNova - Your AI-Powered Learning App

This is a Next.js web application that has been configured to be built as a native Android application using Capacitor.

## How to Build and Install the Android App

Follow these steps to generate an `.apk` file that you can install on your Android device.

### Prerequisites

Before you begin, you must have the following software installed on your computer:

1.  **Node.js**: This is required to run the build commands for the web app. You can download it from [nodejs.org](https://nodejs.org/).
2.  **Android Studio**: This is Google's official tool for Android development. You will use it to build the final app file. You can download it from the [Android Developer website](https://developer.android.com/studio).

### Step 1: Build the Web Application

First, you need to generate the static files for your web app. Open a terminal in your project's root directory and run the following command:

```bash
npm run build
```

This command will create a folder named `out` which contains all the necessary HTML, CSS, and JavaScript files for your app.

### Step 2: Sync Files with Capacitor

Next, you need to copy the web files into the native Android project that Capacitor manages. Run this command:

```bash
npx cap sync
```

Capacitor will take the contents of the `out` folder and update the Android project with them.

### Step 3: Open the Project in Android Studio

Now, open the native Android project in Android Studio by running:

```bash
npx cap open android
```

This will launch Android Studio with your project loaded and ready.

### Step 4: Build the APK File in Android Studio

This is the final step. Inside Android Studio:

1.  Wait for the project to finish syncing and indexing.
2.  Go to the menu bar at the top and click on **Build**.
3.  Select **Build Bundle(s) / APK(s)** -> **Build APK(s)**.
4.  Android Studio will build the app. Once it's finished, a notification will appear in the bottom-right corner. Click the **"locate"** link in that notification.
5.  This will open the folder containing your installable app file, usually named `app-debug.apk`.

### Step 5: Install on Your Device

You can now copy this `app-debug.apk` file to your Android phone (via USB cable, Google Drive, etc.) and open it to install the QuizNova application.
