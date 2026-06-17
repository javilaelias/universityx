package com.universidadx.data.repository

import com.universidadx.data.remote.api.LmsApi
import com.universidadx.domain.model.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CourseRepository @Inject constructor(
    private val lmsApi: LmsApi,
) {
    suspend fun getCourses(page: Int = 1, search: String = "", level: String = ""): List<Course> =
        lmsApi.getCourses(page, search, level).courses.map { it.toDomain() }

    suspend fun getCourse(id: String): Course = lmsApi.getCourse(id).toDomain()

    suspend fun enroll(courseId: String) = lmsApi.enroll(mapOf("courseId" to courseId))

    private fun com.universidadx.data.remote.api.CourseDto.toDomain() = Course(
        id           = id,
        title        = title,
        description  = description,
        level        = level,
        thumbnailUrl = thumbnail_url,
        progressPct  = 0f,
        isEnrolled   = false,
        modules      = modules?.map { m ->
            Module(
                id          = m.id,
                title       = m.title,
                position    = m.position,
                releaseDate = m.release_date,
                items       = m.items?.map { ci ->
                    ContentItem(
                        id              = ci.id,
                        title           = ci.title,
                        type            = when (ci.type) {
                            "quiz"         -> ContentType.QUIZ
                            "document"     -> ContentType.DOCUMENT
                            "live_session" -> ContentType.LIVE_SESSION
                            else           -> ContentType.VIDEO
                        },
                        durationSeconds = ci.duration_seconds,
                        position        = ci.position,
                        videoUrl        = ci.video_url,
                        completed       = false,
                        progressSeconds = 0,
                    )
                } ?: emptyList(),
            )
        } ?: emptyList(),
    )
}
