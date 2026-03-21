package com.falldetection.algorithm

import com.falldetection.model.IMUSensorData
import kotlin.math.sqrt

/**
 * Fall Detection Algorithm
 * - Detects free fall conditions
 * - Detects impact spikes
 * - Confirms immobility
 */
class FallDetectionAlgorithm {

    // Thresholds for fall detection
    companion object {
        const val FREE_FALL_THRESHOLD = 0.5f  // m/s² - very low acceleration
        const val IMPACT_THRESHOLD = 50f      // m/s² - high acceleration spike
        const val IMMOBILITY_THRESHOLD = 2f   // m/s² - low variance for confirmation
        const val IMMOBILITY_WINDOW_MS = 2000 // 2 seconds of immobility
        const val FREE_FALL_DURATION_MS = 500 // 0.5 seconds of free fall
    }

    private val sensorBuffer = mutableListOf<IMUSensorData>()
    private val bufferSize = 100
    private var freeFallStartTime: Long = 0
    private var isInFreeFall = false

    /**
     * Process new sensor data
     */
    fun processSensorData(data: IMUSensorData): FallDetectionResult {
        sensorBuffer.add(data)
        if (sensorBuffer.size > bufferSize) {
            sensorBuffer.removeAt(0)
        }

        return analyzeFallConditions()
    }

    private fun analyzeFallConditions(): FallDetectionResult {
        if (sensorBuffer.isEmpty()) {
            return FallDetectionResult.NO_FALL
        }

        val currentTime = System.currentTimeMillis()
        val lastData = sensorBuffer.last()
        val magnitude = lastData.magnitude

        // Step 1: Detect Free Fall
        if (magnitude < FREE_FALL_THRESHOLD) {
            if (!isInFreeFall) {
                freeFallStartTime = currentTime
                isInFreeFall = true
            }
        } else {
            isInFreeFall = false
        }

        // Step 2: Detect Impact Spike after Free Fall
        if (isInFreeFall && (currentTime - freeFallStartTime) > FREE_FALL_DURATION_MS) {
            if (magnitude > IMPACT_THRESHOLD) {
                isInFreeFall = false
                return FallDetectionResult.POTENTIAL_FALL_DETECTED
            }
        }

        // Step 3: Detect via Direct Impact (high acceleration spike without free fall)
        if (magnitude > IMPACT_THRESHOLD && !isInFreeFall) {
            return FallDetectionResult.POTENTIAL_FALL_DETECTED
        }

        // Step 4: Detect Immobility (confirmation stage)
        if (sensorBuffer.size >= 20) { // Need ~2 seconds of data at SENSOR_DELAY_GAME
            val variance = calculateVariance()
            if (variance < IMMOBILITY_THRESHOLD) {
                return FallDetectionResult.FALL_CONFIRMED
            }
        }

        return FallDetectionResult.NO_FALL
    }

    private fun calculateVariance(): Float {
        if (sensorBuffer.size < 2) return 0f

        val mean = sensorBuffer.map { it.magnitude }.average().toFloat()
        val variance = sensorBuffer.map { (it.magnitude - mean) * (it.magnitude - mean) }
            .average()
            .toFloat()

        return sqrt(variance) // Return standard deviation
    }

    fun getTiltAngle(): Float {
        if (sensorBuffer.isEmpty()) return 0f

        val lastData = sensorBuffer.last()
        val accelMagnitude = sqrt(
            lastData.accelerometerX * lastData.accelerometerX +
            lastData.accelerometerY * lastData.accelerometerY +
            lastData.accelerometerZ * lastData.accelerometerZ
        )

        return if (accelMagnitude > 0) {
            (Math.acos((lastData.accelerometerZ / accelMagnitude).toDouble()) * 180 / Math.PI).toFloat()
        } else {
            0f
        }
    }

    fun getAverageAcceleration(): Float {
        return if (sensorBuffer.isEmpty()) 0f else sensorBuffer.map { it.magnitude }.average().toFloat()
    }

    fun getAverageJerk(): Float {
        return if (sensorBuffer.isEmpty()) 0f else sensorBuffer.map { it.jerk }.average().toFloat()
    }

    fun getAverageGyro(): Float {
        return if (sensorBuffer.isEmpty()) {
            0f
        } else {
            sensorBuffer.map {
                sqrt(it.gyroscopeX * it.gyroscopeX + it.gyroscopeY * it.gyroscopeY + it.gyroscopeZ * it.gyroscopeZ)
            }.average().toFloat()
        }
    }

    fun reset() {
        sensorBuffer.clear()
        isInFreeFall = false
        freeFallStartTime = 0
    }

    fun getBufferSize(): Int = sensorBuffer.size
}

sealed class FallDetectionResult {
    object NO_FALL : FallDetectionResult()
    object POTENTIAL_FALL_DETECTED : FallDetectionResult()
    object FALL_CONFIRMED : FallDetectionResult()
}
