package com.universidadx.auth

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TokenManager @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private val prefs by lazy {
        val master = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        EncryptedSharedPreferences.create(
            context,
            "ux_tokens",
            master,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
        )
    }

    var accessToken: String?
        get()      = prefs.getString(KEY_ACCESS, null)
        set(value) = prefs.edit().apply { if (value != null) putString(KEY_ACCESS, value) else remove(KEY_ACCESS) }.apply()

    var refreshToken: String?
        get()      = prefs.getString(KEY_REFRESH, null)
        set(value) = prefs.edit().apply { if (value != null) putString(KEY_REFRESH, value) else remove(KEY_REFRESH) }.apply()

    var userId: String?
        get()      = prefs.getString(KEY_USER_ID, null)
        set(value) = prefs.edit().apply { if (value != null) putString(KEY_USER_ID, value) else remove(KEY_USER_ID) }.apply()

    var userRole: String?
        get()      = prefs.getString(KEY_ROLE, null)
        set(value) = prefs.edit().apply { if (value != null) putString(KEY_ROLE, value) else remove(KEY_ROLE) }.apply()

    fun clear() = prefs.edit().clear().apply()

    val isLoggedIn: Boolean get() = accessToken != null

    companion object {
        private const val KEY_ACCESS  = "access_token"
        private const val KEY_REFRESH = "refresh_token"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_ROLE    = "user_role"
    }
}
