import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getMemberProgress } from '../api/adminApi';

export default function AdminMemberPage() {
  const { userId } = useParams();
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getMemberProgress(userId)
      .then((r) => setReport(r.data))
      .catch(() => setError('Không tải được tiến độ thành viên'));
  }, [userId]);

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <Link to="/admin" className="mt-4 inline-block text-indigo-600">← Quay lại Admin</Link>
      </div>
    );
  }

  if (!report) return <p className="text-center py-12">Đang tải...</p>;

  const stats = [
    { label: 'Cần ôn hôm nay', value: report.due_today, color: 'text-orange-600' },
    { label: 'Từ mới', value: report.new_available, color: 'text-blue-600' },
    { label: 'Đã học', value: report.total_studied, color: 'text-indigo-600' },
    { label: 'Thành thạo', value: report.mastered, color: 'text-green-600' },
    { label: 'Chuỗi ngày', value: `${report.streak_days} 🔥`, color: 'text-red-600' },
  ];

  return (
    <div>
      <Link to="/admin" className="text-sm text-indigo-600 hover:underline">← Quay lại Admin</Link>
      <div className="mt-2 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{report.display_name}</h1>
          <p className="text-slate-500">@{report.username}</p>
          <p className="text-sm text-slate-400">
            Đăng nhập cuối:{' '}
            {report.last_login_at
              ? new Date(report.last_login_at).toLocaleString('vi-VN')
              : 'Chưa từng'}
          </p>
        </div>
        <Link
          to={`/admin/members/${userId}/decks`}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Thêm thẻ / Quản lý bộ từ
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border bg-white p-4 text-center dark:border-slate-700 dark:bg-slate-800"
          >
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="mt-1 text-xs text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      <h2 className="mb-4 text-lg font-semibold">Tiến độ theo bộ từ</h2>
      {report.decks.length === 0 ? (
        <p className="text-slate-500">Chưa có bộ từ nào.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border dark:border-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left">Bộ từ</th>
                <th className="px-4 py-3 text-left">Chủ sở hữu</th>
                <th className="px-4 py-3 text-center">Tổng</th>
                <th className="px-4 py-3 text-center">Mới</th>
                <th className="px-4 py-3 text-center">Đang học</th>
                <th className="px-4 py-3 text-center">Ôn tập</th>
                <th className="px-4 py-3 text-center">Thành thạo</th>
                <th className="px-4 py-3 text-center">Cần ôn</th>
                <th className="px-4 py-3 text-center">Tiến độ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {report.decks.map((d) => (
                <tr key={d.deck_id} className="border-t dark:border-slate-700">
                  <td className="px-4 py-3 font-medium">{d.deck_name}</td>
                  <td className="px-4 py-3 text-slate-500">{d.owner_name}</td>
                  <td className="px-4 py-3 text-center">{d.total_cards}</td>
                  <td className="px-4 py-3 text-center text-blue-600">{d.new_count}</td>
                  <td className="px-4 py-3 text-center">{d.learning_count}</td>
                  <td className="px-4 py-3 text-center">{d.review_count}</td>
                  <td className="px-4 py-3 text-center text-green-600">{d.mastered_count}</td>
                  <td className="px-4 py-3 text-center text-orange-600">{d.due_count}</td>
                  <td className="px-4 py-3 text-center">{d.progress_percent}%</td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/decks/${d.deck_id}?forUser=${userId}&member=${encodeURIComponent(report.display_name)}`}
                      className="text-indigo-600 hover:underline"
                    >
                      Quản lý thẻ
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
