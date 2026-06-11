import { useEffect, useState } from 'react';
import { changePassword } from '../api/authApi';
import { getSettings, updateSettings } from '../api/settingsApi';

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [pwd, setPwd] = useState({ current: '', new: '', confirm: '' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    getSettings().then((r) => setSettings(r.data));
  }, []);

  const handleSaveSettings = async () => {
    await updateSettings(settings);
    setMsg('Đã lưu cài đặt');
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    setTimeout(() => setMsg(''), 3000);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await changePassword({
        current_password: pwd.current,
        new_password: pwd.new,
        confirm_password: pwd.confirm,
      });
      setMsg('Đổi mật khẩu thành công');
      setPwd({ current: '', new: '', confirm: '' });
    } catch (ex) {
      setErr(ex.response?.data?.detail || 'Lỗi đổi mật khẩu');
    }
  };

  if (!settings) return <p>Đang tải...</p>;

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">Cài đặt</h1>

      {msg && <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{msg}</div>}

      <section className="mb-8 rounded-xl border bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="mb-4 font-semibold">Giới hạn học tập</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm">Số từ mới mỗi ngày</label>
            <input
              type="number"
              min={1}
              max={500}
              value={settings.daily_new_limit}
              onChange={(e) => setSettings({ ...settings, daily_new_limit: +e.target.value })}
              className="mt-1 w-full rounded-lg border px-4 py-2 dark:border-slate-600 dark:bg-slate-700"
            />
          </div>
          <div>
            <label className="text-sm">Số thẻ ôn tối đa mỗi ngày</label>
            <input
              type="number"
              min={1}
              max={1000}
              value={settings.daily_review_limit}
              onChange={(e) => setSettings({ ...settings, daily_review_limit: +e.target.value })}
              className="mt-1 w-full rounded-lg border px-4 py-2 dark:border-slate-600 dark:bg-slate-700"
            />
          </div>
          <div>
            <label className="text-sm">Múi giờ</label>
            <input
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              className="mt-1 w-full rounded-lg border px-4 py-2 dark:border-slate-600 dark:bg-slate-700"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm">Bật âm thanh</label>
            <input
              type="checkbox"
              checked={settings.sound_enabled}
              onChange={(e) => setSettings({ ...settings, sound_enabled: e.target.checked })}
            />
          </div>
          <div>
            <label className="text-sm">Giao diện</label>
            <select
              value={settings.theme}
              onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
              className="mt-1 w-full rounded-lg border px-4 py-2 dark:border-slate-600 dark:bg-slate-700"
            >
              <option value="light">Sáng</option>
              <option value="dark">Tối</option>
            </select>
          </div>
          <button
            onClick={handleSaveSettings}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white"
          >
            Lưu cài đặt
          </button>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="mb-4 font-semibold">Đổi mật khẩu</h2>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <input
            type="password"
            placeholder="Mật khẩu hiện tại"
            value={pwd.current}
            onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
            className="w-full rounded-lg border px-4 py-2 dark:border-slate-600 dark:bg-slate-700"
          />
          <input
            type="password"
            placeholder="Mật khẩu mới (tối thiểu 8 ký tự)"
            value={pwd.new}
            onChange={(e) => setPwd({ ...pwd, new: e.target.value })}
            className="w-full rounded-lg border px-4 py-2 dark:border-slate-600 dark:bg-slate-700"
          />
          <input
            type="password"
            placeholder="Xác nhận mật khẩu mới"
            value={pwd.confirm}
            onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
            className="w-full rounded-lg border px-4 py-2 dark:border-slate-600 dark:bg-slate-700"
          />
          {err && <p className="text-sm text-red-500">{err}</p>}
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white">
            Đổi mật khẩu
          </button>
        </form>
      </section>
    </div>
  );
}
