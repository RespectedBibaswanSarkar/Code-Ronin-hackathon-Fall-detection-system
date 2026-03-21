import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import * as db from './database.js';
import * as twilio from './twilioService.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ==================== FALL EVENT ENDPOINTS ====================

/**
 * POST /api/alert
 * Report a fall detection event
 */
app.post('/api/alert', async (req, res) => {
    try {
        const {
            timestamp,
            latitude,
            longitude,
            confidence,
            accelerationMagnitude,
            gyroscopeMagnitude,
            tiltAngle,
            mapsLink,
            userId
        } = req.body;

        // Validate required fields
        if (!latitude || !longitude || !confidence) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: latitude, longitude, confidence'
            });
        }

        const eventId = uuidv4();

        // Save fall event to database
        await db.runQuery(
            `INSERT INTO fall_events 
            (id, timestamp, latitude, longitude, confidence, acceleration_magnitude, gyroscope_magnitude, tilt_angle, maps_link, user_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                eventId,
                timestamp || Date.now(),
                latitude,
                longitude,
                confidence,
                accelerationMagnitude || 0,
                gyroscopeMagnitude || 0,
                tiltAngle || 0,
                mapsLink || '',
                userId || 'anonymous'
            ]
        );

        console.log(`📍 Fall event recorded: ${eventId}`);

        // Get emergency contacts for this user
        const contacts = await db.allQuery(
            'SELECT * FROM emergency_contacts WHERE user_id = ?',
            [userId || 'anonymous']
        );

        // Send alerts if contacts exist
        let alertResults = [];
        if (contacts.length > 0) {
            alertResults = await twilio.sendAlertsToContacts(
                contacts,
                `Lat: ${latitude}, Lng: ${longitude}`,
                mapsLink,
                eventId
            );

            console.log(`📱 Alerts sent to ${contacts.length} contacts`);
        }

        res.json({
            success: true,
            eventId,
            message: 'Fall event recorded and alerts sent',
            alertsSent: alertResults.length,
            details: alertResults
        });

    } catch (error) {
        console.error('Error processing alert:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/logs
 * Retrieve fall detection logs
 */
app.get('/api/logs', async (req, res) => {
    try {
        const userId = req.query.userId || 'anonymous';
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        const logs = await db.allQuery(
            `SELECT * FROM fall_events 
            WHERE user_id = ? 
            ORDER BY timestamp DESC 
            LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        const total = await db.getQuery(
            'SELECT COUNT(*) as count FROM fall_events WHERE user_id = ?',
            [userId]
        );

        res.json({
            success: true,
            logs,
            pagination: {
                limit,
                offset,
                total: total.count
            }
        });

    } catch (error) {
        console.error('Error retrieving logs:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/logs/:eventId
 * Get specific fall event details
 */
app.get('/api/logs/:eventId', async (req, res) => {
    try {
        const event = await db.getQuery(
            'SELECT * FROM fall_events WHERE id = ?',
            [req.params.eventId]
        );

        if (!event) {
            return res.status(404).json({
                success: false,
                error: 'Event not found'
            });
        }

        res.json({
            success: true,
            event
        });

    } catch (error) {
        console.error('Error retrieving event:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * PUT /api/logs/:eventId
 * Update fall event (e.g., mark SOS triggered)
 */
app.put('/api/logs/:eventId', async (req, res) => {
    try {
        const { sosTriggered } = req.body;

        await db.runQuery(
            'UPDATE fall_events SET sos_triggered = ? WHERE id = ?',
            [sosTriggered ? 1 : 0, req.params.eventId]
        );

        res.json({
            success: true,
            message: 'Event updated'
        });

    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /api/logs/:eventId
 * Delete a fall event
 */
app.delete('/api/logs/:eventId', async (req, res) => {
    try {
        await db.runQuery(
            'DELETE FROM fall_events WHERE id = ?',
            [req.params.eventId]
        );

        res.json({
            success: true,
            message: 'Event deleted'
        });

    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ==================== EMERGENCY CONTACTS ENDPOINTS ====================

/**
 * POST /api/contacts
 * Add emergency contact
 */
app.post('/api/contacts', async (req, res) => {
    try {
        const { name, phoneNumber, email, userId } = req.body;

        if (!name || !phoneNumber) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: name, phoneNumber'
            });
        }

        const contactId = uuidv4();

        await db.runQuery(
            `INSERT INTO emergency_contacts (id, user_id, name, phone_number, email) 
            VALUES (?, ?, ?, ?, ?)`,
            [contactId, userId || 'anonymous', name, phoneNumber, email || '']
        );

        res.json({
            success: true,
            contactId,
            message: 'Contact added'
        });

    } catch (error) {
        console.error('Error adding contact:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/contacts
 * Get all emergency contacts
 */
app.get('/api/contacts', async (req, res) => {
    try {
        const userId = req.query.userId || 'anonymous';

        const contacts = await db.allQuery(
            'SELECT * FROM emergency_contacts WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );

        res.json({
            success: true,
            contacts
        });

    } catch (error) {
        console.error('Error retrieving contacts:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * PUT /api/contacts/:contactId
 * Update emergency contact
 */
app.put('/api/contacts/:contactId', async (req, res) => {
    try {
        const { name, phoneNumber, email, isActive } = req.body;

        let updateFields = [];
        let updateValues = [];

        if (name !== undefined) {
            updateFields.push('name = ?');
            updateValues.push(name);
        }
        if (phoneNumber !== undefined) {
            updateFields.push('phone_number = ?');
            updateValues.push(phoneNumber);
        }
        if (email !== undefined) {
            updateFields.push('email = ?');
            updateValues.push(email);
        }
        if (isActive !== undefined) {
            updateFields.push('is_active = ?');
            updateValues.push(isActive ? 1 : 0);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No fields to update'
            });
        }

        updateValues.push(req.params.contactId);

        await db.runQuery(
            `UPDATE emergency_contacts SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        res.json({
            success: true,
            message: 'Contact updated'
        });

    } catch (error) {
        console.error('Error updating contact:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /api/contacts/:contactId
 * Delete emergency contact
 */
app.delete('/api/contacts/:contactId', async (req, res) => {
    try {
        await db.runQuery(
            'DELETE FROM emergency_contacts WHERE id = ?',
            [req.params.contactId]
        );

        res.json({
            success: true,
            message: 'Contact deleted'
        });

    } catch (error) {
        console.error('Error deleting contact:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// ==================== INITIALIZATION ====================

async function startServer() {
    try {
        // Initialize database
        await db.initializeDatabase();

        // Start server
        app.listen(PORT, () => {
            console.log(`🚨 Fall Detection Backend Server running on http://localhost:${PORT}`);
            console.log(`📊 API documentation available at http://localhost:${PORT}/api`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
