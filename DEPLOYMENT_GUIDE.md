# Deployment Guide - Fall Detection System

## Overview
This guide covers deploying the Fall Detection System to production environments.

## Database Configuration

### Local Development
Database is automatically created at: `./data/fall_detection.db`

### Production Considerations
1. **Backup Strategy**
   ```bash
   # Backup database daily
   cp fall_detection.db fall_detection.db.backup.$(date +%Y%m%d)
   ```

2. **Scale to PostgreSQL** (for large deployments)
   - Modify `database.js` to use `pg` package
   - Ensures better concurrency
   - Supports replication and failover

## Backend Deployment

### Option 1: Heroku (Recommended for Small-Medium Scale)

```bash
# Create and deploy
heroku login
heroku create fall-detection-api
git push heroku main

# Set environment variables
heroku config:set TWILIO_ACCOUNT_SID=XXX
heroku config:set TWILIO_AUTH_TOKEN=XXX
heroku config:set TWILIO_PHONE_NUMBER=+1XXX

# View logs
heroku logs --tail

# Scale dynos if needed
heroku ps:scale web=2
```

## Android App Deployment

### Step 1: Create Release Build
```bash
./gradlew assembleRelease
```

This creates:
- `app/build/outputs/apk/release/app-release.apk`

### Step 2: Sign APK
Already done in release build, but verify keystore:
```bash
jarsigner -verify -verbose app-release.apk
```

### Step 3: Test Release Build
```bash
adb install -r app/build/outputs/apk/release/app-release.apk
```

### Step 4: Upload to Google Play Store

1. **Create Developer Account**
   - Go to https://play.google.com/console
   - Pay $25 USD
   - Wait for approval (24-48 hours)

2. **Create App Listing**
   - Create new app
   - Fill in: Title, description, category
   - Upload store listing images

3. **Upload APK**
   - Build → Generate Signed Bundle/APK
   - Select Release build
   - Upload APK to Play Store

4. **Complete Store Information**
   - Privacy policy
   - Download size specifications
   - Target audience
   - Content rating

5. **Submit for Review**
   - Review all requirements
   - Accept policies
   - Submit for review
   - Wait 24-48 hours for approval

## Environment-Specific Configuration

### Development
```env
NODE_ENV=development
PORT=3000
DATABASE_PATH=./data/fall_detection_dev.db
DEBUG=*
```

### Staging
```env
NODE_ENV=staging
PORT=5000
DATABASE_PATH=/var/lib/fall_detection/data.db
DEBUG=falldetection:*
```

### Production
```env
NODE_ENV=production
PORT=5000
DATABASE_PATH=/var/lib/fall_detection/data.db
DEBUG=
```

## Docker Deployment

### Create Dockerfile
```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

### Build Image
```bash
docker build -t fall-detection-backend:1.0.0 .
```

### Run Container
```bash
docker run -p 5000:5000 \
  -e TWILIO_ACCOUNT_SID=XXX \
  -e TWILIO_AUTH_TOKEN=XXX \
  -e TWILIO_PHONE_NUMBER=+1XXX \
  -v fall-detection-data:/app/data \
  fall-detection-backend:1.0.0
```

### Docker Compose
```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "5000:5000"
    environment:
      - TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}
      - TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}
      - TWILIO_PHONE_NUMBER=${TWILIO_PHONE_NUMBER}
      - NODE_ENV=production
    volumes:
      - fall-detection-data:/app/data
    restart: always

volumes:
  fall-detection-data:
```

## AWS Deployment

### EC2 Instance Setup
```bash
# Launch t3.small instance (Ubuntu 22.04)
# Connect via SSH
ssh -i key.pem ubuntu@instance-ip

# Install Node.js
sudo curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone https://github.com/yourrepo/fall-detection-backend.git
cd fall-detection-backend

# Install dependencies
npm install --production

# Install PM2 for process management
sudo npm install -g pm2

# Start service
pm2 start server.js --name "fall-detection-api"
pm2 save
pm2 startup

# Setup nginx as reverse proxy
sudo apt-get install -y nginx
```

### Nginx Configuration
```nginx
upstream falldetection {
    server localhost:5000;
}

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://falldetection;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL Setup with Let's Encrypt
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot certonly --standalone -d your-domain.com
sudo systemctl reload nginx
```

## Monitoring & Logging

### Application Logging
```bash
# View logs
pm2 logs

