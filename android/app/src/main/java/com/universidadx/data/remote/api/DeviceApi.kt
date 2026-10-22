package com.universidadx.data.remote.api

import retrofit2.http.Body
import retrofit2.http.HTTP
import retrofit2.http.POST

data class DeviceTokenBody(val token: String, val platform: String = "android")

interface DeviceApi {
    @POST("notifications/devices")
    suspend fun register(@Body body: DeviceTokenBody)

    // DELETE con body: Retrofit lo exige con @HTTP(hasBody = true)
    @HTTP(method = "DELETE", path = "notifications/devices", hasBody = true)
    suspend fun unregister(@Body body: DeviceTokenBody)
}
