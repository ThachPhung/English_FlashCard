import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createDeck, deleteDeck, getDecks } from '../api/deckApi';
import DeckCard from '../components/DeckCard';
import ConfirmDialog from '../components/ConfirmDialog';
import { useReloadOnFocus } from '../hooks/useReloadOnFocus';

export default function DeckListPage() {
  const navigate = useNavigate();
  const [decks, setDecks] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', visibility: 'private' });
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    getDecks({ search: search || undefined, filter_type: filter || undefined })
      .then((r) => setDecks(r.data))
      .catch(() => setError('Không tải được danh sách bộ từ. Kiểm tra backend đang chạy.'))
      .finally(() => setLoading(false));
  }, [search, filter]);

  useEffect(() => {
    load();
  }, [load]);

  useReloadOnFocus(load);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await createDeck(form);
      setShowForm(false);
      setForm({ name: '', description: '', visibility: 'private' });
      setSuccess(`Đã lưu bộ từ "${res.data.name}" vào database.`);
      setTimeout(() => setSuccess(''), 4000);
      navigate(`/decks/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Không tạo được bộ từ');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDeck(deleteId);
      setDeleteId(null);
      load();
    } catch {
      setError('Không xóa được bộ từ');
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Danh sách bộ từ</h1>
          <p className="text-sm text-slate-500">Bộ từ được lưu vĩnh viễn trong database</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Tạo bộ từ
        </button>
      </div>

      {success && (
        <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Tìm kiếm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-slate-600 dark:bg-slate-700"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-slate-600 dark:bg-slate-700"
        >
          <option value="">Tất cả</option>
          <option value="mine">Của tôi</option>
          <option value="shared">Được chia sẻ</option>
        </select>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-4 font-semibold">Tạo bộ từ mới</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              required
              placeholder="Tên bộ từ *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-lg border border-slate-300 px-4 py-2 dark:border-slate-600 dark:bg-slate-700"
            />
            <select
              value={form.visibility}
              onChange={(e) => setForm({ ...form, visibility: e.target.value })}
              className="rounded-lg border border-slate-300 px-4 py-2 dark:border-slate-600 dark:bg-slate-700"
            >
              <option value="private">Riêng tư</option>
              <option value="shared">Chia sẻ</option>
            </select>
            <textarea
              placeholder="Mô tả"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="col-span-2 rounded-lg border border-slate-300 px-4 py-2 dark:border-slate-600 dark:bg-slate-700"
              rows={2}
            />
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white">
              Tạo và thêm thẻ
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-sm">
              Hủy
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="py-12 text-center text-slate-500">Đang tải...</p>
      ) : decks.length === 0 ? (
        <p className="py-12 text-center text-slate-500">
          {filter ? 'Không có bộ từ phù hợp bộ lọc.' : 'Chưa có bộ từ nào. Hãy tạo bộ từ đầu tiên.'}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((d) => (
            <div key={d.id} className="relative">
              <DeckCard deck={d} />
              <button
                onClick={() => setDeleteId(d.id)}
                className="absolute right-3 top-3 rounded bg-white/80 px-2 py-0.5 text-xs text-red-500 hover:text-red-700 dark:bg-slate-800/80"
              >
                Xóa
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Xóa bộ từ"
        message="Bạn có chắc muốn xóa bộ từ này? Tiến độ học sẽ được giữ lại."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
