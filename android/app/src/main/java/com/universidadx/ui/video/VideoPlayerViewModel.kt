package com.universidadx.ui.video

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.universidadx.auth.TokenManager
import com.universidadx.data.repository.OfflineDownloadManager
import com.universidadx.data.repository.ProgressTracker
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class VideoUiState {
    object Loading : VideoUiState()
    data class Ready(val uri: String, val startPosition: Long) : VideoUiState()
    data class Error(val message: String) : VideoUiState()
}

@HiltViewModel
class VideoPlayerViewModel @Inject constructor(
    private val downloadManager: OfflineDownloadManager,
    private val progressTracker: ProgressTracker,
    private val tokenManager:    TokenManager,
) : ViewModel() {

    private val _uiState = MutableStateFlow<VideoUiState>(VideoUiState.Loading)
    val uiState: StateFlow<VideoUiState> = _uiState

    fun load(contentItemId: String, courseId: String, remoteUrl: String?) {
        viewModelScope.launch {
            try {
                // Prefer local file if downloaded
                val localPath = downloadManager.getLocalPath(contentItemId)
                val uri = when {
                    localPath != null -> "file://$localPath"
                    remoteUrl != null -> remoteUrl
                    else              -> { _uiState.value = VideoUiState.Error("Sin fuente de video"); return@launch }
                }

                // Restore previous playback position
                val progressEntry = null // TODO: get from progressTracker
                val startMs = (progressEntry ?: 0) * 1000L

                _uiState.value = VideoUiState.Ready(uri, startMs)
            } catch (e: Exception) {
                _uiState.value = VideoUiState.Error(e.message ?: "Error desconocido")
            }
        }
    }

    fun saveProgress(contentItemId: String, seconds: Int) {
        val userId = tokenManager.userId ?: return
        viewModelScope.launch {
            progressTracker.recordVideoProgress(userId, contentItemId, seconds)
        }
    }

    fun markComplete(contentItemId: String) {
        val userId = tokenManager.userId ?: return
        viewModelScope.launch {
            progressTracker.markContentComplete(userId, contentItemId)
        }
    }
}
