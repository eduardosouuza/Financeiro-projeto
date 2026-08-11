import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type RouterContextValue = {
  route: string;
  navigate: (route: string) => void;
};

const RouterContext = createContext<RouterContextValue | undefined>(undefined);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'dashboard';
  });

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      setRoute(hash || 'dashboard');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (r: string) => {
    window.location.hash = r;
    setRoute(r);
    window.scrollTo(0, 0);
  };

  return (
    <RouterContext.Provider value={{ route, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}
