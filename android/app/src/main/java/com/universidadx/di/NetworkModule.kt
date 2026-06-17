package com.universidadx.di

import com.universidadx.auth.TokenManager
import com.universidadx.data.remote.api.AuthApi
import com.universidadx.data.remote.api.LmsApi
import com.universidadx.data.remote.api.SyncApi
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Named
import javax.inject.Singleton

private const val AUTH_BASE = "http://10.0.2.2:4001/"   // Android emulator → localhost
private const val LMS_BASE  = "http://10.0.2.2:4002/"
private const val SYNC_BASE = "http://10.0.2.2:4005/"

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideOkHttp(tokenManager: TokenManager): OkHttpClient =
        OkHttpClient.Builder()
            .addInterceptor { chain ->
                val req = chain.request().newBuilder()
                    .apply { tokenManager.accessToken?.let { addHeader("Authorization", "Bearer $it") } }
                    .build()
                chain.proceed(req)
            }
            .addInterceptor(HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BODY })
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build()

    @Provides
    @Singleton
    @Named("auth")
    fun provideAuthRetrofit(client: OkHttpClient): Retrofit =
        Retrofit.Builder().baseUrl(AUTH_BASE).client(client).addConverterFactory(GsonConverterFactory.create()).build()

    @Provides
    @Singleton
    @Named("lms")
    fun provideLmsRetrofit(client: OkHttpClient): Retrofit =
        Retrofit.Builder().baseUrl(LMS_BASE).client(client).addConverterFactory(GsonConverterFactory.create()).build()

    @Provides
    @Singleton
    @Named("sync")
    fun provideSyncRetrofit(client: OkHttpClient): Retrofit =
        Retrofit.Builder().baseUrl(SYNC_BASE).client(client).addConverterFactory(GsonConverterFactory.create()).build()

    @Provides
    @Singleton
    fun provideAuthApi(@Named("auth") r: Retrofit): AuthApi = r.create(AuthApi::class.java)

    @Provides
    @Singleton
    fun provideLmsApi(@Named("lms") r: Retrofit): LmsApi = r.create(LmsApi::class.java)

    @Provides
    @Singleton
    fun provideSyncApi(@Named("sync") r: Retrofit): SyncApi = r.create(SyncApi::class.java)
}
