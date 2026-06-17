package com.universidadx.data.local.db.dao

import androidx.room.*
import com.universidadx.data.local.entity.SyncQueueEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface SyncQueueDao {

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun enqueue(entity: SyncQueueEntity): Long

    @Query("SELECT * FROM sync_queue WHERE syncedAt IS NULL ORDER BY createdAt ASC LIMIT 200")
    suspend fun getPending(): List<SyncQueueEntity>

    @Query("SELECT COUNT(*) FROM sync_queue WHERE syncedAt IS NULL")
    fun observePendingCount(): Flow<Int>

    @Query("UPDATE sync_queue SET syncedAt = :now WHERE id IN (:ids)")
    suspend fun markSynced(ids: List<Long>, now: Long = System.currentTimeMillis())

    @Query("UPDATE sync_queue SET retryCount = retryCount + 1 WHERE id IN (:ids)")
    suspend fun incrementRetry(ids: List<Long>)

    @Query("DELETE FROM sync_queue WHERE syncedAt IS NOT NULL AND syncedAt < :before")
    suspend fun pruneSynced(before: Long)
}
