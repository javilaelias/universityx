package com.universidadx.di

import android.content.Context
import androidx.room.Room
import com.universidadx.data.local.db.AppDatabase
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext ctx: Context): AppDatabase =
        Room.databaseBuilder(ctx, AppDatabase::class.java, "ux_db")
            .fallbackToDestructiveMigration()
            .build()

    @Provides fun provideProgressDao(db: AppDatabase)  = db.progressDao()
    @Provides fun provideDownloadDao(db: AppDatabase)  = db.downloadDao()
    @Provides fun provideSyncQueueDao(db: AppDatabase) = db.syncQueueDao()
}
