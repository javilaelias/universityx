package com.universidadx.domain.model

import java.time.Instant

data class SyncEvent(
    val id:              Long = 0,
    val idempotencyKey:  String,
    val type:            SyncEventType,
    val userId:          String,
    val contentItemId:   String,
    val payload:         String,       // JSON string
    val createdAt:       Instant = Instant.now(),
    val syncedAt:        Instant? = null,
)

enum class SyncEventType {
    PROGRESS_UPDATE,
    CONTENT_COMPLETE,
    QUIZ_SUBMIT,
}
