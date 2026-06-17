package com.universidadx.ui.downloads

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.universidadx.data.local.entity.DownloadEntity
import com.universidadx.data.local.entity.DownloadStatus

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CourseDownloadScreen(
    courseId: String,
    onBack:   () -> Unit,
    viewModel: CourseDownloadViewModel = hiltViewModel(),
) {
    LaunchedEffect(courseId) { viewModel.load(courseId) }

    val uiState      by viewModel.uiState.collectAsStateWithLifecycle()
    val pendingCount by viewModel.pendingCount.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Contenido descargado") },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, "Volver") }
                },
                actions = {
                    if (pendingCount > 0) {
                        Badge { Text("$pendingCount") }
                    }
                },
            )
        }
    ) { padding ->
        when (val state = uiState) {
            CourseDownloadUiState.Loading ->
                Box(Modifier.padding(padding).fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }

            is CourseDownloadUiState.Ready ->
                LazyColumn(
                    modifier        = Modifier.padding(padding),
                    contentPadding  = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    items(state.items, key = { it.contentItemId }) { item ->
                        DownloadItemRow(
                            item     = item,
                            onDownload = { viewModel.download(it.contentItemId, it.courseId, it.title) },
                            onCancel   = { viewModel.cancel(it.contentItemId) },
                            onDelete   = { viewModel.delete(it.contentItemId) },
                        )
                    }

                    if (state.items.isEmpty()) {
                        item {
                            Box(Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                                Text("No hay contenido disponible para descarga.", color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }
                }
        }
    }
}

@Composable
private fun DownloadItemRow(
    item:       DownloadEntity,
    onDownload: (DownloadEntity) -> Unit,
    onCancel:   (DownloadEntity) -> Unit,
    onDelete:   (DownloadEntity) -> Unit,
) {
    Card(
        shape     = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(1.dp),
    ) {
        Row(
            modifier             = Modifier.fillMaxWidth().padding(12.dp),
            verticalAlignment    = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            // Status icon
            Box(
                modifier          = Modifier.size(40.dp),
                contentAlignment  = Alignment.Center,
            ) {
                when (item.status) {
                    DownloadStatus.COMPLETED    -> Icon(Icons.Default.CheckCircle, null, tint = MaterialTheme.colorScheme.primary)
                    DownloadStatus.DOWNLOADING  -> CircularProgressIndicator(
                        progress  = { if (item.sizeBytes > 0) (item.downloadedBytes.toFloat() / item.sizeBytes) else 0f },
                        modifier  = Modifier.size(36.dp),
                        strokeWidth = 3.dp,
                    )
                    DownloadStatus.FAILED       -> Icon(Icons.Default.Error, null, tint = MaterialTheme.colorScheme.error)
                    DownloadStatus.PENDING      -> Icon(Icons.Default.HourglassTop, null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
                    DownloadStatus.PAUSED       -> Icon(Icons.Default.Pause, null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }

            Column(modifier = Modifier.weight(1f)) {
                Text(item.title, fontWeight = FontWeight.Medium, maxLines = 1, overflow = TextOverflow.Ellipsis, fontSize = 14.sp)
                Text(
                    text     = when (item.status) {
                        DownloadStatus.COMPLETED   -> "Disponible offline · ${item.sizeBytes / 1024 / 1024} MB"
                        DownloadStatus.DOWNLOADING -> "${item.downloadedBytes / 1024 / 1024} / ${item.sizeBytes / 1024 / 1024} MB"
                        DownloadStatus.FAILED      -> "Error — toca para reintentar"
                        DownloadStatus.PENDING     -> "En cola..."
                        DownloadStatus.PAUSED      -> "Pausado"
                    },
                    fontSize = 12.sp,
                    color    = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }

            // Action button
            when (item.status) {
                DownloadStatus.COMPLETED   ->
                    IconButton(onClick = { onDelete(item) }) { Icon(Icons.Default.DeleteOutline, "Eliminar") }
                DownloadStatus.DOWNLOADING ->
                    IconButton(onClick = { onCancel(item) }) { Icon(Icons.Default.Close, "Cancelar") }
                DownloadStatus.FAILED,
                DownloadStatus.PENDING,
                DownloadStatus.PAUSED      ->
                    IconButton(onClick = { onDownload(item) }) { Icon(Icons.Default.FileDownload, "Descargar") }
            }
        }
    }
}
