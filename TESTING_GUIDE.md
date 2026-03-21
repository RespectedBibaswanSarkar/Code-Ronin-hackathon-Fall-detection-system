# Testing & Quality Assurance Guide
# Fall Detection System

## Unit Testing

### Backend Testing

#### 1. Database Operations
```bash
cd backend
npm test
```

#### 2. API Endpoint Testing
```bash
# Health check
curl -X GET http://localhost:5000/api/health

# Add contact
curl -X POST http://localhost:5000/api/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "phoneNumber": "+14155552671",
    "userId": "test"
  }'

# Report fall
curl -X POST http://localhost:5000/api/alert \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 37.7749,
    "longitude": -122.4194,
    "confidence": 0.85,
    "userId": "test"
  }'

# Get logs
curl http://localhost:5000/api/logs?userId=test
```

### Android Testing

#### 1. Unit Tests
```bash
cd FallDetectionApp
./gradlew test
```

#### 2. Instrumented Tests
```bash
# Connect device/emulator first
./gradlew connectedAndroidTest
```

#### 3. Manual Integration Tests

**Fall Detection Algorithm Test:**
- Navigate to Home screen
- Click "Start" button
- Monitor logcat: `adb logcat | grep FallDetection`
- Simulate acceleration changes using emulator extended controls
- Verify algorithm detects free fall and impact patterns

**Sensor Collection Test:**
- Use Android Sensor Test app
- Verify accelerometer values: Normal ~9.8 m/s²
- Verify gyroscope values when rotating phone
- Check sampling rate: 25Hz (SENSOR_DELAY_GAME = 40ms)

**UI Interaction Test:**
- Test all navigation paths
- Verify state persistence after app restart
- Check database persistence

**Permission Test:**
- Revoke permissions: Settings → Apps → Fall Detection → Permissions
- Reopen app
- Verify runtime permission request dialog
- Grant/deny each permission
- Verify app behavior

## Integration Testing

### End-to-End Fall Detection

1. **Setup:**
   - Start backend: `npm start`
   - Install app on device
   - Add emergency contact with valid phone number
   - Enable developer logging

2. **Execute:**
   - Open app
   - Click "Start" monitoring
   - Trigger fall condition (via emulator or physical device)
   - Verify alert screen appears
   - Click "SOS"

3. **Verify:**
   - Check backend logs for alert received
   - Check database has fall event recorded
   - Verify SMS was sent (Twilio console)
   - Check app logs screen shows event

### API Response Testing

```bash
# Test 1: Invalid request (missing field)
curl -X POST http://localhost:5000/api/alert \
  -H "Content-Type: application/json" \
  -d '{"latitude": 37.7749}'
# Expected: 400 error

# Test 2: Valid request
curl -X POST http://localhost:5000/api/alert \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 37.7749,
    "longitude": -122.4194,
    "confidence": 0.85,
    "userId": "test"
  }'
# Expected: 200 success with eventId

# Test 3: Retrieve event
curl http://localhost:5000/api/logs?userId=test
# Expected: 200 with list of events
```

## Performance Testing

### Sensor Processing Performance
```
Expected metrics:
- Acceleration calculation: < 1ms
- Jerk calculation: < 1ms
- Algorithm processing: < 10ms per sample
- ML model inference: < 5ms per sample
- Total latency: < 50ms per sample
```

### Memory Profiling
```bash
# Android Studio memory profiler
# Expected usage:
# - Baseline: 80MB
# - With monitoring: 150MB
# - Peak (during alert): 200MB
# - No memory leaks over 1 hour
```

### Battery Impact
```
Expected drain:
- Background monitoring: 5-10% per hour
- With active screen: 2-3% per hour
- Alert triggered: 1MB data usage
```

### Database Performance
```
Expected queries:
- Insert event: < 10ms
- Query 100 events: < 50ms
- Delete old events: < 100ms
- No significant slowdown at 10k+ records
```

## Edge Cases

