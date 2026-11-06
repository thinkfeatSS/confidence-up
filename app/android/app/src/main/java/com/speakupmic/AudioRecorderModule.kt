package com.speakupmic

import android.media.MediaRecorder
import android.os.Build
import android.os.Handler
import android.os.Looper
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.File

class AudioRecorderModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var mediaRecorder: MediaRecorder? = null
    private var isRecording = false
    private var currentFilePath: String? = null
    private var startTimeMillis: Long = 0
    private val handler = Handler(Looper.getMainLooper())
    private var meteringRunnable: Runnable? = null

    override fun getName(): String = "AudioRecorderModule"

    @ReactMethod
    fun startRecording(sessionId: String?, promise: Promise) {
        if (isRecording) {
            promise.reject("E_ALREADY_RECORDING", "A recording is already in progress.")
            return
        }

        try {
            val audioDir = File(reactContext.cacheDir, "audio_recordings")
            if (!audioDir.exists()) {
                audioDir.mkdirs()
            }

            val id = sessionId ?: System.currentTimeMillis().toString()
            val outputFile = File(audioDir, "speech_$id.m4a")
            currentFilePath = outputFile.absolutePath

            val recorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                MediaRecorder(reactContext)
            } else {
                @Suppress("DEPRECATION")
                MediaRecorder()
            }

            recorder.apply {
                setAudioSource(MediaRecorder.AudioSource.MIC)
                setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                setAudioSamplingRate(16000)
                setAudioEncodingBitRate(64000)
                setAudioChannels(1)
                setOutputFile(currentFilePath)
                prepare()
                start()
            }

            mediaRecorder = recorder
            isRecording = true
            startTimeMillis = System.currentTimeMillis()

            startMetering()

            val map = Arguments.createMap().apply {
                putString("filePath", currentFilePath)
            }
            promise.resolve(map)
        } catch (e: Exception) {
            cleanupRecorder()
            promise.reject("E_START_FAILED", "Failed to start audio recording: ${e.message}", e)
        }
    }

    @ReactMethod
    fun stopRecording(promise: Promise) {
        if (!isRecording || mediaRecorder == null) {
            promise.reject("E_NOT_RECORDING", "No active audio recording to stop.")
            return
        }

        try {
            stopMetering()

            val durationSeconds = (System.currentTimeMillis() - startTimeMillis).toDouble() / 1000.0

            mediaRecorder?.apply {
                try {
                    stop()
                } catch (ignored: RuntimeException) {
                    // Happens if stopped immediately after starting
                }
                reset()
                release()
            }
            mediaRecorder = null
            isRecording = false

            val filePath = currentFilePath
            val file = filePath?.let { File(it) }
            val fileSizeBytes = if (file != null && file.exists()) file.length().toDouble() else 0.0

            val result = Arguments.createMap().apply {
                putString("filePath", filePath)
                putDouble("durationSeconds", durationSeconds)
                putDouble("fileSizeBytes", fileSizeBytes)
                putString("mimeType", "audio/m4a")
            }
            promise.resolve(result)
        } catch (e: Exception) {
            cleanupRecorder()
            promise.reject("E_STOP_FAILED", "Failed to stop recording: ${e.message}", e)
        }
    }

    @ReactMethod
    fun cancelRecording(promise: Promise) {
        try {
            cleanupRecorder()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("E_CANCEL_FAILED", "Failed to cancel recording: ${e.message}", e)
        }
    }

    @ReactMethod
    fun isRecording(promise: Promise) {
        promise.resolve(isRecording)
    }

    @ReactMethod
    fun addListener(eventName: String?) {
        // Required for React Native NativeEventEmitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for React Native NativeEventEmitter
    }

    private fun startMetering() {
        meteringRunnable = object : Runnable {
            override fun run() {
                if (isRecording && mediaRecorder != null) {
                    try {
                        val maxAmp = mediaRecorder?.maxAmplitude ?: 0
                        // Max amplitude ranges from 0 to 32767
                        val normalized = (maxAmp.toDouble() / 32767.0).coerceIn(0.0, 1.0)
                        val scaledPercent = normalized * 100.0

                        val params = Arguments.createMap().apply {
                            putDouble("volume", scaledPercent)
                            putDouble("normalized", normalized)
                        }
                        emitEvent("onAudioMetering", params)
                    } catch (ignored: Exception) {}
                    handler.postDelayed(this, 50)
                }
            }
        }
        handler.postDelayed(meteringRunnable!!, 50)
    }

    private fun stopMetering() {
        meteringRunnable?.let { handler.removeCallbacks(it) }
        meteringRunnable = null
    }

    private fun cleanupRecorder() {
        stopMetering()
        try {
            mediaRecorder?.reset()
            mediaRecorder?.release()
        } catch (ignored: Exception) {}
        mediaRecorder = null
        isRecording = false

        currentFilePath?.let { path ->
            try {
                val f = File(path)
                if (f.exists()) f.delete()
            } catch (ignored: Exception) {}
        }
        currentFilePath = null
    }

    private fun emitEvent(eventName: String, params: WritableMap) {
        if (reactContext.hasActiveReactInstance()) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
        }
    }
}

