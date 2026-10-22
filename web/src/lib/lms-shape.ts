// Adapta las respuestas de lms-service a las formas que usan las páginas (CourseDetailResponse,
// QuizResponse, QuizResultResponse de lib/api.ts). lms devuelve el curso plano con `type` y
// `duration_seconds`, y el quiz con `questions[].text` / `options[].text`.

/* eslint-disable @typescript-eslint/no-explicit-any */
export function toCourseDetail(data: any) {
  if (!data || data.course || !Array.isArray(data.modules)) return data;
  return {
    course: {
      ...data,
      modules: data.modules.map((m: any) => ({
        ...m,
        order_index: m.position,
        content_items: (m.content_items ?? []).map((ci: any) => ({
          ...ci,
          content_type:     ci.type,
          duration_minutes: ci.duration_seconds ? Math.round(ci.duration_seconds / 60) : null,
          order_index:      ci.position,
        })),
      })),
    },
  };
}

export function toQuiz(data: any) {
  const q = data?.quiz;
  if (!q || !Array.isArray(q.questions)) return data;
  return {
    quiz: {
      id:            q.id,
      title:         q.title ?? '',
      passing_score: Number(q.passing_score),
      max_attempts:  q.max_attempts,
    },
    questions: q.questions.map((qq: any) => ({
      id:            qq.id,
      question_text: qq.text,
      options:       (qq.options ?? []).map((o: any) => ({ id: o.id, option_text: o.text })),
    })),
  };
}

export function toQuizResult(data: any) {
  const a = data?.attempt;
  if (!a) return data;
  return { score: Number(a.score), passed: Boolean(a.passed), correct: a.correct ?? 0, total: a.total ?? 0 };
}
