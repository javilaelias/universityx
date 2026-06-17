package com.universidadx.ui.login

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    viewModel: LoginViewModel = hiltViewModel(),
) {
    val uiState     by viewModel.uiState.collectAsStateWithLifecycle()
    var email       by remember { mutableStateOf("") }
    var password    by remember { mutableStateOf("") }
    var showPass    by remember { mutableStateOf(false) }

    LaunchedEffect(uiState) {
        if (uiState is LoginUiState.Success) onLoginSuccess()
    }

    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Card(
            modifier  = Modifier.fillMaxWidth(0.9f),
            shape     = RoundedCornerShape(24.dp),
            elevation = CardDefaults.cardElevation(4.dp),
        ) {
            Column(
                modifier              = Modifier.padding(24.dp),
                verticalArrangement   = Arrangement.spacedBy(16.dp),
                horizontalAlignment   = Alignment.CenterHorizontally,
            ) {
                Text("Universidad X", fontWeight = FontWeight.Bold, fontSize = 24.sp)
                Text("Inicia sesión para continuar", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 14.sp)

                OutlinedTextField(
                    value         = email,
                    onValueChange = { email = it },
                    label         = { Text("Correo electrónico") },
                    singleLine    = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    modifier      = Modifier.fillMaxWidth(),
                    shape         = RoundedCornerShape(12.dp),
                )

                OutlinedTextField(
                    value               = password,
                    onValueChange       = { password = it },
                    label               = { Text("Contraseña") },
                    singleLine          = true,
                    visualTransformation = if (showPass) VisualTransformation.None else PasswordVisualTransformation(),
                    keyboardOptions     = KeyboardOptions(keyboardType = KeyboardType.Password),
                    trailingIcon        = {
                        IconButton(onClick = { showPass = !showPass }) {
                            Icon(if (showPass) Icons.Default.VisibilityOff else Icons.Default.Visibility, null)
                        }
                    },
                    modifier            = Modifier.fillMaxWidth(),
                    shape               = RoundedCornerShape(12.dp),
                )

                if (uiState is LoginUiState.Error) {
                    Text(
                        text  = (uiState as LoginUiState.Error).message,
                        color = MaterialTheme.colorScheme.error,
                        fontSize = 13.sp,
                    )
                }

                Button(
                    onClick  = { viewModel.login(email, password) },
                    enabled  = uiState !is LoginUiState.Loading && email.isNotBlank() && password.isNotBlank(),
                    modifier = Modifier.fillMaxWidth().height(50.dp),
                    shape    = RoundedCornerShape(12.dp),
                ) {
                    if (uiState is LoginUiState.Loading) {
                        CircularProgressIndicator(modifier = Modifier.size(22.dp), strokeWidth = 2.dp, color = MaterialTheme.colorScheme.onPrimary)
                    } else {
                        Text("Iniciar sesión", fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }
    }
}
