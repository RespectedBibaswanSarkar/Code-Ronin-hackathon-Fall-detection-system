# Fall Detection System - Complete Setup & Deployment Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Backend Setup](#backend-setup)
4. [Android App Setup](#android-app-setup)
5. [Configuration](#configuration)
6. [Building & Running](#building--running)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [API Documentation](#api-documentation)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Android Development**
  - Android Studio (latest version)
  - Android SDK (API level 24+)
  - Kotlin Plugin
  - Git

- **Backend Development**
  - Node.js (v16 or higher)
  - npm or yarn
  - SQLite3 (included with Node packages)
  - Git

### Required Accounts
- **Twilio Account** (for SMS and Voice calls)
  - Account SID
  - Auth Token
  - Twilio Phone Number
- **Google Maps API** (optional, for enhanced location features)
- **Android Device** or Emulator (API 24+)

---

## Project Structure

```
Fall detection app/
├── FallDetectionApp/                    # Android Project
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── java/com/falldetection/
│   │   │   │   ├── MainActivity.kt
│   │   │   │   ├── ui/
│   │   │   │   │   ├── HomeScreen.kt
│   │   │   │   │   ├── AlertScreen.kt
│   │   │   │   │   ├── ContactsScreen.kt
│   │   │   │   │   └── LogsScreen.kt
│   │   │   │   ├── viewmodel/
│   │   │   │   │   └── ViewModels.kt
│   │   │   │   ├── sensor/
│   │   │   │   │   └── SensorDataCollector.kt
│   │   │   │   ├── algorithm/
│   │   │   │   │   └── FallDetectionAlgorithm.kt
│   │   │   │   ├── ml/
│   │   │   │   │   └── QuantumInspiredFusionModel.kt
│   │   │   │   ├── service/
│   │   │   │   │   └── SensorMonitoringService.kt
│   │   │   │   ├── integration/
│   │   │   │   │   ├── TwilioIntegration.kt
│   │   │   │   │   └── LocationManager.kt
│   │   │   │   ├── repository/
│   │   │   │   │   ├── FallDetectionDatabase.kt
│   │   │   │   │   ├── Daos.kt
│   │   │   │   │   └── FallDetectionRepository.kt
│   │   │   │   └── model/
│   │   │   │       └── DataModels.kt
│   │   │   └── AndroidManifest.xml
│   │   └── build.gradle.kts
│   └── build.gradle.kts
│
├── backend/                             # Node.js Backend
│   ├── server.js
│   ├── database.js
│   ├── twilioService.js
│   ├── package.json
│   ├── .env.example
│   └── data/
│       └── fall_detection.db (auto-created)
│
├── FLOW_DIAGRAM.md                      # This document
├── SETUP_INSTRUCTIONS.md
└── API_DOCUMENTATION.md
```

---

## Backend Setup

### Step 1: Navigate to Backend Directory
```bash
cd backend
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
```bash
cp .env.example .env
```

Edit `.env` file and add your Twilio credentials:
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
PORT=5000
NODE_ENV=development
DATABASE_PATH=./data/fall_detection.db
```

### Step 4: Create Data Directory
```bash
mkdir -p data
```

### Step 5: Start Backend Server
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

Expected output:
```
⏰ Connected to SQLite database
📊 Database tables initialized
🚨 Fall Detection Backend Server running on http://localhost:5000
```

---

## Android App Setup

### Step 1: Open Project in Android Studio
```bash
cd FallDetectionApp
# Open in Android Studio
```

### Step 2: Verify Gradle Sync
- Android Studio will automatically sync Gradle files
- Wait for build to complete

### Step 3: Check Dependencies
Verify all dependencies are downloaded:
- Jetpack Compose
- Room Database
- Retrofit
- Twilio SDK
- Google Play Services

### Step 4: Configure Emulator/Device
**For Emulator:**
- Create virtual device (API 24+)
- Enable sensors simulation
- Allocate sufficient RAM (4GB+)

**For Physical Device:**
- Enable Developer Mode: Settings → About Phone → Tap Build Number 7x
- Enable USB Debugging: Settings → Developer Options
- Connect via USB cable

### Step 5: Build APK
```bash
./gradlew build
```

---

## Configuration

### Twilio Setup

1. **Get Credentials:**
   - Log in to Twilio Console
   - Find Account SID and Auth Token
   - Get your Twilio Phone Number

2. **Update Backend `.env`:**
   ```env
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxx
   TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
   ```

3. **Add Backend URL (Optional):**
   ```env
   SERVER_URL=http://your-backend-url:5000
   ```

### Android Configuration

1. **Permissions:**
   The app will request permissions at runtime:
   - BODY_SENSORS
   - ACTIVITY_RECOGNITION
   - ACCESS_FINE_LOCATION
   - SEND_SMS
   - CALL_PHONE
   - POST_NOTIFICATIONS

2. **API Endpoint Configuration** (in MainActivity.kt):
   ```kotlin
   private val backendUrl = "http://your-backend-url:5000/api"
   ```

### Model Parameters (Optional Tuning)

In `FallDetectionAlgorithm.kt`:
```kotlin
const val FREE_FALL_THRESHOLD = 0.5f      // Adjust for sensitivity
const val IMPACT_THRESHOLD = 50f           // Higher = less sensitive
const val IMMOBILITY_THRESHOLD = 2f        // Variance threshold
const val IMMOBILITY_WINDOW_MS = 2000      // 2 seconds confirmation
```

In `QuantumInspiredFusionModel.kt`:
```kotlin
w_acceleration = 0.4f    // Weight of acceleration
w_jerk = 0.25f           // Weight of jerk
w_gyro = 0.2f            // Weight of gyroscope
w_tilt = 0.15f           // Weight of tilt
const val FALL_DECISION_THRESHOLD = 0.7f  // Confidence threshold
```

---

## Building & Running

### Running Backend

```bash
cd backend
npm install
npm start
```

The server will start on `http://localhost:5000`

### Running Android App

#### Option 1: Using Android Studio
1. Open project in Android Studio
2. Select emulator or connected device
3. Click "Run" (green play icon)
4. Wait for app to install and launch

#### Option 2: Command Line
```bash
cd FallDetectionApp
./gradlew installDebug        # Install on device
./gradlew run                 # Run app
```

#### Option 3: Install APK Directly
```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### Verify Installation

1. **Backend Check:**
   ```bash
   curl http://localhost:5000/api/health
   ```
   Expected response:
   ```json
   {
     "success": true,
     "status": "Server is running",
     "timestamp": "2024-03-21T10:30:00.000Z"
   }
   ```

2. **Android App Check:**
   - App icon appears on home screen
   - Home screen shows "SAFE" status
   - Start button is functional

---

## Testing

### Backend Testing

1. **Test Alert Endpoint:**
   ```bash
   curl -X POST http://localhost:5000/api/alert \
     -H "Content-Type: application/json" \
     -d '{
       "latitude": 37.7749,
       "longitude": -122.4194,
       "confidence": 0.85,
       "mapsLink": "https://maps.google.com/...",
       "userId": "test-user"
     }'
   ```

2. **Retrieve Logs:**
   ```bash
   curl http://localhost:5000/api/logs?userId=test-user
   ```

3. **Add Contact:**
   ```bash
   curl -X POST http://localhost:5000/api/contacts \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Emergency Contact",
       "phoneNumber": "+1234567890",
       "userId": "test-user"
     }'
   ```

### Android App Testing

1. **Sensor Test:**
   - Open app → Home screen
   - Click "Start" button
   - Status should change to "MONITORING"
   - Check logcat: `adb logcat | grep "SensorMonitoringService"`

2. **Fall Simulation (Emulator):**
   - Open Android Emulator Extended Controls
   - Simulate accelerometer movement
   - Monitor for fall detection

3. **Alert Test:**
   - Manually trigger alert for testing (if button provided)
   - Verify alert screen appears with 5-second countdown
   - Test "I'm OK" and "SOS" buttons

4. **Contact Management:**
   - Navigate to Contacts screen
   - Add test emergency contact
   - Verify contact appears in list
   - Test activate/deactivate

5. **Logs View:**
   - Navigate to Logs screen
   - Verify fall events are listed
   - Test event deletion

---

## Deployment

### Backend Deployment

#### Option 1: Heroku
```bash
# Install Heroku CLI
heroku login
heroku create fall-detection-api
git push heroku main
heroku config:set TWILIO_ACCOUNT_SID=...
heroku config:set TWILIO_AUTH_TOKEN=...
```

#### Option 2: AWS EC2
```bash
# SSH into instance
ssh -i your-key.pem ec2-user@your-instance.com

# Clone and setup
git clone your-repo.git
cd backend
npm install
npm start &
```

#### Option 3: Docker (Optional)
Create `Dockerfile`:
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t fall-detection-backend .
docker run -p 5000:5000 -e NODE_ENV=production fall-detection-backend
```

### Android App Deployment

#### Step 1: Generate Signed APK
In Android Studio:
1. Build → Generate Signed Bundle/APK
2. Select APK
3. Create keystore (or use existing)
4. Fill in signing details
5. Select Release build variant

#### Step 2: Upload to Google Play Store
1. Create Google Play Developer Account ($25 USD)
2. Create app listing
3. Upload signed APK
4. Fill in app details, screenshots, description
5. Submit for review (24-48 hours)

#### Step 3: Update Backend URL
In `MainActivity.kt`, update production backend URL:
```kotlin
private val backendUrl = "https://your-production-backend.com/api"
```

---

## API Documentation

### Health Check
```
GET /api/health

Response:
{
  "success": true,
  "status": "Server is running",
  "timestamp": "2024-03-21T10:30:00Z"
}
```

### Report Fall Detection
```
POST /api/alert

Request Body:
{
  "timestamp": 1711000000000,
  "latitude": 37.7749,
  "longitude": -122.4194,
  "confidence": 0.85,
  "accelerationMagnitude": 35.5,
  "gyroscopeMagnitude": 4.2,
  "tiltAngle": 65,
  "mapsLink": "https://www.google.com/maps/...",
  "userId": "user123"
}

Response:
{
  "success": true,
  "eventId": "uuid",
  "message": "Fall event recorded and alerts sent",
  "alertsSent": 3,
  "details": [...]
}
```

### Get Logs
```
GET /api/logs?userId=user123&limit=50&offset=0

Response:
{
  "success": true,
  "logs": [
    {
      "id": "uuid",
      "timestamp": 1711000000000,
      "latitude": 37.7749,
      "longitude": -122.4194,
      "confidence": 0.85,
      "sos_triggered": 1,
      "maps_link": "..."
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 152
  }
}
```

### Add Emergency Contact
```
POST /api/contacts

Request Body:
{
  "name": "Jane Doe",
  "phoneNumber": "+1234567890",
  "email": "jane@example.com",
  "userId": "user123"
}

Response:
{
  "success": true,
  "contactId": "uuid",
  "message": "Contact added"
}
```

### Get Contacts
```
GET /api/contacts?userId=user123

Response:
{
  "success": true,
  "contacts": [
    {
      "id": "uuid",
      "user_id": "user123",
      "name": "Jane Doe",
      "phone_number": "+1234567890",
      "email": "jane@example.com",
      "is_active": 1,
      "created_at": 1711000000
    }
  ]
}
```

### Update Contact
```
PUT /api/contacts/{contactId}

Request Body:
{
  "name": "Jane Smith",
  "isActive": true
}

Response:
{
  "success": true,
  "message": "Contact updated"
}
```

### Delete Contact
```
DELETE /api/contacts/{contactId}

Response:
{
  "success": true,
  "message": "Contact deleted"
}
```

---

## Troubleshooting

### Backend Issues

**Problem: "Cannot find module 'twilio'"**
```bash
Solution: npm install twilio
```

**Problem: "Port 5000 already in use"**
```bash
Solution: lsof -ti:5000 | xargs kill -9
# Or change PORT in .env file
```

**Problem: "Database connection error"**
```bash
Solution: 
1. Ensure data/ directory exists
2. Check permissions: chmod -R 755 data/
3. Reset database: rm -f data/fall_detection.db
```

### Android App Issues

**Problem: "Permissions not granted"**
- Solution: Go to Settings → Apps → Fall Detection → Permissions
- Enable all required permissions manually

**Problem: "App crashes on startup"**
- Solution: Check logcat: `adb logcat | grep Exception`
- Ensure backend is running and URL is configured correctly

**Problem: "Fall detection not triggering"**
- Solution: Check sensor thresholds in FallDetectionAlgorithm.kt
- Verify IMU sensors are working: Use Sensor Test app
- Check logs: "Device System Sensor" working properly

**Problem: "SMS alerts not sending"**
- Solution: Verify Twilio credentials in backend .env
- Check phone number format: +1XXXXXXXXXX
- Verify Twilio account has sufficient balance

**Problem: "Emulator sensors not responding"**
- Solution: Use Android Emulator Extended Controls
- Enable simulated sensors
- Or test on physical device

### Common Solutions

1. **Clear app cache:**
   ```bash
   adb shell pm clear com.falldetection
   ```

2. **Check network connectivity:**
   ```bash
   adb shell ping 8.8.8.8
   ```

3. **View real-time logs:**
   ```bash
   adb logcat -s "FallDetection" "*"
   ```

4. **Reset emulator:**
   ```bash
   emulator -avd YOUR_AVD_NAME -wipe-data
   ```

---

## Performance Optimization

### Android App
- Sensor sampling: `SENSOR_DELAY_GAME` (40ms) balances accuracy vs battery
- Buffer size: 100 samples enables real-time detection
- Background service uses foreground notification for stability

### Backend
- SQLite is efficient for small to medium datasets
- Consider PostgreSQL for production at scale
- Implement caching for frequently accessed logs

### ML Model
- Quantum model converges quickly (superposition updates every sample)
- Weights can be tuned based on real-world data collection
- Consider federated learning for privacy-preserving improvements

---

## Security Considerations

1. **Data Privacy**
   - Store SMSs only when necessary
   - Encrypt sensitive contact information
   - Use HTTPS in production

2. **Authentication**
   - Add user authentication layer before production
   - Implement API key validation

3. **Rate Limiting**
   - Limit API requests to prevent abuse
   - Implement DDoS protection

---

## Support & Resources

- **Android Documentation:** https://developer.android.com/docs
- **Twilio Documentation:** https://www.twilio.com/docs
- **Jetpack Compose:** https://developer.android.com/jetpack/compose
- **Express.js:** https://expressjs.com/

---

**Last Updated:** March 21, 2024
**Version:** 1.0.0

