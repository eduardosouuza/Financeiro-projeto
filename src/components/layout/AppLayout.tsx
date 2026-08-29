import { type ReactNode } from 'react';
import {
  LayoutDashboard, TrendingUp, Receipt, Wallet, CreditCard,
  Layers, Landmark, Calendar, CalendarDays, Target, FileBarChart,
  Settings, LogOut, Moon, Sun, Bell, Menu, X, Heart, Plus, HeartHandshake,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCouple } from '@/contexts/CoupleContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from '@/contexts/RouterContext';
import { useState } from 'react';

type NavItem = { route: string; label: string; icon: ReactNode };

const navItems: NavItem[] = [
  { route: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { route: 'revenues', label: 'Receitas', icon: <TrendingUp size={20} /> },
  { route: 'expenses', label: 'Contas', icon: <Receipt size={20} /> },
  { route: 'variable', label: 'Gastos', icon: <Wallet size={20} /> },
  { route: 'cards', label: 'Cartões', icon: <CreditCard size={20} /> },
  { route: 'installments', label: 'Parcelas', icon: <Layers size={20} /> },
  { route: 'loans', label: 'Empréstimos', icon: <Landmark size={20} /> },
  { route: 'calendar', label: 'Calendário', icon: <Calendar size={20} /> },
  { route: 'planning', label: 'Planejamento', icon: <CalendarDays size={20} /> },
  { route: 'goals', label: 'Metas', icon: <Target size={20} /> },
  { route: 'reports', label: 'Relatórios', icon: <FileBarChart size={20} /> },
  { route: 'settings', label: 'Configurações', icon: <Settings size={20} /> },
];

const bottomNavItems: NavItem[] = [
  { route: 'dashboard', label: 'Início', icon: <LayoutDashboard size={22} /> },
  { route: 'expenses', label: 'Contas', icon: <Receipt size={22} /> },
  { route: 'add', label: 'Adicionar', icon: <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-white shadow-md"><Plus size={18} /></div> },
  { route: 'calendar', label: 'Calendário', icon: <Calendar size={22} /> },
  { route: 'settings', label: 'Perfil', icon: <Settings size={22} /> },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const { couple, partner } = useCouple();
  const { theme, toggleTheme } = useTheme();
  const { route, navigate } = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentLabel = navItems.find((n) => n.route === route)?.label ?? 'Duo Finance';

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--bg-app)' }}>
      {/* Desktop sidebar */}
      <aside
        className="fixed left-0 top-0 z-30 hidden h-screen w-64 flex-col border-r lg:flex"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-3 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-md"
            style={{ background: 'linear-gradient(135deg, #2563eb, #0891b2)' }}>
            <Heart size={22} fill="white" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Duo Finance</h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Finanças a dois</p>
          </div>
        </div>

        {/* Couple status badge */}
        {couple?.status === 'active' && partner && (
          <div className="mx-3 mb-2 flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ backgroundColor: 'var(--bg-app)' }}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
              <HeartHandshake size={16} className="text-primary-700" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{partner.fullName}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Casal conectado</p>
            </div>
          </div>
        )}

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {navItems.map((item) => (
            <button
              key={item.route}
              onClick={() => navigate(item.route)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                route === item.route
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="border-t p-3" style={{ borderColor: 'var(--border-color)' }}>
          <button
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            {theme === 'light' ? 'Modo escuro' : 'Modo claro'}
          </button>
          <button
            onClick={() => signOut()}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-danger-600 transition-colors hover:bg-danger-50 dark:hover:bg-danger-900/20"
          >
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header
        className="fixed top-0 z-30 flex w-full items-center justify-between gap-2 border-b px-4 py-3 lg:hidden"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <button onClick={() => setMobileMenuOpen(true)} className="shrink-0 rounded-lg p-1" style={{ color: 'var(--text-primary)' }}>
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg text-white"
              style={{ background: 'linear-gradient(135deg, #2563eb, #0891b2)' }}>
              <Heart size={15} fill="white" />
            </div>
            <span className="truncate text-base font-bold" style={{ color: 'var(--text-primary)' }}>{currentLabel}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button onClick={() => navigate('notifications')} className="relative rounded-lg p-2" style={{ color: 'var(--text-secondary)' }}>
            <Bell size={20} />
          </button>
          <button onClick={toggleTheme} className="rounded-lg p-2" style={{ color: 'var(--text-secondary)' }}>
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={() => setMobileMenuOpen(false)} />
          <div
            className="absolute left-0 top-0 h-full w-[80vw] max-w-xs overflow-y-auto animate-slide-in-left"
            style={{ backgroundColor: 'var(--bg-card)' }}
          >
            <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-md"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #0891b2)' }}>
                  <Heart size={18} fill="white" />
                </div>
                <div>
                  <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Duo Finance</span>
                  {couple?.status === 'active' && partner && (
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>com {partner.fullName}</p>
                  )}
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="rounded-lg p-1" style={{ color: 'var(--text-muted)' }}>
                <X size={22} />
              </button>
            </div>
            <nav className="space-y-1 p-3">
              {navItems.map((item) => (
                <button
                  key={item.route}
                  onClick={() => { navigate(item.route); setMobileMenuOpen(false); }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    route === item.route
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
              <button
                onClick={() => signOut()}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-danger-600 transition-colors hover:bg-danger-50 dark:hover:bg-danger-900/20"
              >
                <LogOut size={20} />
                Sair
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        <main className="min-h-screen px-4 pb-24 pt-16 sm:px-6 lg:px-8 lg:pb-8 lg:pt-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav
        className="fixed bottom-0 z-30 flex w-full items-center justify-around border-t lg:hidden"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {bottomNavItems.map((item) => (
          <button
            key={item.route}
            onClick={() => navigate(item.route)}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
              route === item.route ? 'text-primary-600' : 'text-neutral-500'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
