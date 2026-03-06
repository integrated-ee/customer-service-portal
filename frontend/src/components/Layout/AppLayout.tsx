import { useMsal } from '@azure/msal-react';
import { NavLink } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { instance } = useMsal();
  const account = instance.getAllAccounts()[0];
  const { user } = useUser();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-700 hover:text-white'
    }`;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-60 bg-slate-800 text-white flex flex-col shrink-0">
        <div className="px-4 py-5 border-b border-slate-700">
          <h1 className="text-lg font-bold">Support Portal</h1>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <NavLink to="/tickets" className={linkClass}>My Tickets</NavLink>
          <NavLink to="/tickets/new" className={linkClass}>New Ticket</NavLink>
          {user?.isAdmin && (
            <>
              <div className="pt-4 pb-1 px-4 text-xs uppercase text-slate-400 tracking-wider">Admin</div>
              <NavLink to="/admin" className={linkClass}>Dashboard</NavLink>
            </>
          )}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
          <div />
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{account?.name || account?.username}</span>
            <button
              onClick={() => instance.logoutRedirect()}
              className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
