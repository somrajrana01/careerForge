import { ClipboardCheck, FileText, Gauge, HelpCircle, LayoutDashboard, UserRound } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { Role } from '../types';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles?: Role[];
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/profile', label: 'Profile', icon: UserRound, roles: ['STUDENT'] },
  { to: '/resumes', label: 'Resumes', icon: FileText, roles: ['STUDENT'] },
  { to: '/assessments', label: 'Assessments', icon: ClipboardCheck, roles: ['STUDENT'] },
  { to: '/results', label: 'Results', icon: Gauge, roles: ['STUDENT'] },
  { to: '/questions', label: 'Questions', icon: HelpCircle, roles: ['ADMIN'] },
];

export function Sidebar({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const visibleItems = navItems.filter((item) => !item.roles || (user && item.roles.includes(user.role)));

  return (
    <aside className={compact ? 'border-b border-forge-line bg-white md:hidden' : 'hidden w-64 border-r border-forge-line bg-white md:block'}>
      <nav className={compact ? 'flex gap-2 overflow-x-auto p-3' : 'flex flex-col gap-1 p-4'}>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `focus-ring flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive
                    ? 'bg-forge-mint text-forge-teal'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-forge-ink'
                }`
              }
            >
              <Icon size={18} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
