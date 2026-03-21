# Fall Detection System - Application Flow Diagram

## User Flow Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        APPLICATION STARTUP                          │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                     ┌─────────────────────────┐
                     │ Request Permissions     │
                     │ - Sensors               │
                     │ - Location              │
                     │ - Contacts              │
                     │ - SMS & Call            │
                     └─────────────────────────┘
                                  │
                                  ▼
                     ┌─────────────────────────┐
                     │   HOME SCREEN (SAFE)    │
                     │ - Status: 🟢 SAFE       │
                     │ - Start/Stop Buttons    │
                     │ - Statistics            │
                     │ - Navigation Menu       │
                     └─────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
           ┌──────────────┐ ┌──────────┐ ┌──────────┐
           │ Contacts     │ │ Logs     │ │ Settings │
           │ Management   │ │ Viewer   │ │  Panel   │
           └──────────────┘ └──────────┘ └──────────┘
                    │
                    ▼
           ┌──────────────────────┐
           │ USER TAPS START      │
           └──────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│               CONTINUOUS BACKGROUND MONITORING                      │
│                    (SensorMonitoringService)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───→ SensorDataCollector                                         │
│  │     - TYPE_ACCELEROMETER (input)                               │
│  │     - TYPE_GYROSCOPE (input)                                    │
│  │     - Calculate | acc| = √(x²+y²+z²)                          │
│  │     - Calculate jerk = Δacc/Δt                                  │
│  │                                                                 │
│  │  ┌───→ Collect 100 samples per cycle                           │
│  │  │                                                              │
│  ├──┴───→ FallDetectionAlgorithm                                  │
│  │        - Check Free Fall: |a| < 0.5 m/s²                      │
│  │        - Check Impact: |a| > 50 m/s²                           │
│  │        - Check Immobility: variance < 2 m/s² for 2 sec        │
│  │        - Output: NO_FALL | POTENTIAL_FALL | FALL_CONFIRMED     │
│  │                                                                 │
│  ├──────→ QuantumInspiredFusionModel (ML)                        │
│  │        - Normalize inputs                                      │
│  │        - Compute feature scores                                │
│  │        - Apply weighted fusion                                 │
│  │        - Logistic regression → P(Fall)                         │
│  │        - Superposition state update                             │
│  │        - Output: MLModelScore with probability                │
│  │                                                                │
│  └──────→ Decision Logic                                          │
│          IF mlScore.isFall && confidence > 0.7                    │
│             → FALL DETECTED                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                     ┌──────────────────────┐
                     │  GET LOCATION DATA   │
                     │ LocationManager      │
                     │ - GPS coordinates    │
                     │ - Generate Maps link │
                     └──────────────────────┘
                                  │
                                  ▼
                     ┌──────────────────────┐
                     │ SAVE EVENT TO DB     │
                     │ - FallDetectionEvent │
                     │ - Timestamp          │
                     │ - Location           │
                     │ - Confidence Score   │
                     └──────────────────────┘
                                  │
                                  ▼
                     ┌──────────────────────┐
                     │ BROADCAST NOTIFICATION
                     │ MainActivity receives│
                     │ FALL_DETECTED intent│
                     └──────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│              ALERT SCREEN SHOWS (5 SEC COUNTDOWN)                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│            🚨 FALL DETECTED - ARE YOU OK?                          │
