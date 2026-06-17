package com.universidadx.worker

import android.content.Context
import android.util.Log
import androidx.hilt.work.HiltWorker
import androidx.work.*
import com.universidadx.data.local.db.dao.DownloadDao
import com.universidadx.data.local.entity.DownloadStatus
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File

@HiltWorker
class DownloadWorker @AssistedInject constructor(
    @Assisted private val ctx: Context,
    @Assisted params: WorkerParameters,
    private val downloadDao: DownloadDao,
    private val okHttp:      OkHttpClient,
) : CoroutineWorker(ctx, params) {

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val contentItemId = inputData.getString(KEY_CONTENT_ITEM_ID) ?: return@withContext Result.failure()
        val url           = inputData.getString(KEY_URL)             ?: return@withContext Result.failure()
        val courseId      = inputData.getString(KEY_COURSE_ID)       ?: return@withContext Result.failure()
        val title         = inputData.getString(KEY_TITLE)           ?: contentItemId

        downloadDao.updateProgress(contentItemId, 0L, DownloadStatus.DOWNLOADING)

        val destDir  = File(ctx.filesDir, "downloads/$courseId").also { it.mkdirs() }
        val destFile = File(destDir, "$contentItemId.mp4")

        try {
            val req  = Request.Builder().url(url).build()
            val resp = okHttp.newCall(req).execute()
            if (!resp.isSuccessful) throw Exception("HTTP ${resp.code}")

            val body     = resp.body ?: throw Exception("Empty body")
            val total    = body.contentLength()
            var received = 0L

            body.byteStream().use { input ->
                destFile.outputStream().use { output ->
                    val buf = ByteArray(8 * 1024)
                    var n: Int
                    while (input.read(buf).also { n = it } != -1) {
                        output.write(buf, 0, n)
                        received += n
                        downloadDao.updateProgress(contentItemId, received, DownloadStatus.DOWNLOADING)
                        setProgress(workDataOf(KEY_PROGRESS to if (total > 0) (received * 100 / total).toInt() else 0))
                    }
                }
            }

            downloadDao.markComplete(contentItemId, destFile.absolutePath)
            Log.d(TAG, "Download complete: $contentItemId → ${destFile.absolutePath}")
            Result.success(workDataOf(KEY_LOCAL_PATH to destFile.absolutePath))

        } catch (e: Exception) {
            Log.w(TAG, "Download failed for $contentItemId: ${e.message}")
            downloadDao.updateProgress(contentItemId, 0L, DownloadStatus.FAILED)
            if (runAttemptCount < 2) Result.retry() else Result.failure()
        }
    }

    companion object {
        private const val TAG = "DownloadWorker"

        const val KEY_CONTENT_ITEM_ID = "content_item_id"
        const val KEY_URL             = "url"
        const val KEY_COURSE_ID       = "course_id"
        const val KEY_TITLE           = "title"
        const val KEY_PROGRESS        = "progress_pct"
        const val KEY_LOCAL_PATH      = "local_path"

        fun buildRequest(contentItemId: String, url: String, courseId: String, title: String): OneTimeWorkRequest =
            OneTimeWorkRequestBuilder<DownloadWorker>()
                .setInputData(workDataOf(
                    KEY_CONTENT_ITEM_ID to contentItemId,
                    KEY_URL             to url,
                    KEY_COURSE_ID       to courseId,
                    KEY_TITLE           to title,
                ))
                .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
                .setBackoffCriteria(BackoffPolicy.LINEAR, 10, java.util.concurrent.TimeUnit.SECONDS)
                .addTag("download_$contentItemId")
                .build()
    }
}
