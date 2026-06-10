# AR Hospital - Frontend Application Suite

Welcome to the **AR Hospital Frontend Application Suite**, a modern healthcare operations platform designed to streamline patient flow management, OPD operations, AI-powered announcements, and digital signage experiences.

The suite consists of three interconnected components:

<h3>🏥 Receptionist Portal:</h3> Manage patient registrations, token generation, queue creation, and media uploads.

<h3>👨‍⚕️ OPD Handler Portal:</h3> Control patient calling, queue progression, consultations, and AI announcements.

<h3>📺 Display Panel:</h3> Real-time patient queue display, token tracking, and video advertisement playback.

### 📂 Project Structure

| Component           | Path                       | Technology                | Description                                                  |
| ------------------- | -------------------------- | ------------------------- | ------------------------------------------------------------ |
| Receptionist Portal | ./src/screens/receptionist | React Native              | Patient registration, token management, queue administration |
| OPD Handler Portal  | ./src/screens/opd          | React Native              | Queue handling, patient calling, and consultation controls   |
| Display Panel       | ./src/screens/display      | React Native / Android TV | Real-time token display and digital signage                  |
| Services            | ./src/services             | Axios / Socket.io         | API integration and real-time communication                  |
| Components          | ./src/components           | React Native              | Shared UI components and reusable modules                    |

### ✨ Core Features

### 🏥 Receptionist Portal

<h5> Queue Management </h5>

* Patient registration
* Token generation
* Multi-OPD queue creation
* Queue editing and management
* Real-time synchronization

### 👨‍⚕️ OPD Handler Portal

<h5> Live Queue Controls </h5>

* Call next patient
* Recall patient
* Skip patient
* Mark consultation complete
* Monitor waiting patients

<h5>Queue Monitoring</h5>

* Current token tracking
* Next patient preview
* OPD queue status
* Live synchronization

### AI Announcement Controls

* Trigger patient announcements
* Monitor announcement status
* Real-time queue updates

### 📺 Display Panel

<h5>Digital Queue Display</h5>

* Current token display
* Next patient display
* Multi-OPD visualization
* Real-time updates

<h5>Video Advertisement System</h5>

* Continuous video playback
* Playlist support
* Dynamic media updates
* Loop playback management

<h5>Smart Display Features</h5>

* Live token synchronization
* AI announcement integration
* Queue status visualization

### 🎨 User Experience

<h4>Modern Healthcare UI</h4>

* Premium dashboard experience
* Responsive layouts
* Real-time visual feedback
* Smooth animations
* Multi-device compatibility

### Optimized Workflows

* Fast patient registration
* One-click queue actions
* Efficient OPD management
* Minimal operational complexity

### 🚀 Getting Started

<h6>Prerequisites</h6>

* Node.js (LTS Version)
* Android Studio
* Android SDK
* React Native Environment
* Physical Android Device or Emulator

<h5>Local Development Setup</h5>

```

cd frontend

npm install
```

<h5>Start Development Server</h5>

```
npm start
```

or

```
npx react-native start
```

<h5>Run on Android</h5>

```
npx react-native run-android
```

### 🛠 Deployment & Build Process

<h4>Generate Debug APK</h4>

```
cd android

gradlew assembleDebug
```

<h4>Generate Release APK</h4>

```
cd android

gradlew assembleRelease
```

<h4>Generated APK:</h4>

```text
android/app/build/outputs/apk/release/
```

<h4>Generate Android App Bundle (AAB)</h4>

```
cd android

gradlew bundleRelease
```

<h4>Generated AAB:</h4>

```text
android/app/build/outputs/bundle/release/
```

## 🤝 Contribution & Maintenance

This project is maintained by the <h4>Navabharath Technologies Development Team(Tokensboy).</h4> For support or feedback, please contact the repository administrator.

 
<br> © 2026 Tokensboy. All Rights Reserved.
