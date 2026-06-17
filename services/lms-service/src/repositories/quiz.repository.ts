import { query, withTransaction } from '../db/postgres';
import type { QuizQuestion, QuizOption, QuizAttempt } from '../types/lms.types';

interface QuizMeta {
  id: string;
  content_item_id: string;
  passing_score: number;
  max_attempts: number;
  shuffle_questions: boolean;
  time_limit_sec: number | null;
}

export async function findQuizByContentItem(contentItemId: string) {
  const { rows } = await query<QuizMeta>(
    'SELECT * FROM quizzes WHERE content_item_id = $1',
    [contentItemId]
  );
  return rows[0] ?? null;
}

export async function findQuizQuestionsForStudent(quizId: string): Promise<QuizQuestion[]> {
  const { rows: questions } = await query<Omit<QuizQuestion, 'options'>>(
    'SELECT id, quiz_id, text, explanation, position, points FROM quiz_questions WHERE quiz_id = $1 ORDER BY position',
    [quizId]
  );

  const questionsWithOptions: QuizQuestion[] = await Promise.all(
    questions.map(async (q) => {
      const { rows: options } = await query<Omit<QuizOption, 'is_correct'>>(
        'SELECT id, text, position FROM quiz_options WHERE question_id = $1 ORDER BY position',
        [q.id]
      );
      return { ...q, options };
    })
  );

  return questionsWithOptions;
}

export async function countAttempts(userId: string, contentItemId: string) {
  const { rows } = await query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM quiz_attempts WHERE user_id = $1 AND content_item_id = $2',
    [userId, contentItemId]
  );
  return parseInt(rows[0].count);
}

export async function gradeAndSaveAttempt(
  userId: string,
  contentItemId: string,
  quizId: string,
  answers: Record<string, string>,
  passingScore: number
): Promise<QuizAttempt> {
  return withTransaction(async (client) => {
    // Obtener respuestas correctas
    const { rows: correctOptions } = await client.query<{ question_id: string; option_id: string; points: number }>(
      `SELECT qq.id AS question_id, qo.id AS option_id, qq.points
       FROM   quiz_questions qq
       JOIN   quiz_options qo ON qo.question_id = qq.id AND qo.is_correct = true
       WHERE  qq.quiz_id = $1`,
      [quizId]
    );

    // Calcular puntuación
    const totalPoints = correctOptions.reduce((s, r) => s + Number(r.points), 0);
    let earnedPoints  = 0;

    for (const { question_id, option_id, points } of correctOptions) {
      if (answers[question_id] === option_id) {
        earnedPoints += Number(points);
      }
    }

    const score  = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100 * 100) / 100 : 0;
    const passed = score >= passingScore;

    const { rows } = await client.query<QuizAttempt>(
      `INSERT INTO quiz_attempts (user_id, content_item_id, answers, score, passed)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, contentItemId, JSON.stringify(answers), score, passed]
    );

    return rows[0];
  });
}

export async function findUserAttempts(userId: string, contentItemId: string) {
  const { rows } = await query<QuizAttempt>(
    `SELECT id, user_id, content_item_id, score, passed, submitted_at
     FROM   quiz_attempts
     WHERE  user_id = $1 AND content_item_id = $2
     ORDER  BY submitted_at DESC`,
    [userId, contentItemId]
  );
  return rows;
}
