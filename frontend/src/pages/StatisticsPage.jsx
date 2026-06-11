import { useEffect, useState } from 'react';
import { getDailyStats, getOverview } from '../api/statsApi';

export default function StatisticsPage() {
  const [overview, setOverview] = useState(null);
  const [daily, setDaily] = useState([]);

  useEffect(() => {
    getOverview().then((r) => setOverview(r.data));
    getDailyStats(14).then((r) => setDaily(r.data));
  }, []);

  const maxReviews = Math.max(...daily.map((d) => d.reviews), 1);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Thống kê</h1>

      {overview && (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Tổng đã học', value: overview.total_studied },
            { label: 'Thành thạo', value: overview.mastered },
            { label: 'Cần ôn', value: overview.due_today },
            { label: 'Chuỗi ngày', value: `${overview.streak_days} 🔥` },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-white p-4 text-center dark:border-slate-700 dark:bg-slate-800">
              <div className="text-2xl font-bold text-indigo-600">{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <h2 className="mb-4 text-lg font-semibold">Hoạt động 14 ngày qua</h2>
      <div className="rounded-xl border bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-end gap-1 h-40">
          {daily.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-indigo-500 transition-all"
                style={{ height: `${(d.reviews / maxReviews) * 100}%`, minHeight: d.reviews > 0 ? '4px' : '0' }}
                title={`${d.reviews} lượt ôn`}
              />
              <span className="text-[10px] text-slate-400 rotate-0">
                {d.date.slice(5)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