### Fall Detection Edge Cases
1. **False Positives:**
   - Sudden acceleration (car acceleration)
   - Dropping phone from height
   - Impact on ground while jumping
   → Verify immobility confirmation prevents these

2. **False Negatives:**
   - Slow fall
   - Falling on soft surface
   - Stumble (not true fall)
   → Adjust thresholds if needed

3. **Extreme Conditions:**
   - High vibration environment
   - Moving vehicle
   - Very high/low temperature
   → Test in various environments

### Contact Management Edge Cases
1. Empty contacts list
2. Invalid phone number format
3. Duplicate contact addition
4. Activation/deactivation toggle

### Network Edge Cases
1. No internet connectivity
2. Slow network connection
3. Backend server down
4. Twilio service unavailable

## Security Testing

### Input Validation
```bash
# Test SQL injection
curl -X POST http://localhost:5000/api/alert \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": "37; DROP TABLE fall_events;\--"
  }'
# Must be rejected

# Test XSS injection
curl -X POST http://localhost:5000/api/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "<script>alert(1)</script>",
    "phoneNumber": "+14155552671"
  }'
# Name must be sanitized
```

### Permission Security
- Verify permissions granted only to necessary components
- Verify sensitive data not logged in plaintext
- Verify no hardcoded credentials

## Regression Testing

### Test Cases Checklist

**Home Screen:**
- [ ] Status displays correctly (SAFE/MONITORING/FALL DETECTED)
- [ ] Start button enables Start and disables Stop
- [ ] Stop button enables Stop and disables Start
- [ ] Statistics update correctly
- [ ] Navigation items work

**Alert Screen:**
- [ ] Alert appears on fall detection
- [ ] Countdown displays and decrements correctly
- [ ] Countdown reaches 0 and triggers SOS
- [ ] "I'm OK" button dismisses alert
- [ ] "SOS" button triggers alerts
- [ ] Event details display correctly

**Contacts Screen:**
- [ ] Add contact dialog opens
- [ ] Contact added to list
- [ ] Contact activation/deactivation works
- [ ] Contact deletion works
- [ ] List persists after app restart

**Logs Screen:**
- [ ] Fall events display correctly
- [ ] Events sorted by timestamp (newest first)
- [ ] Event details accurate
- [ ] Delete event works

**Background Service:**
- [ ] Service starts with app
- [ ] Monitoring continues with screen off
- [ ] Notification stays persistent
- [ ] Service survives app restart

## Deployment Checklist

Before releasing to production:

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] No memory leaks detected
- [ ] Performance meets requirements
- [ ] Security testing completed
- [ ] Edge cases handled
- [ ] Documentation updated
- [ ] Twilio credentials configured
- [ ] Backend deployed and stable
- [ ] Database backups configured
- [ ] Monitoring/alerting enabled
- [ ] User documentation ready
- [ ] Privacy policy updated
- [ ] Terms of service reviewed
- [ ] App signed with release keystore
- [ ] Version number bumped
- [ ] Release notes prepared

## Continuous Testing

### Automated CI/CD Pipeline
```yaml
# Example GitHub Actions workflow
name: Test & Deploy
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: cd backend && npm install && npm test
      - run: cd ../FallDetectionApp && ./gradlew test
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - run: npm run deploy
```

## Monitoring & Observability

### Logging
```kotlin
// Android: Use proper LOG levels
Log.d(TAG, "Debug info")        // Development
Log.i(TAG, "Info message")      // General info
Log.w(TAG, "Warning")           // Something unexpected
Log.e(TAG, "Error", exception)  // Error with stacktrace
```

### Metrics to Track
- Fall detection accuracy
- False positive/negative rates
- Alert delivery success rate
- API response times
- Backend uptime
- Database query performance
- User retention

### Health Checks
```bash
# Run every hour
curl http://backend-url/api/health

# Database integrity check
SELECT COUNT(*) FROM fall_events

# Twilio SMS delivery status
Query Twilio API for delivery reports
```

---

**Last Updated:** March 21, 2024
**Version:** 1.0.0

