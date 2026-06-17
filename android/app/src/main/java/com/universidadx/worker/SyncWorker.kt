package com.universidadx.worker

import android.content.Context
import android.util.Log
import androidx.hilt.work.HiltWorker
import androidx.work.*
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.universidadx.data.local.db.dao.SyncQueueDao
import com.universidadx.data.remote.api.SyncApi
import com.universidadx.data.remote.api.SyncBatchBody
import com.universidadx.data.remote.api.SyncEventDto
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import java.util.concurrent.TimeUnit

@HiltWorker
class SyncWorker @AssistedInject constructor(
    @Assisted ctx: Context,
    @Assisted params: WorkerParameters,
    private val syncQueueDao: SyncQueueDao,
    private val syncApi:      SyncApi,
) : CoroutineWorker(ctx, params) {

    private val gson = Gson()
    private val mapType = object : TypeToken<Map<String, Any>>() {}.type

    override suspend fun doWork(): Result {
        val pending = syncQueueDao.getPending()
        if (pending.isEmpty()) return Result.success()

        Log.d(TAG, "Syncing ${pending.size} events")

        val events = pending.map { entity ->
            val payload: Map<String, Any> = gson.fromJson(entity.payloadJson, mapType)
            SyncEventDto(
                idempotency_key = entity.idempotencyKey,
                type            = entity.eventType,
                user_id         = entity.userId,
                content_item_id = entity.contentItemId,
                payload         = payload,
            )
        }

        return try {
            val result = syncApi.syncBatch(SyncBatchBody(events = events))
            Log.d(TAG, "Sync done — applied=${result.applied} skipped=${result.skipped} failed=${result.failed}")

            // Mark all as synced (even skipped ones — they're already on server)
            syncQueueDao.markSynced(pending.map { it.id })

            // Prune old synced events older than 7 days
            syncQueueDao.pruneSynced(System.currentTimeMillis() - 7 * 24 * 3600 * 1000L)

            Result.success()
        } catch (e: Exception) {
            Log.w(TAG, "Sync failed: ${e.message}")
            syncQueueDao.incrementRetry(pending.map { it.id })
            if (runAttemptCount < 3) Result.retry() else Result.failure()
        }
    }

    companion object {
        private const val TAG        = "SyncWorker"
        const val WORK_NAME_PERIODIC = "sync_periodic"
        const val WORK_NAME_IMMEDIATE = "sync_immediate"

        fun periodicRequest(): PeriodicWorkRequest =
            PeriodicWorkRequestBuilder<SyncWorker>(15, TimeUnit.MINUTES)
                .setConstraints(
                    Constraints.Builder()
                        .setRequiredNetworkType(NetworkType.CONNECTED)
                        .build()
                )
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
                .build()

        fun immediateRequest(): OneTimeWorkRequest =
            OneTimeWorkRequestBuilder<SyncWorker>()
                .setConstraints(
                    Constraints.Builder()
                        .setRequiredNetworkType(NetworkType.CONNECTED)
                        .build()
                )
                .build()
    }
}
