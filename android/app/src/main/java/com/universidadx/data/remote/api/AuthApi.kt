package com.universidadx.data.remote.api

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

data class LoginBody(val email: String, val password: String)
data class RefreshBody(val refreshToken: String)

data class UserDto(
    val id:         String,
    val email:      String,
    val full_name:  String,
    val role:       String,
    val avatar_url: String?,
)

data class AuthResponse(
    val user:         UserDto,
    val accessToken:  String,
    val refreshToken: String,
)

data class RefreshResponse(
    val accessToken:  String,
    val refreshToken: String,
)

interface AuthApi {
    @POST("auth/login")
    suspend fun login(@Body body: LoginBody): AuthResponse

    @POST("auth/refresh")
    suspend fun refresh(@Body body: RefreshBody): RefreshResponse

    @GET("auth/me")
    suspend fun me(): UserDto

    @POST("auth/logout")
    suspend fun logout(@Body body: Map<String, String>)
}
