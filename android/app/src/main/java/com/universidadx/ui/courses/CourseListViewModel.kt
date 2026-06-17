package com.universidadx.ui.courses

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.universidadx.data.repository.CourseRepository
import com.universidadx.domain.model.Course
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class CourseListUiState {
    object Loading : CourseListUiState()
    data class Success(val courses: List<Course>) : CourseListUiState()
    data class Error(val message: String) : CourseListUiState()
}

@OptIn(FlowPreview::class)
@HiltViewModel
class CourseListViewModel @Inject constructor(
    private val repo: CourseRepository,
) : ViewModel() {

    private val _search = MutableStateFlow("")
    private val _level  = MutableStateFlow("")
    private val _uiState = MutableStateFlow<CourseListUiState>(CourseListUiState.Loading)

    val uiState: StateFlow<CourseListUiState> = _uiState.asStateFlow()
    val search: StateFlow<String> = _search.asStateFlow()

    init {
        _search
            .debounce(300)
            .combine(_level) { s, l -> s to l }
            .onEach { (s, l) -> load(s, l) }
            .launchIn(viewModelScope)
    }

    fun onSearch(query: String) { _search.value = query }
    fun onLevel(level: String)  { _level.value = level  }

    fun refresh() { load(_search.value, _level.value) }

    private fun load(search: String, level: String) {
        viewModelScope.launch {
            _uiState.value = CourseListUiState.Loading
            _uiState.value = try {
                CourseListUiState.Success(repo.getCourses(search = search, level = level))
            } catch (e: Exception) {
                CourseListUiState.Error(e.message ?: "Error de red")
            }
        }
    }

    fun enroll(courseId: String) {
        viewModelScope.launch {
            try { repo.enroll(courseId) } catch (_: Exception) {}
            refresh()
        }
    }
}
