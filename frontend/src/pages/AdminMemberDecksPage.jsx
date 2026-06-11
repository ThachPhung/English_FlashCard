import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getMemberDecks } from '../api/adminApi';
import { createDeck } from '../api/deckApi';
import { getUsers } from '../api/userApi';
import DeckCard from '../components/DeckCard';

export default function AdminMemberDecksPage() {
  const { userId } = useParams();
  const [member, setMember] = useState(null);
  const [decks, setDecks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', visibility: 'shared' });

  const load = () => {
    getMemberDecks(userId).then((r) => setDecks(r.data));
    getUsers().then((r) => {
      const u = r.data.find((x) => String(x.id) === String(userId));
      setMember(u);
    });
  };

  useEffect(() => {
    load();
  }, [userId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    await createDeck({ ...form, owner_id: parseInt(userId, 10) });
    setShowForm(false);
    setForm({ name: '', description: '', visibility: 'shared' });
    load();
  };

  return (
    <div>
      <Link to={`/admin/members/${userId}`} className="text-sm text-indigo-600 hover:underline">
        ← Tiến độ {member?.display_name || 'thành viên'}
      </Link>
      <div className="mt-2 mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Bộ từ của {member?.display_name || 'thành viên'}
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white"
        >
          + Tạo bộ từ cho em
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 rounded-xl border bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              placeholder="Tên bộ từ"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-lg border px-4 py-2 dark:border-slate-600 dark:bg-slate-700"
            />
            <select
              value={form.visibility}
              onChange={(e) => setForm({ ...form, visibility: e.target.value })}
              className="rounded-lg border px-4 py-2 dark:border-slate-600 dark:bg-slate-700"
            >
              <option value="private">Riêng tư</option>
              <option value="shared">Chia sẻ</option>
            </select>
            <textarea
              placeholder="Mô tả"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="col-span-2 rounded-lg border px-4 py-2 dark:border-slate-600 dark:bg-slate-700"
              rows={2}
            />
          </div>
          <button type="submit" className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white">
            Tạo bộ từ
          </button>
        </form>
      )}

      {decks.length === 0 ? (
        <p className="text-slate-500">Chưa có bộ từ. Tạo bộ từ mới cho thành viên này.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((d) => (
            <div key={d.id}>
              <DeckCard deck={d} />
              <Link
                to={`/decks/${d.id}?forUser=${userId}&member=${encodeURIComponent(member?.display_name || '')}`}
                className="mt-2 block text-center text-sm text-indigo-600 hover:underline"
              >
                Thêm / sửa thẻ cho {member?.display_name}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
