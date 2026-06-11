import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getDeck, updateDeck } from '../api/deckApi';
import { createCard, deleteCard, getCards, importCards, importPreview } from '../api/cardApi';
import ConfirmDialog from '../components/ConfirmDialog';

export default function DeckDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { isAdmin } = useAuth();
  const forUserId = searchParams.get('forUser');
  const memberName = searchParams.get('member');
  const isAdminView = isAdmin && forUserId;
  const cardParams = {
    search: undefined,
    status_filter: undefined,
    for_user_id: isAdminView ? forUserId : undefined,
  };
  const deckParams = isAdminView ? { for_user_id: forUserId } : undefined;
  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardForm, setCardForm] = useState({ front: '', back: '', phonetic: '', example: '', tags: '' });
  const [deleteCardId, setDeleteCardId] = useState(null);
  const [importPreviewData, setImportPreviewData] = useState(null);
  const fileRef = useRef();

  const load = () => {
    getDeck(id, deckParams).then((r) => setDeck(r.data));
    getCards(id, {
      ...cardParams,
      search: search || undefined,
      status_filter: statusFilter || undefined,
    }).then((r) => setCards(r.data));
  };

  useEffect(() => {
    load();
  }, [id, search, statusFilter, forUserId]);

  const handleCreateCard = async (e) => {
    e.preventDefault();
    try {
      await createCard(id, cardForm);
      setShowCardForm(false);
      setCardForm({ front: '', back: '', phonetic: '', example: '', tags: '' });
      load();
    } catch (err) {
      if (err.response?.status === 409) {
        if (window.confirm('Từ đã tồn tại. Vẫn tạo?')) {
          await createCard(id, { ...cardForm, allow_duplicate: true });
          setShowCardForm(false);
          load();
        }
      }
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await importPreview(id, file);
    setImportPreviewData({ file, ...res.data });
    fileRef.current.value = '';
  };

  const confirmImport = async () => {
    await importCards(id, importPreviewData.file);
    setImportPreviewData(null);
    load();
  };

  const handleDeleteCard = async () => {
    await deleteCard(deleteCardId);
    setDeleteCardId(null);
    load();
  };

  if (!deck) return <p>Đang tải...</p>;

  return (
    <div>
      {isAdminView && (
        <div className="mb-4 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
          Chế độ Admin — đang xem tiến độ của <strong>{memberName}</strong>. Bạn có thể thêm/sửa thẻ cho bộ từ này.
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to={isAdminView ? `/admin/members/${forUserId}` : '/decks'}
            className="text-sm text-indigo-600 hover:underline"
          >
            ← Quay lại
          </Link>
          <h1 className="mt-1 text-2xl font-bold">{deck.name}</h1>
          <p className="text-slate-500">{deck.description}</p>
          <div className="mt-2 flex gap-2 text-sm">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-700">{deck.card_count} thẻ</span>
            {isAdminView ? (
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-orange-700">
                {memberName}: {deck.due_count} cần ôn · {deck.new_count} mới
              </span>
            ) : (
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-orange-700">{deck.due_count} cần ôn</span>
            )}
          </div>
        </div>
        {!isAdminView && (
          <div className="flex gap-2">
            <Link
              to={`/study/${id}`}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Học ngay
            </Link>
          </div>
        )}
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={() => setShowCardForm(!showCardForm)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white"
        >
          + Thêm thẻ
        </button>
        <label className="cursor-pointer rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 dark:border-slate-600">
          Import CSV
          <input ref={fileRef} type="file" accept=".csv" onChange={handleImport} className="hidden" />
        </label>
        <input
          placeholder="Tìm kiếm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-slate-600 dark:bg-slate-700"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-slate-600 dark:bg-slate-700"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="NEW">Mới</option>
          <option value="LEARNING">Đang học</option>
          <option value="REVIEW">Ôn tập</option>
          <option value="MASTERED">Thành thạo</option>
          <option value="SUSPENDED">Tạm dừng</option>
        </select>
      </div>

      {showCardForm && (
        <form onSubmit={handleCreateCard} className="mb-6 rounded-xl border bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <div className="grid gap-3 sm:grid-cols-2">
            <input required placeholder="Từ tiếng Anh *" value={cardForm.front}
              onChange={(e) => setCardForm({ ...cardForm, front: e.target.value })}
              className="rounded-lg border px-4 py-2 dark:border-slate-600 dark:bg-slate-700" />
            <input required placeholder="Nghĩa tiếng Việt *" value={cardForm.back}
              onChange={(e) => setCardForm({ ...cardForm, back: e.target.value })}
              className="rounded-lg border px-4 py-2 dark:border-slate-600 dark:bg-slate-700" />
            <input placeholder="Phiên âm" value={cardForm.phonetic}
              onChange={(e) => setCardForm({ ...cardForm, phonetic: e.target.value })}
              className="rounded-lg border px-4 py-2 dark:border-slate-600 dark:bg-slate-700" />
            <input placeholder="Tags" value={cardForm.tags}
              onChange={(e) => setCardForm({ ...cardForm, tags: e.target.value })}
              className="rounded-lg border px-4 py-2 dark:border-slate-600 dark:bg-slate-700" />
            <textarea placeholder="Ví dụ" value={cardForm.example}
              onChange={(e) => setCardForm({ ...cardForm, example: e.target.value })}
              className="col-span-2 rounded-lg border px-4 py-2 dark:border-slate-600 dark:bg-slate-700" rows={2} />
          </div>
          <button type="submit" className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white">Lưu</button>
        </form>
      )}

      {importPreviewData && (
        <div className="mb-6 rounded-xl border bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="font-semibold">Preview Import</h3>
          <p className="text-sm text-slate-500">
            Hợp lệ: {importPreviewData.valid_count} | Lỗi: {importPreviewData.invalid_count} | Trùng: {importPreviewData.duplicate_count}
          </p>
          <div className="mt-3 max-h-48 overflow-auto text-sm">
            {importPreviewData.rows.slice(0, 10).map((r) => (
              <div key={r.row_number} className={r.is_valid ? '' : 'text-red-500'}>
                {r.row_number}. {r.front} — {r.back} {r.error && `(${r.error})`}
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={confirmImport} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white">Import</button>
            <button onClick={() => setImportPreviewData(null)} className="rounded-lg border px-4 py-2 text-sm">Hủy</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="px-4 py-3 text-left">Từ</th>
              <th className="px-4 py-3 text-left">Nghĩa</th>
              <th className="px-4 py-3 text-left">Trạng thái</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {cards.map((c) => (
              <tr key={c.id} className="border-t border-slate-100 dark:border-slate-700">
                <td className="px-4 py-3 font-medium">{c.front}</td>
                <td className="px-4 py-3">{c.back}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-700">{c.status}</span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => setDeleteCardId(c.id)} className="text-red-500 hover:text-red-700">Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {cards.length === 0 && <p className="p-8 text-center text-slate-500">Chưa có flashcard</p>}
      </div>

      <ConfirmDialog
        open={!!deleteCardId}
        title="Xóa flashcard"
        message="Bạn có chắc muốn xóa thẻ này?"
        onConfirm={handleDeleteCard}
        onCancel={() => setDeleteCardId(null)}
      />
    </div>
  );
}
