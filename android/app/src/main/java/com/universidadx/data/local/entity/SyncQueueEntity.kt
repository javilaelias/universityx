package com.universidadx.data.local.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "sync_queue",
    indices = [Index(value = ["idempotencyKey"], unique = true)],
)
data class SyncQueueEntity(
    @PrimaryKey(autoGenerate = true)
    val id:             Long   = 0,
    val idempotencyKey: String,
    val eventType:      String,
    val userId:         String,
    val contentItemId:  String,
    val payloadJson:    String,
    val createdAt:      Long   = System.currentTimeMillis(),
    val syncedAt:       Long?  = null,
    val retryCount:     Int    = 0,
)
