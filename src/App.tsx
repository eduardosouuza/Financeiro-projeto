import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { CoupleProvider } from '@/contexts/CoupleContext';
import { RouterProvider, useRouter } from '@/contexts/RouterContext';

import { AuthScreen } from '@/components/auth/AuthScreen';
import { AppLayout } from '@/components/layout/AppLayout';
import { FullPageLoading } from '@/components/ui/Loading';
import { Dashboard } from '@/components/pages/Dashboard';
import { RevenuesPage } from '@/components/pages/RevenuesPage';
import { ExpensesPage } from '@/components/pages/ExpensesPage';
import { VariableExpensesPage } from '@/components/pages/VariableExpensesPage';
import { CardsPage } from '@/components/pages/CardsPage';
import { InstallmentsPage } from '@/components/pages/InstallmentsPage';
import { LoansPage } from '@/components/pages/LoansPage';
import { CalendarPage } from '@/components/pages/CalendarPage';
import { PlanningPage } from '@/components/pages/PlanningPage';
import { GoalsPage } from '@/components/pages/GoalsPage';
import { BudgetsPage } from '@/components/pages/BudgetsPage';
import { ReportsPage } from '@/components/pages/ReportsPage';
import { SettingsPage } from '@/components/pages/SettingsPage';
import { AddPage } from '@/components/pages/AddPage';
import { NotificationsPage } from '@/components/pages/NotificationsPage';

function RouteRenderer() {
  const { route } = useRouter();
  switch (route) {
    case 'dashboard': return <Dashboard />;
    case 'revenues': return <RevenuesPage />;
    case 'expenses': return <ExpensesPage />;
    case 'variable': return <VariableExpensesPage />;
    case 'cards': return <CardsPage />;
    case 'installments': return <InstallmentsPage />;
    case 'loans': return <LoansPage />;
    case 'calendar': return <CalendarPage />;
    case 'planning': return <PlanningPage />;
    case 'goals': return <GoalsPage />;
    case 'budgets': return <BudgetsPage />;
    case 'reports': return <ReportsPage />;
    case 'settings': return <SettingsPage />;
    case 'add': return <AddPage />;
    case 'notifications': return <NotificationsPage />;
    default: return <Dashboard />;
  }
}

function AppContent() {
  const { session, loading } = useAuth();

  if (loading) return <FullPageLoading />;
  if (!session) return <AuthScreen />;

  return (
    <ThemeProvider>
      <CoupleProvider>
        <AppLayout>
          <RouteRenderer />
        </AppLayout>
      </CoupleProvider>
    </ThemeProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <AppContent />
      </RouterProvider>
    </AuthProvider>
  );
}

export default App;