│                                                                     │
│                       ⏱️ 4 seconds                                 │
│                                                                     │
│      ┌─────────────────────────────────────┐                       │
│      │ Confidence: 82%                     │                       │
│      │ Location displayed                  │                       │
│      └─────────────────────────────────────┘                       │
│                                                                     │
│           ┌──────────────┐  ┌───────────┐                          │
│           │  I'M OK      │  │   SOS     │                          │
│           │  (Dismiss)   │  │  (Alert)  │                          │
│           └──────────────┘  └───────────┘                          │
│                                                                     │
│                    OR WAIT 0 SECONDS...                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
    User Responds?  │             │             │
                    ▼             ▼             ▼
          ┌──────────────┐ ┌──────────┐ ┌──────────┐
          │ I'M OK       │ │ SOS      │ │ TIMEOUT  │
          │ (Cancel)     │ │ (Manual) │ │ (Auto)   │
          └──────────────┘ └──────────┘ └──────────┘
                    │             │             │
                    │             │             │
                    ├─────────────┼─────────────┤
                    │(All trigger SOS)          │
                    │                           │
                    ▼                           │
    ┌─────────────────────────────────────────┐│
    │ SOS ALERT WORKFLOW                      ││
    ├─────────────────────────────────────────┤│
    │                                         ││
    │ 1. Fetch Active Emergency Contacts      ││
    │    from Local Room Database             ││
    │                                         ││
    │ 2. TwilioIntegration:                   ││
    │    ├─ For EACH CONTACT:                 ││
    │    │  ├─ sendSMSAlert()                 ││
    │    │  │  Message: "Fall detected at     ││
    │    │  │  <location> with map link"      ││
    │    │  │                                 ││
    │    │  └─ Send to Backend:               ││
    │    │     POST /api/alert                ││
    │    │     { lat, lng, confidence,        ││
    │    │       mapsLink, event data }       ││
    │    │                                    ││
    │    └─ For FIRST CONTACT:               ││
    │       └─ triggerVoiceCall()            ││
    │          TwiML: TTS + Location info    ││
    │                                         ││
    │ 3. Backend Processing:                  ││
    │    ├─ Store event in database          ││
    │    ├─ Retrieve emergency contacts      ││
    │    └─ Twilio service sends all         ││
    │       SMS + voice calls                ││
    │                                         ││
    │ 4. Update Event:                        ││
    │    └─ Mark sosTriggered = true         ││
    │                                         ││
    │ 5. Show SOS Status Screen               ││
    │    "Help is on the way!"                ││
    │                                         ││
    └─────────────────────────────────────────┘│
                                                │
                                                ▼
                        ┌──────────────────────────────┐
                        │ EMERGENCY CONTACTS ALERTED   │
                        │ SMS + Voice Call Received    │
                        │ Maps link provided           │
                        │ Event logged with timestamp  │
                        │ & confidence score           │
                        └──────────────────────────────┘
                                  │
                                  ▼
                        ┌──────────────────────────────┐
                        │ VIEW IN LOGS SCREEN          │
                        │ ├─ Event timestamp           │
                        │ ├─ 🚨 SOS Triggered marker   │
                        │ ├─ Confidence 82%            │
                        │ ├─ Location coordinates      │
                        │ └─ Delete event              │
                        └──────────────────────────────┘
                                  │
                                  ▼
                        ┌──────────────────────────────┐
                        │ USER DISMISSES ALERT         │
                        │ Return to Home Screen        │
                        │ Status: 🔵 MONITORING        │
                        │ (Continue background service)│
                        └──────────────────────────────┘
