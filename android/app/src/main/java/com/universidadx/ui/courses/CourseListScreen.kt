package com.universidadx.ui.courses

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import com.universidadx.domain.model.Course

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CourseListScreen(
    onCourseClick: (String) -> Unit,
    viewModel: CourseListViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val search  by viewModel.search.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Mis Cursos", fontWeight = FontWeight.Bold) })
        }
    ) { padding ->
        Column(modifier = Modifier.padding(padding).fillMaxSize()) {
            // Search bar
            OutlinedTextField(
                value         = search,
                onValueChange = viewModel::onSearch,
                placeholder   = { Text("Buscar cursos...") },
                leadingIcon   = { Icon(Icons.Default.Search, contentDescription = null) },
                modifier      = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                shape         = RoundedCornerShape(12.dp),
                singleLine    = true,
            )

            // Level filter chips
            val levels = listOf("" to "Todos", "beginner" to "Básico", "intermediate" to "Intermedio", "advanced" to "Avanzado")
            Row(
                modifier = Modifier.padding(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                levels.forEach { (value, label) ->
                    FilterChip(
                        selected = false,
                        onClick  = { viewModel.onLevel(value) },
                        label    = { Text(label, fontSize = 12.sp) },
                    )
                }
            }

            when (val state = uiState) {
                CourseListUiState.Loading ->
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }

                is CourseListUiState.Error ->
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            Text("Error: ${state.message}", color = MaterialTheme.colorScheme.error)
                            Button(onClick = viewModel::refresh) { Text("Reintentar") }
                        }
                    }

                is CourseListUiState.Success ->
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                        contentPadding      = PaddingValues(16.dp),
                    ) {
                        items(state.courses, key = { it.id }) { course ->
                            CourseCard(
                                course  = course,
                                onClick = { onCourseClick(course.id) },
                                onEnroll = { viewModel.enroll(course.id) },
                            )
                        }
                    }
            }
        }
    }
}

@Composable
private fun CourseCard(
    course:   Course,
    onClick:  () -> Unit,
    onEnroll: () -> Unit,
) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        shape    = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(2.dp),
    ) {
        Row(modifier = Modifier.height(110.dp)) {
            // Thumbnail
            AsyncImage(
                model               = course.thumbnailUrl,
                contentDescription  = course.title,
                contentScale        = ContentScale.Crop,
                modifier            = Modifier.width(110.dp).fillMaxHeight()
                    .clip(RoundedCornerShape(topStart = 16.dp, bottomStart = 16.dp))
                    .background(MaterialTheme.colorScheme.surfaceVariant),
            )

            Column(
                modifier  = Modifier.weight(1f).padding(12.dp),
                verticalArrangement = Arrangement.SpaceBetween,
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(
                        text       = course.title,
                        fontWeight = FontWeight.SemiBold,
                        maxLines   = 2,
                        overflow   = TextOverflow.Ellipsis,
                        fontSize   = 14.sp,
                    )
                    Text(
                        text     = course.level.replaceFirstChar { it.uppercase() },
                        fontSize = 12.sp,
                        color    = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }

                Row(
                    modifier             = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment    = Alignment.CenterVertically,
                ) {
                    if (course.isEnrolled) {
                        LinearProgressIndicator(
                            progress   = { course.progressPct / 100f },
                            modifier   = Modifier.weight(1f).height(4.dp).clip(RoundedCornerShape(2.dp)),
                        )
                        Spacer(Modifier.width(8.dp))
                        Text("${course.progressPct.toInt()}%", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    } else {
                        Spacer(Modifier.weight(1f))
                        TextButton(onClick = onEnroll, contentPadding = PaddingValues(0.dp)) {
                            Text("Matricularse", fontSize = 12.sp)
                        }
                    }
                }
            }
        }
    }
}
