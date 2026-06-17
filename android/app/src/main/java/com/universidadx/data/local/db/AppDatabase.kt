package com.universidadx.data.local.db

import androidx.room.Database
import androidx.room.RoomDatabase
import com.universidadx.data.local.db.dao.DownloadDao
import com.universidadx.data.local.db.dao.ProgressDao
import com.universidadx.data.local.db.dao.SyncQueueDao
import com.universidadx.data.local.entity.DownloadEntity
import com.universidadx.data.local.entity.ProgressEntity
import com.universidadx.data.local.entity.SyncQueueEntity

@Database(
    entities = [ProgressEntity::class, DownloadEntity::class, SyncQueueEntity::class],
    version  = 1,
    exportSchema = true,
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun progressDao():  ProgressDao
    abstract fun downloadDao():  DownloadDao
    abstract fun syncQueueDao(): SyncQueueDao
}
