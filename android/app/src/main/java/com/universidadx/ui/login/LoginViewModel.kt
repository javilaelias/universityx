package com.universidadx.ui.login

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.universidadx.auth.TokenManager
import com.universidadx.data.remote.api.AuthApi
import com.universidadx.data.remote.api.LoginBody
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class LoginUiState {
    object Idle    : LoginUiState()
    object Loading : LoginUiState()
    object Success : LoginUiState()
    data class Error(val message: String) : LoginUiState()
}

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authApi:      AuthApi,
    private val tokenManager: TokenManager,
) : ViewModel() {

    private val _uiState = MutableStateFlow<LoginUiState>(LoginUiState.Idle)
    val uiState: StateFlow<LoginUiState> = _uiState

    val isAlreadyLoggedIn: Boolean get() = tokenManager.isLoggedIn

    fun login(email: String, password: String) {
        if (email.isBlank() || password.isBlank()) {
            _uiState.value = LoginUiState.Error("Completa todos los campos")
            return
        }
        viewModelScope.launch {
            _uiState.value = LoginUiState.Loading
            _uiState.value = try {
                val resp = authApi.login(LoginBody(email, password))
                tokenManager.accessToken  = resp.accessToken
                tokenManager.refreshToken = resp.refreshToken
                tokenManager.userId       = resp.user.id
                tokenManager.userRole     = resp.user.role
                LoginUiState.Success
            } catch (e: Exception) {
                LoginUiState.Error(e.message ?: "Credenciales incorrectas")
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            try {
                tokenManager.refreshToken?.let { rt ->
                    authApi.logout(mapOf("refreshToken" to rt))
                }
            } catch (_: Exception) {}
            tokenManager.clear()
            _uiState.value = LoginUiState.Idle
        }
    }
}
