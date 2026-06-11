import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOverview } from '../api/statsApi';
import { useAuth } from '../contexts/AuthContext';
import DeckCard from '../components/DeckCard';
import { getDecks } from '../api/deckApi';
import { useReloadOnFocus } from '../hooks/useReloadOnFocus';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [decks, setDecks] = useState([]);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    Promise.all([getOverview(), getDecks()])
      .then(([statsRes, decksRes]) => {
        setStats(statsRes.data);
        setDecks(decksRes.data);
      })
      .catch(() => setError('Không tải được dữ liệu. Kiểm tra backend đang chạy.'));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useReloadOnFocus(load);

  const statCards = stats
    ? [
        { label: 'Cần ôn hôm nay', value: stats.due_today, color: 'text-orange-600' },
        { label: 'Từ mới', value: stats.new_available, color: 'text-blue-600' },
        { label: 'Đã học', value: stats.total_studied, color: 'text-indigo-600' },
        { label: 'Đã thành thạo', value: stats.mastered, color: 'text-green-600' },
        { label: 'Chuỗi ngày', value: `${stats.streak_days} 🔥`, color: 'text-red-600' },
      ]
    : [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Xin chào, {user?.display_name}! 👋</h1>
        <p className="text-slate-500">Tiếp tục hành trình học từ vựng của bạn</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30">
          {error}
        </div>
      )}

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-700 dark:bg-slate-800"
          >
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="mt-1 text-xs text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Bộ từ của bạn ({decks.length})</h2>
        <div className="flex gap-2">
          <Link to="/decks" className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 dark:border-slate-600">
            Xem tất cả
          </Link>
          <Link to="/study" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Bắt đầu học
          </Link>
        </div>
      </div>

      {decks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-600">
          <p className="text-slate-500">Chưa có bộ từ nào.</p>
          <Link to="/decks" className="mt-2 inline-block text-indigo-600 hover:underline">
            Tạo bộ từ đầu tiên →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {decks.slice(0, 4).map((d) => (
            <DeckCard key={d.id} deck={d} />
          ))}
        </div>
      )}
    </div>
  );
}
