import { LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-forge-line bg-white">
      <div className="flex h-16 items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-forge-mint text-forge-teal">
            <ShieldCheck size={20} aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-forge-teal">TALENTFORGE</p>
            <p className="text-xs text-neutral-500">Internship Readiness Analyzer</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-forge-ink">{user?.name}</p>
            <p className="text-xs text-neutral-500">{user?.role.replace('_', ' ')}</p>
          </div>
          <button
            type="button"
            title="Logout"
            onClick={logout}
            className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-lg border border-forge-line bg-white text-neutral-600 hover:bg-neutral-50"
          >
            <LogOut size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
