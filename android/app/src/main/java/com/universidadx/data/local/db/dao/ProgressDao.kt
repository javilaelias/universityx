package com.universidadx.data.local.db.dao

import androidx.room.*
import com.universidadx.data.local.entity.ProgressEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface ProgressDao {

    @Query("SELECT * FROM progress WHERE userId = :userId")
    fun observeAll(userId: String): Flow<List<ProgressEntity>>

    @Query("SELECT * FROM progress WHERE userId = :userId AND contentItemId = :contentItemId")
    suspend fun get(userId: String, contentItemId: String): ProgressEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(entity: ProgressEntity)

    @Query("""
        UPDATE progress
        SET progressSeconds = MAX(progressSeconds, :seconds),
            updatedAt = :now,
            syncedAt  = NULL
        WHERE userId = :userId AND contentItemId = :contentItemId
    """)
    suspend fun updateSeconds(userId: String, contentItemId: String, seconds: Int, now: Long = System.currentTimeMillis())

    @Query("""
        UPDATE progress
        SET completed = 1, updatedAt = :now, syncedAt = NULL
        WHERE userId = :userId AND contentItemId = :contentItemId AND completed = 0
    """)
    suspend fun markComplete(userId: String, contentItemId: String, now: Long = System.currentTimeMillis())

    @Query("SELECT * FROM progress WHERE userId = :userId AND syncedAt IS NULL")
    suspend fun getPending(userId: String): List<ProgressEntity>

    @Query("UPDATE progress SET syncedAt = :now WHERE id IN (:ids)")
    suspend fun markSynced(ids: List<Long>, now: Long = System.currentTimeMillis())
}
