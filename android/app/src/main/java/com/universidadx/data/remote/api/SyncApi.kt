package com.universidadx.data.remote.api

import retrofit2.http.Body
import retrofit2.http.POST

data class SyncEventDto(
    val idempotency_key:  String,
    val type:             String,
    val user_id:          String,
    val content_item_id:  String,
    val payload:          Map<String, Any>,
)

data class SyncBatchBody(val events: List<SyncEventDto>)

data class SyncResultDto(
    val applied:  Int,
    val skipped:  Int,
    val failed:   Int,
    val results:  List<Map<String, Any>>,
)

interface SyncApi {
    @POST("sync/batch")
    suspend fun syncBatch(@Body body: SyncBatchBody): SyncResultDto
}
