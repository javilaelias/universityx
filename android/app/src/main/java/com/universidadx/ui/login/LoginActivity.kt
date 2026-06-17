package com.universidadx.ui.login

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.universidadx.auth.BiometricAuthManager
import com.universidadx.databinding.ActivityLoginBinding
import com.universidadx.ui.dashboard.DashboardActivity
import kotlinx.coroutines.launch

class LoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLoginBinding
    private lateinit var biometricManager: BiometricAuthManager
    private val viewModel: LoginViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        biometricManager = BiometricAuthManager(this, this)

        setupObservers()
        setupClickListeners()
        checkAndOfferBiometric()
    }

    // ── UI State ─────────────────────────────────────────────────────────────

    private fun setupObservers() {
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.uiState.collect { state ->
                    when (state) {
                        is LoginUiState.Idle       -> showIdleState()
                        is LoginUiState.Loading    -> showLoadingState()
                        is LoginUiState.Success    -> navigateToDashboard()
                        is LoginUiState.Error      -> showError(state.message)
                        is LoginUiState.NeedsBiometricSetup -> promptEnrollBiometric()
                    }
                }
            }
        }
    }

    private fun showIdleState() {
        binding.progressBar.visibility  = View.GONE
        binding.btnLogin.isEnabled      = true
        binding.btnBiometric.isEnabled  = true
        binding.tvError.visibility      = View.GONE
    }

    private fun showLoadingState() {
        binding.progressBar.visibility  = View.VISIBLE
        binding.btnLogin.isEnabled      = false
        binding.btnBiometric.isEnabled  = false
        binding.tvError.visibility      = View.GONE
    }

    private fun showError(message: String) {
        binding.progressBar.visibility  = View.GONE
        binding.btnLogin.isEnabled      = true
        binding.btnBiometric.isEnabled  = true
        binding.tvError.text            = message
        binding.tvError.visibility      = View.VISIBLE
    }

    // ── Click Listeners ───────────────────────────────────────────────────────

    private fun setupClickListeners() {
        binding.btnLogin.setOnClickListener {
            val email    = binding.etEmail.text.toString().trim()
            val password = binding.etPassword.text.toString()
            viewModel.loginWithCredentials(email, password)
        }

        binding.btnSso.setOnClickListener {
            viewModel.initiateSSO()
        }

        binding.btnBiometric.setOnClickListener {
            launchBiometricAuth()
        }
    }

    // ── Biometría ─────────────────────────────────────────────────────────────

    /**
     * Si el usuario tiene biometría disponible y ya inició sesión antes,
     * se ofrece directamente la autenticación biométrica al abrir la app.
     */
    private fun checkAndOfferBiometric() {
        val hasStoredSession = viewModel.hasStoredSession()
        val biometricAvailable = biometricManager.checkAvailability() ==
                BiometricAuthManager.AvailabilityStatus.AVAILABLE

        if (hasStoredSession && biometricAvailable) {
            binding.btnBiometric.visibility = View.VISIBLE
            launchBiometricAuth()
        } else {
            binding.btnBiometric.visibility = View.GONE
        }
    }

    private fun launchBiometricAuth() {
        biometricManager.authenticate { result ->
            when (result) {
                is BiometricAuthManager.BiometricResult.Success -> {
                    // El Cipher firmado por la biometría se envía al ViewModel
                    // para descifrar el Refresh Token almacenado localmente.
                    viewModel.loginWithBiometric(result.cryptoObject)
                }

                is BiometricAuthManager.BiometricResult.KeyInvalidated -> {
                    // Nueva biometría detectada: se requiere contraseña una vez
                    showError("Se añadieron nuevas huellas. Por favor ingresa tu contraseña.")
                    binding.btnBiometric.visibility = View.GONE
                }

                is BiometricAuthManager.BiometricResult.Cancelled -> {
                    // El usuario eligió ingresar con contraseña
                    showIdleState()
                }

                is BiometricAuthManager.BiometricResult.AuthFailed -> {
                    // El sistema reintenta automáticamente; no hacemos nada
                }

                is BiometricAuthManager.BiometricResult.Error -> {
                    showError("Error biométrico: ${result.message}")
                }
            }
        }
    }

    private fun promptEnrollBiometric() {
        binding.tvBiometricHint.text       = "Activa la biometría en Ajustes para acceder más rápido"
        binding.tvBiometricHint.visibility = View.VISIBLE
        navigateToDashboard()
    }

    // ── Navegación ────────────────────────────────────────────────────────────

    private fun navigateToDashboard() {
        startActivity(Intent(this, DashboardActivity::class.java))
        finish()
    }
}
