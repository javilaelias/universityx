package com.universidadx.ui.video

import android.os.Bundle
import android.view.View
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import com.universidadx.auth.TokenManager
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class VideoPlayerActivity : AppCompatActivity() {

    @Inject lateinit var tokenManager: TokenManager

    private val viewModel: VideoPlayerViewModel by viewModels()
    private lateinit var player: ExoPlayer
    private lateinit var playerView: PlayerView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val contentItemId = intent.getStringExtra(EXTRA_CONTENT_ITEM_ID) ?: run { finish(); return }
        val courseId      = intent.getStringExtra(EXTRA_COURSE_ID)       ?: run { finish(); return }
        val title         = intent.getStringExtra(EXTRA_TITLE) ?: ""
        val remoteUrl     = intent.getStringExtra(EXTRA_REMOTE_URL)

        // Full-screen immersive mode
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_FULLSCREEN or
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        )

        playerView = PlayerView(this).also { setContentView(it) }

        player = ExoPlayer.Builder(this).build().also { playerView.player = it }

        viewModel.load(contentItemId, courseId, remoteUrl)

        lifecycleScope.launch {
            viewModel.uiState.collect { state ->
                when (state) {
                    is VideoUiState.Ready -> playMedia(state.uri, state.startPosition)
                    is VideoUiState.Error -> { /* show error snackbar */ }
                    VideoUiState.Loading  -> { /* show loading indicator */ }
                }
            }
        }

        // Save progress every 5 seconds
        lifecycleScope.launch {
            while (true) {
                delay(5_000)
                if (player.isPlaying) {
                    val seconds = (player.currentPosition / 1000).toInt()
                    viewModel.saveProgress(contentItemId, seconds)
                }
            }
        }

        player.addListener(object : Player.Listener {
            override fun onPlaybackStateChanged(state: Int) {
                if (state == Player.STATE_ENDED) {
                    viewModel.markComplete(contentItemId)
                }
            }
        })
    }

    private fun playMedia(uri: String, startPositionMs: Long) {
        val item = MediaItem.fromUri(uri)
        player.setMediaItem(item)
        player.prepare()
        player.seekTo(startPositionMs)
        player.playWhenReady = true
    }

    override fun onPause() {
        super.onPause()
        player.pause()
        val seconds = (player.currentPosition / 1000).toInt()
        viewModel.saveProgress(
            intent.getStringExtra(EXTRA_CONTENT_ITEM_ID) ?: return,
            seconds,
        )
    }

    override fun onDestroy() {
        player.release()
        super.onDestroy()
    }

    companion object {
        const val EXTRA_CONTENT_ITEM_ID = "content_item_id"
        const val EXTRA_COURSE_ID       = "course_id"
        const val EXTRA_TITLE           = "title"
        const val EXTRA_REMOTE_URL      = "remote_url"
    }
}
