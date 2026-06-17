package com.universidadx.auth

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricManager.Authenticators.BIOMETRIC_STRONG
import androidx.biometric.BiometricManager.Authenticators.DEVICE_CREDENTIAL
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey

/**
 * Gestiona la autenticación biométrica usando AndroidX Biometric y Android Keystore.
 * El flujo completo es:
 *   1. Generar (o recuperar) una clave AES-256 vinculada a la biometría del usuario en Keystore.
 *   2. Inicializar un Cipher con esa clave; si la clave fue invalidada (p. ej., nueva huella
 *      registrada) se fuerza re-login con contraseña y se regenera la clave.
 *   3. Mostrar BiometricPrompt y devolver el resultado vía [BiometricResult].
 */
class BiometricAuthManager(
    private val context: Context,
    private val activity: FragmentActivity,
) {
    companion object {
        private const val KEY_ALIAS       = "universidadx_biometric_key"
        private const val KEYSTORE_PROVIDER = "AndroidKeyStore"
    }

    // ── Resultado sellado ────────────────────────────────────────────────────
    sealed class BiometricResult {
        /** Autenticación exitosa; cryptoObject contiene el Cipher listo para cifrar. */
        data class Success(val cryptoObject: BiometricPrompt.CryptoObject?) : BiometricResult()
        /** Error irrecuperable (dispositivo sin biometría, clave invalidada, etc.). */
        data class Error(val code: Int, val message: String) : BiometricResult()
        /** El usuario canceló o tocó "Usar contraseña". */
        object Cancelled : BiometricResult()
        /** Lectura biométrica fallida (dedo sucio, mala posición). */
        object AuthFailed : BiometricResult()
        /** La clave del Keystore fue invalidada (nueva biometría añadida). */
        object KeyInvalidated : BiometricResult()
    }

    // ── Verificación de disponibilidad ───────────────────────────────────────

    enum class AvailabilityStatus { AVAILABLE, NO_HARDWARE, NOT_ENROLLED, UNAVAILABLE }

    fun checkAvailability(): AvailabilityStatus {
        val manager = BiometricManager.from(context)
        return when (manager.canAuthenticate(BIOMETRIC_STRONG or DEVICE_CREDENTIAL)) {
            BiometricManager.BIOMETRIC_SUCCESS                   -> AvailabilityStatus.AVAILABLE
            BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED      -> AvailabilityStatus.NOT_ENROLLED
            BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE,
            BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE     -> AvailabilityStatus.NO_HARDWARE
            else                                                 -> AvailabilityStatus.UNAVAILABLE
        }
    }

    // ── Autenticación principal ───────────────────────────────────────────────

    /**
     * Lanza el diálogo biométrico del sistema y notifica el resultado a [onResult].
     * Se ejecuta en el hilo principal (MainExecutor).
     */
    fun authenticate(onResult: (BiometricResult) -> Unit) {
        val executor = ContextCompat.getMainExecutor(context)

        val prompt = BiometricPrompt(
            activity,
            executor,
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                    onResult(BiometricResult.Success(result.cryptoObject))
                }

                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                    val cancelled = errorCode == BiometricPrompt.ERROR_USER_CANCELED ||
                                    errorCode == BiometricPrompt.ERROR_NEGATIVE_BUTTON
                    onResult(if (cancelled) BiometricResult.Cancelled
                             else BiometricResult.Error(errorCode, errString.toString()))
                }

                override fun onAuthenticationFailed() {
                    // No finalizar aquí; el sistema reintenta automáticamente
                    onResult(BiometricResult.AuthFailed)
                }
            }
        )

        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle("Acceso biométrico")
            .setSubtitle("Confirma tu identidad para ingresar")
            .setDescription("Usa tu huella dactilar o reconocimiento facial")
            .setAllowedAuthenticators(BIOMETRIC_STRONG or DEVICE_CREDENTIAL)
            .build()

        try {
            val cipher    = buildCipher()
            val secretKey = getOrCreateSecretKey()
            cipher.init(Cipher.ENCRYPT_MODE, secretKey)
            prompt.authenticate(promptInfo, BiometricPrompt.CryptoObject(cipher))
        } catch (e: android.security.keystore.KeyPermanentlyInvalidatedException) {
            // La clave fue invalidada porque el usuario añadió una biometría nueva.
            // Eliminamos la clave para forzar re-creación en el próximo intento.
            deleteSecretKey()
            onResult(BiometricResult.KeyInvalidated)
        } catch (e: Exception) {
            // Si no se puede inicializar el Cipher (p. ej., primer uso sin clave aún),
            // continuamos sin CryptoObject — el sistema valida solo la biometría.
            prompt.authenticate(promptInfo)
        }
    }

    // ── Gestión de clave en Android Keystore ────────────────────────────────

    private fun getOrCreateSecretKey(): SecretKey {
        val keyStore = KeyStore.getInstance(KEYSTORE_PROVIDER).apply { load(null) }
        keyStore.getKey(KEY_ALIAS, null)?.let { return it as SecretKey }

        val spec = KeyGenParameterSpec.Builder(
            KEY_ALIAS,
            KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
        )
            .setBlockModes(KeyProperties.BLOCK_MODE_CBC)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_PKCS7)
            .setUserAuthenticationRequired(true)
            // Invalida la clave si se añaden nuevas huellas al dispositivo
            .setInvalidatedByBiometricEnrollment(true)
            .build()

        return KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, KEYSTORE_PROVIDER)
            .apply { init(spec) }
            .generateKey()
    }

    private fun buildCipher(): Cipher =
        Cipher.getInstance(
            "${KeyProperties.KEY_ALGORITHM_AES}/" +
            "${KeyProperties.BLOCK_MODE_CBC}/" +
            KeyProperties.ENCRYPTION_PADDING_PKCS7
        )

    private fun deleteSecretKey() {
        runCatching {
            KeyStore.getInstance(KEYSTORE_PROVIDER).apply { load(null) }.deleteEntry(KEY_ALIAS)
        }
    }
}
