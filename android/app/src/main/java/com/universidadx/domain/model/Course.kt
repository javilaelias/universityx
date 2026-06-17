package com.universidadx.domain.model

data class Course(
    val id:          String,
    val title:       String,
    val description: String,
    val level:       String,
    val thumbnailUrl: String?,
    val progressPct: Float,
    val isEnrolled:  Boolean,
    val modules:     List<Module> = emptyList(),
)

data class Module(
    val id:           String,
    val title:        String,
    val position:     Int,
    val releaseDate:  String?,
    val items:        List<ContentItem> = emptyList(),
)

data class ContentItem(
    val id:              String,
    val title:           String,
    val type:            ContentType,
    val durationSeconds: Int,
    val position:        Int,
    val videoUrl:        String?,
    val completed:       Boolean,
    val progressSeconds: Int,
)

enum class ContentType { VIDEO, DOCUMENT, QUIZ, LIVE_SESSION }
