// =============================================================================
// Universidad X — Inicialización de MongoDB
// =============================================================================
// Este script se ejecuta automáticamente al crear el contenedor por primera vez.
// Crea las colecciones con sus validadores de esquema y los índices necesarios.
// =============================================================================

const db = db.getSiblingDB('universidadx');

// ── Colección: learning_profiles ─────────────────────────────────────────────
db.createCollection('learning_profiles', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['user_id', 'updated_at', 'profile'],
      properties: {
        user_id:    { bsonType: 'string', description: 'UUID del usuario en PostgreSQL' },
        updated_at: { bsonType: 'date' },
        profile: {
          bsonType: 'object',
          properties: {
            pace:            { enum: ['slow', 'medium', 'fast'] },
            preferred_types: { bsonType: 'array', items: { bsonType: 'string' } },
            peak_hours:      { bsonType: 'array', items: { bsonType: 'int' } },
            avg_session_min: { bsonType: 'double' },
            completion_rate: { bsonType: 'double', minimum: 0, maximum: 1 }
          }
        },
        strengths:       { bsonType: 'array' },
        weaknesses:      { bsonType: 'array' },
        recommendations: { bsonType: 'array' },
        activity_log:    { bsonType: 'array' }
      }
    }
  },
  validationLevel: 'moderate'
});

// ── Colección: offline_sync_queue ─────────────────────────────────────────────
db.createCollection('offline_sync_queue', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['user_id', 'device_id', 'events'],
      properties: {
        user_id:      { bsonType: 'string' },
        device_id:    { bsonType: 'string' },
        events:       { bsonType: 'array' },
        last_sync_at: { bsonType: 'date' },
        created_at:   { bsonType: 'date' }
      }
    }
  }
});

// ── Colección: chatbot_sessions ───────────────────────────────────────────────
db.createCollection('chatbot_sessions', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['user_id', 'messages', 'created_at'],
      properties: {
        user_id:    { bsonType: 'string' },
        messages:   { bsonType: 'array' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' }
      }
    }
  }
});

// ── Índices ───────────────────────────────────────────────────────────────────
db.learning_profiles.createIndex({ user_id: 1 }, { unique: true });
db.learning_profiles.createIndex({ 'recommendations.generated_at': -1 });

db.offline_sync_queue.createIndex({ user_id: 1, device_id: 1 });
db.offline_sync_queue.createIndex({ 'events.synced': 1 });

db.chatbot_sessions.createIndex({ user_id: 1 });
db.chatbot_sessions.createIndex({ updated_at: -1 });

print('✓ MongoDB: colecciones e índices de Universidad X creados correctamente');
