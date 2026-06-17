package com.universidadx.data.local.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "progress",
    indices = [Index(value = ["userId", "contentItemId"], unique = true)],
)
data class ProgressEntity(
    @PrimaryKey(autoGenerate = true)
    val id:              Long   = 0,
    val userId:          String,
    val contentItemId:   String,
    val progressSeconds: Int    = 0,
    val completed:       Boolean = false,
    val score:           Float?  = null,
    val attempts:        Int     = 0,
    val updatedAt:       Long    = System.currentTimeMillis(),
    val syncedAt:        Long?   = null,
)
