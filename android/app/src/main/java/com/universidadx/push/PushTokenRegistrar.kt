package com.universidadx.push

import android.content.Context
import android.util.Log
import com.google.firebase.FirebaseApp
import com.google.firebase.messaging.FirebaseMessaging
import com.universidadx.auth.TokenManager
import com.universidadx.data.remote.api.DeviceApi
import com.universidadx.data.remote.api.DeviceTokenBody
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeoutOrNull
import javax.inject.Inject
import javax.inject.Singleton
import kotlin.coroutines.resume

/**
 * Registra en notification-service el token FCM del dispositivo para el usuario con sesión.
 * Sin Firebase configurado (no hay google-services.json en el build) no hace nada.
 */
@Singleton
class PushTokenRegistrar @Inject constructor(
    @ApplicationContext private val context: Context,
    private val deviceApi:    DeviceApi,
    private val tokenManager: TokenManager,
) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    private val firebaseReady: Boolean get() = FirebaseApp.getApps(context).isNotEmpty()

    /** Token nuevo o rotado (FcmService.onNewToken): solo se envía si hay sesión. */
    fun onNewToken(token: String) {
        if (tokenManager.isLoggedIn) scope.launch { register(token) }
    }

    /** Tras el login: pide el token actual y lo registra. */
    fun registerCurrent() {
        scope.launch { currentToken()?.let { register(it) } }
    }

    /** Antes del logout (con el access token todavía vigente): deja de recibir push en este equipo. */
    suspend fun unregisterCurrent() {
        val token = currentToken() ?: return
        runCatching { deviceApi.unregister(DeviceTokenBody(token)) }
            .onFailure { Log.w(TAG, "No se pudo desregistrar el token", it) }
    }

    private suspend fun register(token: String) {
        runCatching { deviceApi.register(DeviceTokenBody(token)) }
            .onFailure { Log.w(TAG, "No se pudo registrar el token", it) }
    }

    private suspend fun currentToken(): String? {
        if (!firebaseReady) return null
        // Sin Play Services o sin red la tarea puede no completar nunca: el logout no debe quedar colgado.
        return withTimeoutOrNull(TOKEN_TIMEOUT_MS) {
            suspendCancellableCoroutine { cont ->
                FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
                    if (cont.isActive) cont.resume(if (task.isSuccessful) task.result else null)
                }
            }
        }
    }

    private companion object {
        const val TAG = "PushTokenRegistrar"
        const val TOKEN_TIMEOUT_MS = 5_000L
    }
}
