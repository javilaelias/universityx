package com.universidadx.ui.downloads

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.universidadx.data.local.db.dao.DownloadDao
import com.universidadx.data.local.db.dao.SyncQueueDao
import com.universidadx.data.local.entity.DownloadEntity
import com.universidadx.data.local.entity.DownloadStatus
import com.universidadx.data.repository.CourseRepository
import com.universidadx.data.repository.OfflineDownloadManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class CourseDownloadUiState {
    object Loading : CourseDownloadUiState()
    data class Ready(val items: List<DownloadEntity>) : CourseDownloadUiState()
}

@HiltViewModel
class CourseDownloadViewModel @Inject constructor(
    private val downloadManager: OfflineDownloadManager,
    private val downloadDao:     DownloadDao,
    private val syncQueueDao:    SyncQueueDao,
    private val courseRepo:      CourseRepository,
) : ViewModel() {

    private val _courseId = MutableStateFlow("")
    private val _uiState  = MutableStateFlow<CourseDownloadUiState>(CourseDownloadUiState.Loading)

    val uiState: StateFlow<CourseDownloadUiState> = _uiState.asStateFlow()
    val pendingCount: StateFlow<Int> = syncQueueDao.observePendingCount()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), 0)

    fun load(courseId: String) {
        _courseId.value = courseId
        downloadManager.observeDownloads(courseId)
            .onEach { _uiState.value = CourseDownloadUiState.Ready(it) }
            .launchIn(viewModelScope)

        // Seed initial rows for all downloadable items in the course
        viewModelScope.launch {
            try {
                val course = courseRepo.getCourse(courseId)
                course.modules.flatMap { it.items }
                    .filter { it.type.name == "VIDEO" && it.videoUrl != null }
                    .forEach { item ->
                        if (downloadDao.get(item.id) == null) {
                            downloadDao.upsert(
                                DownloadEntity(
                                    contentItemId = item.id,
                                    courseId      = courseId,
                                    title         = item.title,
                                    localPath     = null,
                                    status        = DownloadStatus.PENDING,
                                )
                            )
                        }
                    }
            } catch (_: Exception) {}
        }
    }

    fun download(contentItemId: String, courseId: String, title: String) {
        viewModelScope.launch {
            // videoUrl would come from the course item — simplified here
            val course = try { courseRepo.getCourse(courseId) } catch (_: Exception) { return@launch }
            val item   = course.modules.flatMap { it.items }.find { it.id == contentItemId } ?: return@launch
            val url    = item.videoUrl ?: return@launch
            downloadManager.enqueue(contentItemId, courseId, title, url)
        }
    }

    fun cancel(contentItemId: String) {
        viewModelScope.launch { downloadManager.cancel(contentItemId) }
    }

    fun delete(contentItemId: String) {
        viewModelScope.launch { downloadManager.delete(contentItemId) }
    }
}
