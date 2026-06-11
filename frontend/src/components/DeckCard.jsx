import { Link } from 'react-router-dom';

export default function DeckCard({ deck }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{deck.name}</h3>
          <p className="text-sm text-slate-500">{deck.owner_name}</p>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            deck.visibility === 'shared'
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
          }`}
        >
          {deck.visibility === 'shared' ? 'Chia sẻ' : 'Riêng tư'}
        </span>
      </div>
      {deck.description && (
        <p className="mb-3 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{deck.description}</p>
      )}
      <div className="mb-4 grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-700">
          <div className="font-bold text-indigo-600">{deck.card_count}</div>
          <div className="text-xs text-slate-500">Thẻ</div>
        </div>
        <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-700">
          <div className="font-bold text-orange-600">{deck.due_count}</div>
          <div className="text-xs text-slate-500">Cần ôn</div>
        </div>
        <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-700">
          <div className="font-bold text-green-600">{deck.new_count}</div>
          <div className="text-xs text-slate-500">Mới</div>
        </div>
      </div>
      <div className="mb-4">
        <div className="mb-1 flex justify-between text-xs text-slate-500">
          <span>Tiến độ</span>
          <span>{deck.progress_percent}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700">
          <div
            className="h-2 rounded-full bg-indigo-500 transition-all"
            style={{ width: `${deck.progress_percent}%` }}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Link
          to={`/study/${deck.id}`}
          className="flex-1 rounded-lg bg-indigo-600 py-2 text-center text-sm font-medium text-white hover:bg-indigo-700"
        >
          Học ngay
        </Link>
        <Link
          to={`/decks/${deck.id}`}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700"
        >
          Chi tiết
        </Link>
      </div>
    </div>
  );
}
