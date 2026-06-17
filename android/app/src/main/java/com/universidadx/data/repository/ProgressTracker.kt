package com.universidadx.data.repository

import com.google.gson.Gson
import com.universidadx.data.local.db.dao.ProgressDao
import com.universidadx.data.local.db.dao.SyncQueueDao
import com.universidadx.data.local.entity.ProgressEntity
import com.universidadx.data.local.entity.SyncQueueEntity
import kotlinx.coroutines.flow.Flow
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ProgressTracker @Inject constructor(
    private val progressDao:  ProgressDao,
    private val syncQueueDao: SyncQueueDao,
) {
    private val gson = Gson()

    fun observeProgress(userId: String): Flow<List<ProgressEntity>> =
        progressDao.observeAll(userId)

    // Called every ~5 seconds while a video plays
    suspend fun recordVideoProgress(userId: String, contentItemId: String, seconds: Int) {
        // Ensure a row exists first
        val existing = progressDao.get(userId, contentItemId)
        if (existing == null) {
            progressDao.upsert(ProgressEntity(userId = userId, contentItemId = contentItemId, progressSeconds = seconds))
        } else {
            progressDao.updateSeconds(userId, contentItemId, seconds)
        }
        enqueueProgressUpdate(userId, contentItemId, seconds, completed = false)
    }

    suspend fun markContentComplete(userId: String, contentItemId: String) {
        val existing = progressDao.get(userId, contentItemId)
        if (existing?.completed == true) return
        if (existing == null) {
            progressDao.upsert(ProgressEntity(userId = userId, contentItemId = contentItemId, completed = true))
        } else {
            progressDao.markComplete(userId, contentItemId)
        }
        enqueueContentComplete(userId, contentItemId)
    }

    suspend fun recordQuizResult(
        userId:        String,
        contentItemId: String,
        score:         Float,
        answers:       Map<String, String>,
    ) {
        val existing = progressDao.get(userId, contentItemId)
        val bestScore = maxOf(score, existing?.score ?: 0f)
        progressDao.upsert(
            ProgressEntity(
                userId        = userId,
                contentItemId = contentItemId,
                completed     = score >= 60f,
                score         = bestScore,
                attempts      = (existing?.attempts ?: 0) + 1,
            )
        )
        enqueueQuizSubmit(userId, contentItemId, score, answers)
    }

    fun observePendingCount(): Flow<Int> = syncQueueDao.observePendingCount()

    private suspend fun enqueueProgressUpdate(userId: String, contentItemId: String, seconds: Int, completed: Boolean) {
        val key = "progress_${userId}_${contentItemId}_${seconds / 30}" // bucket per 30s to reduce noise
        syncQueueDao.enqueue(
            SyncQueueEntity(
                idempotencyKey = key,
                eventType      = "progress_update",
                userId         = userId,
                contentItemId  = contentItemId,
                payloadJson    = gson.toJson(mapOf("progress_seconds" to seconds, "completed" to completed)),
            )
        )
    }

    private suspend fun enqueueContentComplete(userId: String, contentItemId: String) {
        val key = "complete_${userId}_${contentItemId}"
        syncQueueDao.enqueue(
            SyncQueueEntity(
                idempotencyKey = key,
                eventType      = "content_complete",
                userId         = userId,
                contentItemId  = contentItemId,
                payloadJson    = "{}",
            )
        )
    }

    private suspend fun enqueueQuizSubmit(
        userId:        String,
        contentItemId: String,
        score:         Float,
        answers:       Map<String, String>,
    ) {
        val key = "quiz_${userId}_${contentItemId}_${UUID.randomUUID()}"
        syncQueueDao.enqueue(
            SyncQueueEntity(
                idempotencyKey = key,
                eventType      = "quiz_submit",
                userId         = userId,
                contentItemId  = contentItemId,
                payloadJson    = gson.toJson(mapOf("score" to score, "answers" to answers)),
            )
        )
    }
}
