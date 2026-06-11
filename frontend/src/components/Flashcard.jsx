import { useEffect } from 'react';
import { useSpeech } from '../hooks/useSpeech';

const RATINGS = [
  { key: 'AGAIN', label: 'Quên', color: 'bg-red-500 hover:bg-red-600' },
  { key: 'HARD', label: 'Khó', color: 'bg-orange-500 hover:bg-orange-600' },
  { key: 'GOOD', label: 'Tốt', color: 'bg-green-500 hover:bg-green-600' },
  { key: 'EASY', label: 'Dễ', color: 'bg-blue-500 hover:bg-blue-600' },
];

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
  const { speak } = useSpeech();

  useEffect(() => {
    if (!card?.front || !soundEnabled) return;
    const timer = setTimeout(() => speak(card.front), 300);
    return () => {
      clearTimeout(timer);
      window.speechSynthesis?.cancel();
    };
  }, [card?.id, soundEnabled]);

  if (!card) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-800">
        <p className="text-lg text-slate-500">Bạn đã hoàn thành phiên học! 🎉</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <button
        type="button"
        onClick={onFlip}
        disabled={submitting}
        className="mb-4 w-full rounded-2xl border border-slate-200 bg-white p-8 text-left shadow-lg transition hover:border-indigo-300 hover:shadow-xl dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-600 min-h-[280px] flex flex-col justify-center cursor-pointer disabled:opacity-60"
      >
        {!showAnswer ? (
          <>
            {card.image_url && (
              <img
                src={card.image_url}
                alt={card.front}
                className="mx-auto mb-4 max-h-32 rounded-lg pointer-events-none"
              />
            )}
            <h2 className="text-center text-3xl font-bold pointer-events-none">{card.front}</h2>
            {card.is_new && (
              <span className="mx-auto mt-2 block w-fit rounded-full bg-blue-100 px-3 py-0.5 text-xs text-blue-700 pointer-events-none">
                Thẻ mới
              </span>
            )}
            <p className="mt-4 text-center text-xs text-slate-400 pointer-events-none">
              Chạm thẻ để xem nghĩa tiếng Việt
            </p>
          </>
        ) : (
          <>
            <p className="text-center text-sm text-slate-500 pointer-events-none">{card.front}</p>
            {card.phonetic && (
              <p className="mt-1 text-center text-slate-400 pointer-events-none">{card.phonetic}</p>
            )}
            <p className="mt-3 text-center text-2xl font-bold text-indigo-600 dark:text-indigo-400 pointer-events-none">
              {card.back}
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
              Chạm thẻ để quay lại từ tiếng Anh
            </p>
          </>
        )}
      </button>

      <div className="mb-3 flex justify-center">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            speak(card.front);
          }}
          className="rounded-lg bg-slate-100 px-4 py-2 text-sm hover:bg-slate-200 dark:bg-slate-700"
        >
          🔊 Phát âm
        </button>
      </div>

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
