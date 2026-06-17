package com.universidadx.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.universidadx.ui.courses.CourseListScreen
import com.universidadx.ui.downloads.CourseDownloadScreen
import com.universidadx.ui.login.LoginScreen

sealed class Screen(val route: String) {
    object Login       : Screen("login")
    object Courses     : Screen("courses")
    object Downloads   : Screen("downloads/{courseId}") {
        fun withId(id: String) = "downloads/$id"
    }
}

@Composable
fun NavGraph(
    navController: NavHostController,
    startDestination: String,
) {
    NavHost(navController = navController, startDestination = startDestination) {
        composable(Screen.Login.route) {
            LoginScreen(onLoginSuccess = { navController.navigate(Screen.Courses.route) {
                popUpTo(Screen.Login.route) { inclusive = true }
            }})
        }

        composable(Screen.Courses.route) {
            CourseListScreen(
                onCourseClick = { courseId -> navController.navigate(Screen.Downloads.withId(courseId)) },
            )
        }

        composable(
            route     = Screen.Downloads.route,
            arguments = listOf(navArgument("courseId") { type = NavType.StringType }),
        ) { back ->
            val courseId = back.arguments?.getString("courseId") ?: return@composable
            CourseDownloadScreen(
                courseId = courseId,
                onBack   = { navController.popBackStack() },
            )
        }
    }
}
