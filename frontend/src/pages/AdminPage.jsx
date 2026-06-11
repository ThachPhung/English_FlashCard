import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createUser, getUsers, lockUser, resetPassword, unlockUser } from '../api/userApi';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    username: '', email: '', password: '', display_name: '', role: 'user',
  });

  const load = () => getUsers().then((r) => setUsers(r.data));

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createUser(form);
      setShowForm(false);
      setForm({ username: '', email: '', password: '', display_name: '', role: 'user' });
      load();
    } catch (err) {
      alert(err.response?.data?.detail || 'Lỗi tạo tài khoản');
    }
  };

  const handleReset = async (id) => {
    const pwd = prompt('Nhập mật khẩu mới (tối thiểu 8 ký tự):');
    if (pwd && pwd.length >= 8) {
      await resetPassword(id, pwd);
      alert('Đã đặt lại mật khẩu');
    }
  };

  const learners = users.filter((u) => u.role !== 'admin');

  return (
    <div>
      <div className="mb-2">
        <h1 className="text-2xl font-bold">Quản lý gia đình</h1>
        <p className="text-sm text-slate-500">
          Tạo tài khoản, xem tiến độ học và thêm thẻ cho từng thành viên
        </p>
      </div>

      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white"
        >
          + Tạo tài khoản
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 rounded-xl border bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <div className="grid gap-3 sm:grid-cols-2">
            <input required placeholder="Username" value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="rounded-lg border px-4 py-2 dark:border-slate-600 dark:bg-slate-700" />
            <input required type="email" placeholder="Email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="rounded-lg border px-4 py-2 dark:border-slate-600 dark:bg-slate-700" />
            <input required placeholder="Tên hiển thị" value={form.display_name}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              className="rounded-lg border px-4 py-2 dark:border-slate-600 dark:bg-slate-700" />
            <input required type="password" placeholder="Mật khẩu" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="rounded-lg border px-4 py-2 dark:border-slate-600 dark:bg-slate-700" />
          </div>
          <button type="submit" className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white">Tạo</button>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {learners.map((u) => (
          <div
            key={u.id}
            className="rounded-xl border bg-white p-5 dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{u.display_name}</h3>
                <p className="text-sm text-slate-500">@{u.username}</p>
              </div>
              <span className={u.is_active ? 'text-green-600 text-xs' : 'text-red-500 text-xs'}>
                {u.is_active ? 'Hoạt động' : 'Đã khóa'}
              </span>
            </div>
            <p className="mb-4 text-sm text-slate-500">
              {u.deck_count} bộ từ · {u.card_count} thẻ
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                to={`/admin/members/${u.id}`}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
              >
                Xem tiến độ
              </Link>
              <Link
                to={`/admin/members/${u.id}/decks`}
                className="rounded-lg border border-indigo-600 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50"
              >
                Thêm thẻ
              </Link>
              <button onClick={() => handleReset(u.id)} className="text-xs text-slate-500 hover:underline">
                Reset MK
              </button>
              {u.is_active ? (
                <button onClick={() => lockUser(u.id).then(load)} className="text-xs text-red-500 hover:underline">
                  Khóa
                </button>
              ) : (
                <button onClick={() => unlockUser(u.id).then(load)} className="text-xs text-green-600 hover:underline">
                  Mở
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {learners.length === 0 && (
        <p className="py-12 text-center text-slate-500">Chưa có thành viên nào. Tạo tài khoản để bắt đầu.</p>
      )}
    </div>
  );
}
