package com.universidadx

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import androidx.navigation.compose.rememberNavController
import com.universidadx.auth.TokenManager
import com.universidadx.ui.navigation.NavGraph
import com.universidadx.ui.navigation.Screen
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject lateinit var tokenManager: TokenManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                val navController     = rememberNavController()
                val startDestination  = if (tokenManager.isLoggedIn) Screen.Courses.route else Screen.Login.route
                NavGraph(navController = navController, startDestination = startDestination)
            }
        }
    }
}
