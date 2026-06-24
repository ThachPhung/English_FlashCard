import { useEffect, useMemo, useState } from 'react';
import { useSpeech } from '../hooks/useSpeech';

const RATINGS = [
  { key: 'AGAIN', label: 'Quên', color: 'bg-red-500 hover:bg-red-600' },
  { key: 'HARD', label: 'Khó', color: 'bg-orange-500 hover:bg-orange-600' },
  { key: 'GOOD', label: 'Tốt', color: 'bg-green-500 hover:bg-green-600' },
  { key: 'EASY', label: 'Dễ', color: 'bg-blue-500 hover:bg-blue-600' },
];

function normalizeAnswer(value) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function getAcceptedAnswers(card) {
  return String(card?.front || '')
    .split(/[,;/|]+/)
    .map(normalizeAnswer)
    .filter(Boolean);
}

export default function Flashcard({
  card,
  showAnswer,
  onFlip,
  onRate,
  onSuspend,
  onUndo,
  submitting = false,
  soundEnabled = true,
}) {
  if (!card) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-800">
        <p className="text-lg text-slate-500">Bạn đã hoàn thành phiên học! 🎉</p>
      </div>
    );
  }

  return (
    <ActiveFlashcard
      key={card.id}
      card={card}
      showAnswer={showAnswer}
      onFlip={onFlip}
      onRate={onRate}
      onSuspend={onSuspend}
      onUndo={onUndo}
      submitting={submitting}
      soundEnabled={soundEnabled}
    />
  );
}

function ActiveFlashcard({
  card,
  showAnswer,
  onFlip,
  onRate,
  onSuspend,
  onUndo,
  submitting,
  soundEnabled,
}) {
  const { speak } = useSpeech();
  const [typedAnswer, setTypedAnswer] = useState('');
  const [submittedAnswer, setSubmittedAnswer] = useState('');

  const acceptedAnswers = useMemo(() => getAcceptedAnswers(card), [card]);
  const normalizedSubmittedAnswer = normalizeAnswer(submittedAnswer);
  const isCorrect = Boolean(
    submittedAnswer && acceptedAnswers.includes(normalizedSubmittedAnswer),
  );

  useEffect(() => {
    if (!card.front || !soundEnabled || !showAnswer) return;
    const timer = setTimeout(() => speak(card.front), 300);
    return () => {
      clearTimeout(timer);
      window.speechSynthesis?.cancel();
    };
  }, [card.front, showAnswer, soundEnabled, speak]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmedAnswer = typedAnswer.trim();
    if (!trimmedAnswer || submitting || showAnswer) return;
    setSubmittedAnswer(trimmedAnswer);
    onFlip();
  };

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex min-h-[280px] w-full flex-col justify-center rounded-2xl border border-slate-200 bg-white p-8 text-left shadow-lg dark:border-slate-700 dark:bg-slate-800">
        {!showAnswer ? (
          <form onSubmit={handleSubmit}>
            {card.image_url && (
              <img
                src={card.image_url}
                alt={card.back}
                className="mx-auto mb-4 max-h-32 rounded-lg pointer-events-none"
              />
            )}
            <p className="text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
              Nghĩa tiếng Việt
            </p>
            <h2 className="mt-2 text-center text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {card.back}
            </h2>
            {card.is_new && (
              <span className="mx-auto mt-2 block w-fit rounded-full bg-blue-100 px-3 py-0.5 text-xs text-blue-700 pointer-events-none">
                Thẻ mới
              </span>
            )}
            <label htmlFor={`answer-${card.id}`} className="mt-6 block text-sm font-medium text-slate-600 dark:text-slate-300">
              Gõ lại từ tiếng Anh
            </label>
            <input
              id={`answer-${card.id}`}
              type="text"
              value={typedAnswer}
              onChange={(event) => setTypedAnswer(event.target.value)}
              disabled={submitting}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:focus:border-indigo-400"
              placeholder="Nhập tiếng Anh..."
            />
            <button
              type="submit"
              disabled={!typedAnswer.trim() || submitting}
              className="mt-4 w-full rounded-xl bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Kiểm tra đáp án
            </button>
            <p className="mt-3 text-center text-xs text-slate-400">
              Bạn cần nhập đáp án trước khi xem từ tiếng Anh.
            </p>
          </form>
        ) : (
          <>
            {submittedAnswer && (
              <div className={`mb-4 rounded-xl p-3 text-center text-sm ${
                isCorrect
                  ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-200'
                  : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200'
              }`}
              >
                {isCorrect ? 'Đúng rồi!' : `Chưa đúng. Bạn đã nhập: ${submittedAnswer}`}
              </div>
            )}
            <p className="text-center text-sm text-slate-500 pointer-events-none">{card.back}</p>
            <p className="mt-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400 pointer-events-none">
              Đáp án tiếng Anh
            </p>
            {card.phonetic && (
              <p className="mt-1 text-center text-slate-400 pointer-events-none">{card.phonetic}</p>
            )}
            <p className="mt-3 text-center text-2xl font-bold text-indigo-600 dark:text-indigo-400 pointer-events-none">
              {card.front}
            </p>
            {card.part_of_speech && (
              <p className="mt-1 text-center text-sm italic text-slate-500 pointer-events-none">
                ({card.part_of_speech})
              </p>
            )}
            {card.example && (
              <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-700 pointer-events-none">
                <p>{card.example}</p>
                {card.example_translation && (
                  <p className="mt-1 text-slate-500">{card.example_translation}</p>
                )}
              </div>
            )}
            {card.notes && (
              <p className="mt-2 text-center text-sm text-slate-500 pointer-events-none">📝 {card.notes}</p>
            )}
            <p className="mt-4 text-center text-xs text-slate-400 pointer-events-none">
              Tự đánh giá mức độ nhớ của bạn để sang thẻ tiếp theo.
            </p>
          </>
        )}
      </div>

      {showAnswer && (
        <div className="mb-3 flex justify-center">
          <button
            type="button"
            onClick={() => speak(card.front)}
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm hover:bg-slate-200 dark:bg-slate-700"
          >
            🔊 Phát âm
          </button>
        </div>
      )}

      {showAnswer && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {RATINGS.map((r) => (
            <button
              key={r.key}
              type="button"
              disabled={submitting}
              onClick={() => onRate(r.key)}
              className={`rounded-xl py-3 text-sm font-medium text-white disabled:opacity-50 ${r.color}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex justify-center gap-3 text-sm">
        {onUndo && (
          <button type="button" onClick={onUndo} disabled={submitting} className="text-slate-500 hover:text-slate-700 disabled:opacity-50">
            ↩ Hoàn tác
          </button>
        )}
        {onSuspend && (
          <button type="button" onClick={onSuspend} disabled={submitting} className="text-slate-500 hover:text-slate-700 disabled:opacity-50">
            ⏸ Tạm dừng thẻ
          </button>
        )}
      </div>
    </div>
  );
}
