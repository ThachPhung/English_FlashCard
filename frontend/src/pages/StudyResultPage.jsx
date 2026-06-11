import { Link, useLocation } from 'react-router-dom';
import { loadStudyResult } from '../utils/studyResultStorage';

export default function StudyResultPage() {
  const { state } = useLocation();
  const saved = loadStudyResult();
  const result = state?.result ?? saved?.result;
  const deckId = state?.deckId ?? saved?.deckId;

  if (!result) {
    return (
      <div className="text-center py-12">
        <p>Không có dữ liệu phiên học</p>
        <Link to="/decks" className="mt-4 inline-block text-indigo-600">Về danh sách bộ từ</Link>
      </div>
    );
  }

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m} phút ${sec} giây` : `${sec} giây`;
  };

  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-700 dark:bg-slate-800">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold">Hoàn thành phiên học!</h1>
        <p className="mt-2 text-slate-500">
          Đã học {result.completed_cards}/{result.total_cards} thẻ trong {formatTime(result.duration_seconds)}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
            <div className="text-xl font-bold text-red-600">{result.ratings.AGAIN}</div>
            <div>Quên</div>
          </div>
          <div className="rounded-lg bg-orange-50 p-3 dark:bg-orange-900/20">
            <div className="text-xl font-bold text-orange-600">{result.ratings.HARD}</div>
            <div>Khó</div>
          </div>
          <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
            <div className="text-xl font-bold text-green-600">{result.ratings.GOOD}</div>
            <div>Tốt</div>
          </div>
          <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
            <div className="text-xl font-bold text-blue-600">{result.ratings.EASY}</div>
            <div>Dễ</div>
          </div>
        </div>

        <div className="mt-6 rounded-lg bg-indigo-50 p-4 dark:bg-indigo-900/20">
          <div className="text-3xl font-bold text-indigo-600">{result.remember_rate}%</div>
          <div className="text-sm text-slate-500">Tỷ lệ nhớ</div>
        </div>

        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {deckId && (
            <Link
              to={`/decks/${deckId}`}
              className="rounded-lg border border-indigo-600 px-6 py-2.5 font-medium text-indigo-600 hover:bg-indigo-50"
            >
              Về bộ từ
            </Link>
          )}
          <Link
            to="/decks"
            className="rounded-lg bg-indigo-600 px-6 py-2.5 font-medium text-white hover:bg-indigo-700"
          >
            Danh sách bộ từ
          </Link>
        </div>
      </div>
    </div>
  );
}
