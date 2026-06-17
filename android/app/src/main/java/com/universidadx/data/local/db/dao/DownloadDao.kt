package com.universidadx.data.local.db.dao

import androidx.room.*
import com.universidadx.data.local.entity.DownloadEntity
import com.universidadx.data.local.entity.DownloadStatus
import kotlinx.coroutines.flow.Flow

@Dao
interface DownloadDao {

    @Query("SELECT * FROM downloads WHERE courseId = :courseId")
    fun observeByCourse(courseId: String): Flow<List<DownloadEntity>>

    @Query("SELECT * FROM downloads WHERE contentItemId = :id")
    suspend fun get(id: String): DownloadEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(entity: DownloadEntity)

    @Query("""
        UPDATE downloads
        SET downloadedBytes = :downloaded, status = :status
        WHERE contentItemId = :id
    """)
    suspend fun updateProgress(id: String, downloaded: Long, status: DownloadStatus)

    @Query("UPDATE downloads SET status = :status, localPath = :path, completedAt = :now WHERE contentItemId = :id")
    suspend fun markComplete(id: String, path: String, now: Long = System.currentTimeMillis(), status: DownloadStatus = DownloadStatus.COMPLETED)

    @Query("DELETE FROM downloads WHERE contentItemId = :id")
    suspend fun delete(id: String)

    @Query("SELECT * FROM downloads WHERE status = 'COMPLETED'")
    suspend fun getCompleted(): List<DownloadEntity>
}
