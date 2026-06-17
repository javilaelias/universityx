package com.universidadx.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "downloads")
data class DownloadEntity(
    @PrimaryKey
    val contentItemId:  String,
    val courseId:       String,
    val title:          String,
    val localPath:      String?,
    val sizeBytes:      Long    = 0L,
    val downloadedBytes: Long   = 0L,
    val status:         DownloadStatus = DownloadStatus.PENDING,
    val createdAt:      Long    = System.currentTimeMillis(),
    val completedAt:    Long?   = null,
)

enum class DownloadStatus { PENDING, DOWNLOADING, COMPLETED, FAILED, PAUSED }