# Rotate logs
pm2 logrotate -u node
```

### Monitoring with PM2
```bash
# Monitor in real-time
pm2 monit

# Setup monitoring service
pm2 install pm2-auto-pull
pm2 install pm2-logrotate
```

### Disk Space Monitoring
```bash
df -h

# If low on space, archive old data
tar -czf fall_detection_backup_2024.tar.gz data/
rm -rf data/old_records
```

## Scaling Considerations

### Horizontal Scaling
```bash
# Using PM2 cluster mode
pm2 start server.js -i max  # Use all CPU cores
pm2 start server.js -i 4    # Use 4 processes
```

### Database Optimization
```sql
-- Index commonly queried columns
CREATE INDEX idx_fall_events_timestamp ON fall_events(timestamp);
CREATE INDEX idx_fall_events_user_id ON fall_events(user_id);
CREATE INDEX idx_fall_events_sos ON fall_events(sos_triggered);

-- Analyze query performance
EXPLAIN QUERY PLAN SELECT * FROM fall_events WHERE user_id = 'user123' ORDER BY timestamp DESC LIMIT 50;
```

## Health Checks & Alerts

### Uptime Monitoring
Use third-party services:
- UptimeRobot (free tier available)
- Pingdom
- StatusCake

### Application Health Endpoint
```bash
# Test regularly
curl https://your-domain.com/api/health

# Should return 200 with:
# {"success": true, "status": "Server is running", "timestamp": "..."}
```

### Alert Rules
- Backend down: Alert immediately
- High error rate (> 5%): Alert
- API latency > 1s: Alert
- Database connectivity lost: Alert
- Low disk space (< 10%): Alert

## Backup Strategy

### Automated Daily Backup
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/fall-detection"
DB_PATH="/var/lib/fall-detection/data.db"

mkdir -p $BACKUP_DIR
cp $DB_PATH $BACKUP_DIR/fall_detection_$DATE.db
gzip $BACKUP_DIR/fall_detection_$DATE.db

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "*.db.gz" -mtime +30 -delete

# Optional: Upload to S3
# aws s3 cp $BACKUP_DIR/fall_detection_$DATE.db.gz s3://your-bucket/
```

### Cron Job
```bash
0 2 * * * /scripts/backup.sh  # Run daily at 2 AM
```

## Disaster Recovery

### Database Restoration
```bash
# Stop backend
pm2 stop server

# Restore from backup
cp /backups/fall-detection/fall_detection_20240321.db.gz data/
gunzip data/fall_detection_20240321.db.gz

# Start backend
pm2 start server
```

## Update Strategy

### Rolling Updates
```bash
# Pull latest code
git pull origin main

# Install updated dependencies
npm install --production

# Test new version
NODE_ENV=test npm test

# Graceful restart
pm2 restart server --wait-ready

# Verify health
curl http://localhost:5000/api/health
```

### Version Control
- Tag releases: `git tag -a v1.0.1 -m "Release 1.0.1"`
- Maintain CHANGELOG.md
- Document breaking changes

## Security Hardening

### Environment Variables
- Never commit .env files
- Use secrets manager for production
- Rotate credentials quarterly

### Network Security
```bash
# Firewall rules (UFW)
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
ufw status
```

### Rate Limiting
```javascript
// In server.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## Performance Tuning

### Database Connection Pooling
```javascript
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error(err);
  db.configure('busyTimeout', 10000);
});
```

### Caching
```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 });

app.get('/api/logs', (req, res) => {
  const key = `logs_${req.query.userId}`;
  const cached = cache.get(key);
  
  if (cached) return res.json(cached);
  
  // Fetch and cache
  const result = /* ... */;
  cache.set(key, result);
  res.json(result);
});
```

## Compliance & Privacy

### GDPR Compliance
- Implement data deletion for users
- Add privacy policy link
- Get explicit consent for SMS/calls
- Maintain audit logs

### HIPAA (if handling health data)
- Encrypt data at rest and in transit
- Implement access controls
- Maintain audit trails
- Regular security assessments

## Maintenance Schedule

### Daily
- Check application logs
- Monitor API response times
- Verify backup completion

### Weekly
- Review security logs
- Check disk space usage
- Analyze error trends

### Monthly
- Database optimization/cleanup
- Security patches
- Performance analysis
- Update dependencies

### Quarterly
- Full security audit
- Disaster recovery test
- Capacity planning
- Code review

---

**Last Updated:** March 21, 2024
**Version:** 1.0.0

