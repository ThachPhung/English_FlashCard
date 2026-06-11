import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';

const navClass = ({ isActive }) =>
  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
  }`;

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Logo to="/" />
          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={navClass}>Dashboard</NavLink>
            <NavLink to="/decks" className={navClass}>Bộ từ</NavLink>
            <NavLink to="/statistics" className={navClass}>Thống kê</NavLink>
            <NavLink to="/settings" className={navClass}>Cài đặt</NavLink>
            {isAdmin && <NavLink to="/admin" className={navClass}>Gia đình</NavLink>}
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">{user?.display_name}</span>
            <button
              onClick={handleLogout}
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
