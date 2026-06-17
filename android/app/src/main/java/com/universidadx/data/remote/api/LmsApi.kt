package com.universidadx.data.remote.api

import retrofit2.http.*

data class CourseDto(
    val id:           String,
    val title:        String,
    val description:  String,
    val level:        String,
    val thumbnail_url: String?,
    val modules:      List<ModuleDto>?,
)

data class ModuleDto(
    val id:           String,
    val title:        String,
    val position:     Int,
    val release_date: String?,
    val items:        List<ContentItemDto>?,
)

data class ContentItemDto(
    val id:               String,
    val title:            String,
    val type:             String,
    val duration_seconds: Int,
    val position:         Int,
    val video_url:        String?,
)

data class EnrollmentDto(
    val enrollment_id: String,
    val course_id:     String,
    val progress_pct:  Float,
)

data class ProgressDto(
    val content_item_id: String,
    val progress_seconds: Int,
    val completed:        Boolean,
)

data class CoursesResponse(val courses: List<CourseDto>, val total: Int)
data class EnrollmentsResponse(val enrollments: List<EnrollmentDto>)
data class ProgressBody(val content_item_id: String, val progress_seconds: Int, val completed: Boolean = false)

interface LmsApi {

    @GET("api/courses")
    suspend fun getCourses(
        @Query("page")   page:   Int    = 1,
        @Query("search") search: String = "",
        @Query("level")  level:  String = "",
    ): CoursesResponse

    @GET("api/courses/{id}")
    suspend fun getCourse(@Path("id") id: String): CourseDto

    @GET("api/enrollments")
    suspend fun getEnrollments(): EnrollmentsResponse

    @POST("api/enrollments")
    suspend fun enroll(@Body body: Map<String, String>): EnrollmentDto

    @POST("api/progress")
    suspend fun reportProgress(@Body body: ProgressBody): ProgressDto
}
