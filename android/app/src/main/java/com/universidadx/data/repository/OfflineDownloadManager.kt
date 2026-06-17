package com.universidadx.data.repository

import android.content.Context
import androidx.work.WorkManager
import com.universidadx.data.local.db.dao.DownloadDao
import com.universidadx.data.local.entity.DownloadEntity
import com.universidadx.data.local.entity.DownloadStatus
import com.universidadx.worker.DownloadWorker
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import java.io.File
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class OfflineDownloadManager @Inject constructor(
    @ApplicationContext private val ctx: Context,
    private val downloadDao: DownloadDao,
) {
    private val workManager = WorkManager.getInstance(ctx)

    fun observeDownloads(courseId: String): Flow<List<DownloadEntity>> =
        downloadDao.observeByCourse(courseId)

    suspend fun enqueue(
        contentItemId: String,
        courseId:      String,
        title:         String,
        videoUrl:      String,
    ) {
        val existing = downloadDao.get(contentItemId)
        if (existing?.status == DownloadStatus.COMPLETED) return   // already downloaded

        downloadDao.upsert(
            DownloadEntity(
                contentItemId = contentItemId,
                courseId      = courseId,
                title         = title,
                localPath     = null,
                status        = DownloadStatus.PENDING,
            )
        )

        val req = DownloadWorker.buildRequest(contentItemId, videoUrl, courseId, title)
        workManager.enqueueUniqueWork(
            "dl_$contentItemId",
            androidx.work.ExistingWorkPolicy.KEEP,
            req,
        )
    }

    suspend fun cancel(contentItemId: String) {
        workManager.cancelAllWorkByTag("download_$contentItemId")
        downloadDao.updateProgress(contentItemId, 0L, DownloadStatus.FAILED)
    }

    suspend fun delete(contentItemId: String) {
        val entity = downloadDao.get(contentItemId) ?: return
        entity.localPath?.let { File(it).delete() }
        downloadDao.delete(contentItemId)
    }

    suspend fun getLocalPath(contentItemId: String): String? {
        val entity = downloadDao.get(contentItemId)
        if (entity?.status != DownloadStatus.COMPLETED) return null
        val file = entity.localPath?.let { File(it) }
        return if (file?.exists() == true) file.absolutePath else null
    }

    suspend fun isDownloaded(contentItemId: String): Boolean =
        getLocalPath(contentItemId) != null
}