```

## Component Architecture

```
┌────────────────────────────────────────────────────────────┐
│                      ANDROID APP                           │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ UI Layer (Jetpack Compose)                           │  │
│ │ ├─ HomeScreen                                        │  │
│ │ ├─ AlertScreen                                       │  │
│ │ ├─ ContactsScreen                                    │  │
│ │ └─ LogsScreen                                        │  │
│ └─────────────────────────────────────────────────────┘  │
│                          ▲                                │
│                          │ (navigates)                    │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ ViewModel Layer                                      │  │
│ │ ├─ HomeScreenViewModel                               │  │
│ │ ├─ AlertViewModel                                    │  │
│ │ ├─ ContactsViewModel                                 │  │
│ │ └─ LogsViewModel                                     │  │
│ └─────────────────────────────────────────────────────┘  │
│                          ▲                                │
│                          │ (manages state)                │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ Repository Layer                                     │  │
│ │ └─ FallDetectionRepository                           │  │
│ │    ├─ Fall Event operations                          │  │
│ │    └─ Emergency Contact operations                   │  │
│ └─────────────────────────────────────────────────────┘  │
│                          ▲                                │
│                          │ (database ops)                 │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ Data Layer (Room Database)                           │  │
│ │ ├─ FallDetectionEventDao                             │  │
│ │ └─ EmergencyContactDao                               │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│         SENSOR + DETECTION SERVICE (Background)            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ SensorMonitoringService (Foreground Service)         │  │
│ └──────────────────────────────────────────────────────┘  │
│                          │                                │
│     ┌────────────────────┼────────────────────┐           │
│     ▼                    ▼                    ▼           │
│ ┌─────────────┐ ┌──────────────┐ ┌─────────────────┐     │
│ │ SensorData  │ │ FallDetection│ │ Quantum-Inspired│     │
│ │ Collector   │ │ Algorithm    │ │ ML Model        │     │
│ │ (Accel+Gyro)│ │ (Signal Proc)│ │ (Classification)│     │
│ └─────────────┘ └──────────────┘ └─────────────────┘     │
│     IMU           Thresholds         Probability         │
│   Sensors         & Logic            Scoring             │
│                                                            │
│                          │                                │
│                          ▼                                │
│                  ┌────────────────┐                       │
│                  │ Fall Detected? │                       │
│                  └────────────────┘                       │
│                          │                                │
│                    (YES) │ (NO)                           │
│                          │  │                             │
│                          │  └─→ Continue monitoring       │
│                          │                                │
│                          ▼                                │
│                  ┌────────────────┐                       │
│                  │ Get Location   │                       │
│                  │ Generate Alerts│                       │
│                  └────────────────┘                       │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────┐
│      BACKEND SERVER (Node.js)        │
├─────────────────────────────────────┤
│                                     │
│ Express Server (Port 5000)          │
│ ├─ POST /api/alert                  │
│ ├─ GET /api/logs                    │
│ ├─ POST /api/contacts               │
│ ├─ GET /api/contacts                │
│ ├─ PUT /api/contacts/:id            │
│ └─ DELETE /api/contacts/:id         │
│                                     │
│ SQLite Database                     │
│ ├─ fall_events table                │
│ ├─ emergency_contacts table         │
│ └─ alerts table                     │
│                                     │
│ Twilio Service                      │
│ ├─ sendSMSAlert()                   │
│ └─ triggerVoiceCall()               │
│                                     │
└─────────────────────────────────────┘
```

## Data Flow Diagram

```
IMU Sensors → SensorDataCollector → [Acc Mag, Jerk, Gyro]
                                           │
                                           ▼
                                FallDetectionAlgorithm
                                    (Free Fall Detection)
                                    (Impact Detection)
                                    (Immobility Check)
                                           │
                      ┌────────────────────┼────────────────────┐
                      ▼                    ▼                    ▼
                   NO_FALL          POTENTIAL_FALL       FALL_CONFIRMED
                      │                    │                    │
                      │                    └────────┬───────────┘
                      │                            │
                      └────────────────┬───────────┘
                                       │
                                       ▼
                    QuantumInspiredFusionModel
                     (Weighted Sensor Fusion)
                              │
                    ┌─────────┴─────────┐
                    │                   │
              Superposition        Logistic Reg
              P(Safe), P(Fall)     P(Fall|Features)
                    │                   │
                    └─────┬─────────────┘
                          │
                          ▼
                    MLModelScore
                  {score ≥ 0.7?}
                          │
                    ┌─────┴─────┐
                    ▼           ▼
                   TRUE        FALSE
                   │            │
           FALL DETECTED    Continue Monitoring
                   │
                   ▼
         Get Location + Fetch Contacts
                   │
                   ├─ Insert to DB
                   ├─ Broadcast to UI
                   ├─ Alert ViewModel
                   │
                   ▼
         Send SMS + Voice Calls
                   │
                   ├─ TwilioIntegration
                   ├─ Backend API call
                   │
                   ▼
         Update Event (sosTriggered)
                   │
                   ▼
         Display Alert Screen
```

