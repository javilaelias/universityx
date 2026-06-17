'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter }         from 'next/navigation';
import {
  AlertCircle, ArrowLeft, ArrowRight, Award,
  CheckCircle2, Clock, RotateCcw, XCircle,
} from 'lucide-react';
import clsx from 'clsx';
import type { QuizResponse, QuizResultResponse } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = 'loading' | 'answering' | 'confirming' | 'submitting' | 'results' | 'error';

// ── Component ─────────────────────────────────────────────────────────────────

export default function QuizPage() {
  const { id: courseId, quizId } = useParams<{ id: string; quizId: string }>();
  const router = useRouter();

  const [phase,   setPhase]   = useState<Phase>('loading');
  const [quiz,    setQuiz]    = useState<QuizResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState(0);
  const [result,  setResult]  = useState<QuizResultResponse | null>(null);
  const [errMsg,  setErrMsg]  = useState('');
  const [attempt, setAttempt] = useState(1);

  // Elapsed timer
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch quiz ──────────────────────────────────────────────────────────────

  async function loadQuiz() {
    setPhase('loading');
    setAnswers({});
    setCurrent(0);
    setResult(null);
    setElapsed(0);

    try {
      const res = await fetch(`/api/quizzes/${quizId}`);
      if (!res.ok) throw new Error((await res.json()).message ?? `HTTP ${res.status}`);
      const data: QuizResponse = await res.json();
      setQuiz(data);
      setPhase('answering');
      // Start timer
      timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : 'No se pudo cargar el cuestionario.');
      setPhase('error');
    }
  }

  useEffect(() => { loadQuiz(); return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, [quizId]);

  // Stop timer when leaving answering phase
  useEffect(() => {
    if (phase !== 'answering' && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [phase]);

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function submitQuiz() {
    setPhase('submitting');
    try {
      const res = await fetch(`/api/quizzes/${quizId}/submit`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ answers }),
      });
      if (!res.ok) throw new Error((await res.json()).message ?? `HTTP ${res.status}`);
      const data: QuizResultResponse = await res.json();
      setResult(data);
      setPhase('results');
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : 'Error al enviar el cuestionario.');
      setPhase('error');
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const questions      = quiz?.questions ?? [];
  const totalQ         = questions.length;
  const answeredCount  = Object.keys(answers).length;
  const allAnswered    = answeredCount === totalQ;
  const maxAttempts    = quiz?.quiz.max_attempts ?? 3;
  const passingScore   = quiz?.quiz.passing_score ?? 60;
  const canRetry       = attempt < maxAttempts && result && !result.passed;

  function formatTime(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (phase === 'loading') return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-[var(--muted)]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      <p>Cargando cuestionario…</p>
    </div>
  );

  // ── Error ────────────────────────────────────────────────────────────────────

  if (phase === 'error') return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <AlertCircle className="h-12 w-12 text-red-400" />
      <p className="text-lg font-semibold">Algo salió mal</p>
      <p className="text-sm text-[var(--muted)]">{errMsg}</p>
      <div className="flex gap-3">
        <button onClick={() => router.push(`/courses/${courseId}`)} className="btn-ghost border border-[var(--border)]">
          Volver al curso
        </button>
        <button onClick={loadQuiz} className="btn-primary">Reintentar</button>
      </div>
    </div>
  );

  // ── Results ──────────────────────────────────────────────────────────────────

  if (phase === 'results' && result) {
    const passed = result.passed;
    return (
      <div className="mx-auto max-w-lg space-y-6 py-8">
        {/* Score card */}
        <div className={clsx(
          'card flex flex-col items-center gap-4 p-8 text-center',
          passed ? 'border-green-300 dark:border-green-700' : 'border-red-300 dark:border-red-700',
        )}>
          {passed
            ? <Award  className="h-16 w-16 text-yellow-400" />
            : <XCircle className="h-16 w-16 text-red-400"  />
          }
          <div>
            <p className="text-5xl font-black">{result.score}<span className="text-2xl font-normal text-[var(--muted)]">%</span></p>
            <p className={clsx('mt-1 text-lg font-semibold', passed ? 'text-green-600' : 'text-red-500')}>
              {passed ? '¡Aprobado!' : 'No aprobado'}
            </p>
          </div>
          <div className="flex gap-8 text-sm text-[var(--muted)]">
            <div className="text-center">
              <p className="text-xl font-bold text-[var(--text)]">{result.correct}</p>
              <p>Correctas</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-[var(--text)]">{result.total - result.correct}</p>
              <p>Incorrectas</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-[var(--text)]">{result.total}</p>
              <p>Total</p>
            </div>
          </div>
          <p className="text-xs text-[var(--muted)]">
            Puntaje mínimo para aprobar: {passingScore}% · Intento {attempt}/{maxAttempts}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button onClick={() => router.push(`/courses/${courseId}`)} className="btn-ghost border border-[var(--border)] w-full">
            <ArrowLeft className="h-4 w-4" /> Volver al curso
          </button>
          {canRetry && (
            <button
              onClick={() => { setAttempt(a => a + 1); loadQuiz(); }}
              className="btn-primary w-full"
            >
              <RotateCcw className="h-4 w-4" />
              Intentar de nuevo ({maxAttempts - attempt} {maxAttempts - attempt === 1 ? 'intento' : 'intentos'} restantes)
            </button>
          )}
          {passed && (
            <button onClick={() => router.push('/dashboard')} className="btn-primary w-full">
              <CheckCircle2 className="h-4 w-4" /> Ir al dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Confirm dialog ───────────────────────────────────────────────────────────

  if (phase === 'confirming') {
    const unanswered = totalQ - answeredCount;
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="card w-full max-w-sm space-y-5 p-6">
          <h2 className="text-lg font-semibold">¿Enviar cuestionario?</h2>
          {unanswered > 0 ? (
            <div className="flex gap-2 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p>Tienes <strong>{unanswered}</strong> {unanswered === 1 ? 'pregunta sin responder' : 'preguntas sin responder'}. Las preguntas vacías se contarán como incorrectas.</p>
            </div>
          ) : (
            <p className="text-sm text-[var(--muted)]">Respondiste todas las preguntas. Una vez enviado no podrás modificar tus respuestas.</p>
          )}
          <div className="flex gap-3">
            <button onClick={() => setPhase('answering')} className="btn-ghost flex-1 border border-[var(--border)]">
              Revisar
            </button>
            <button onClick={submitQuiz} className="btn-primary flex-1">
              Enviar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Submitting spinner ───────────────────────────────────────────────────────

  if (phase === 'submitting') return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-[var(--muted)]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      <p>Calificando…</p>
    </div>
  );

  // ── Answering phase ──────────────────────────────────────────────────────────

  const q = questions[current];

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.push(`/courses/${courseId}`)} className="btn-ghost gap-1.5 text-sm">
          <ArrowLeft className="h-4 w-4" /> Salir
        </button>
        <div className="flex items-center gap-1.5 text-sm text-[var(--muted)]">
          <Clock className="h-4 w-4" />
          {formatTime(elapsed)}
        </div>
      </div>

      {/* Quiz title */}
      <div>
        <h1 className="text-xl font-bold">{quiz?.quiz.title}</h1>
        <p className="mt-0.5 text-sm text-[var(--muted)]">
          Puntaje mínimo: {passingScore}% · Intento {attempt}/{maxAttempts}
        </p>
      </div>

      {/* Progress bar */}
      <div>
        <div className="mb-1.5 flex justify-between text-xs text-[var(--muted)]">
          <span>Pregunta {current + 1} de {totalQ}</span>
          <span>{answeredCount}/{totalQ} respondidas</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-brand-500 transition-all"
            style={{ width: `${((current + 1) / totalQ) * 100}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="card p-6 space-y-5" key={q.id}>
        <p className="text-base font-medium leading-relaxed">{q.question_text}</p>

        <fieldset className="space-y-3">
          {q.options.map(opt => {
            const selected = answers[q.id] === opt.id;
            return (
              <label
                key={opt.id}
                className={clsx(
                  'flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors',
                  selected
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                    : 'border-[var(--border)] hover:border-brand-300 hover:bg-gray-50 dark:hover:bg-slate-700/50',
                )}
              >
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  value={opt.id}
                  checked={selected}
                  onChange={() => setAnswers(prev => ({ ...prev, [q.id]: opt.id }))}
                  className="sr-only"
                />
                <span
                  className={clsx(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                    selected ? 'border-brand-500 bg-brand-500' : 'border-gray-300 dark:border-slate-500',
                  )}
                >
                  {selected && <span className="h-2 w-2 rounded-full bg-white" />}
                </span>
                <span className="text-sm leading-snug">{opt.option_text}</span>
              </label>
            );
          })}
        </fieldset>
      </div>

      {/* Question dots navigator */}
      <div className="flex flex-wrap justify-center gap-2">
        {questions.map((qq, i) => (
          <button
            key={qq.id}
            onClick={() => setCurrent(i)}
            title={`Pregunta ${i + 1}`}
            className={clsx(
              'h-8 w-8 rounded-full text-xs font-semibold transition-colors',
              i === current
                ? 'bg-brand-600 text-white'
                : answers[qq.id]
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400',
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between gap-3">
        <button
          disabled={current === 0}
          onClick={() => setCurrent(c => c - 1)}
          className="btn-ghost border border-[var(--border)] disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" /> Anterior
        </button>

        {current < totalQ - 1 ? (
          <button onClick={() => setCurrent(c => c + 1)} className="btn-primary">
            Siguiente <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => setPhase('confirming')}
            className={clsx(
              'btn-primary',
              !allAnswered && 'opacity-90',
            )}
          >
            <CheckCircle2 className="h-4 w-4" />
            {allAnswered ? 'Finalizar' : `Finalizar (${answeredCount}/${totalQ})`}
          </button>
        )}
      </div>
    </div>
  );
}
