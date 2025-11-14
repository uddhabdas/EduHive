# Android Studio Setup - Quick Guide

## Step 1: Open Android Studio
1. Open Android Studio from Start Menu
2. If first time, complete the setup wizard

## Step 2: Install Android SDK
1. In Android Studio, go to: **Tools → SDK Manager**
2. In the **SDK Platforms** tab, check:
   - ✅ Android 14.0 (API 34) or latest
3. In the **SDK Tools** tab, check:
   - ✅ Android SDK Build-Tools
   - ✅ Android SDK Platform-Tools
   - ✅ Android SDK Command-line Tools
4. Click **Apply** and wait for installation

## Step 3: Set Environment Variables
1. Note the SDK location (usually: `C:\Users\ayush\AppData\Local\Android\Sdk`)
2. Open System Properties → Environment Variables
3. Add new System Variable:
   - **Variable name:** `ANDROID_HOME`
   - **Variable value:** `C:\Users\ayush\AppData\Local\Android\Sdk`
4. Edit **Path** variable, add:
   - `%ANDROID_HOME%\platform-tools`
   - `%ANDROID_HOME%\tools`
   - `%ANDROID_HOME%\tools\bin`

## Step 4: Enable USB Debugging on Phone
1. Settings → About Phone
2. Tap "Build Number" 7 times
3. Settings → Developer Options
4. Enable "USB Debugging"
5. Connect phone via USB

## Step 5: Verify Connection
Open PowerShell and run:
```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
& "$env:ANDROID_HOME\platform-tools\adb.exe" devices
```

You should see your device listed.

## Step 6: Run the App
Once SDK is installed, run:
```powershell
npx expo run:android
```

This will:
- Build the app with native dependencies
- Install on your connected device
- Start Metro bundler
- Launch the app

