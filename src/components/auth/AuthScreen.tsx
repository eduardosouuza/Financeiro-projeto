import { useState } from 'react';
import { Heart, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input, Field } from '@/components/ui/Input';

type Mode = 'login' | 'signup' | 'recovery';

export function AuthScreen() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    } else if (mode === 'signup') {
      if (password.length < 6) {
        setError('A senha deve ter no mínimo 6 caracteres.');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, fullName);
      if (error) setError(error);
      else setSuccess('Conta criada! Verifique seu e-mail ou faça login.');
    } else {
      const { error } = await resetPassword(email);
      if (error) setError(error);
      else setSuccess('Link de recuperação enviado para seu e-mail.');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-app)' }}>
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-lg"
            style={{ background: 'linear-gradient(135deg, #2563eb, #0891b2)' }}>
            <Heart size={32} fill="white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Duo Finance</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            Finanças a dois, organizadas juntos
          </p>
        </div>

        <div className="rounded-2xl p-6 sm:p-8" style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-elevated)', border: '1px solid var(--border-color)' }}>
          <h2 className="mb-6 text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {mode === 'login' && 'Entrar na sua conta'}
            {mode === 'signup' && 'Criar nova conta'}
            {mode === 'recovery' && 'Recuperar senha'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <Field label="Nome completo">
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome"
                    required
                    className="pl-10"
                  />
                </div>
              </Field>
            )}

            <Field label="E-mail">
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="pl-10"
                />
              </div>
            </Field>

            {mode !== 'recovery' && (
              <Field label="Senha">
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="pl-10"
                  />
                </div>
              </Field>
            )}

            {error && (
              <div className="rounded-xl bg-danger-50 px-4 py-3 text-sm text-danger-700 dark:bg-danger-900/30 dark:text-danger-300">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-xl bg-success-50 px-4 py-3 text-sm text-success-700 dark:bg-success-900/30 dark:text-success-300">
                {success}
              </div>
            )}

            <Button type="submit" fullWidth size="lg" disabled={loading}>
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar conta' : 'Enviar link'}
            </Button>
          </form>

          <div className="mt-6 space-y-2 text-center text-sm">
            {mode === 'login' && (
              <>
                <p style={{ color: 'var(--text-muted)' }}>
                  Não tem conta?{' '}
                  <button onClick={() => { setMode('signup'); setError(null); setSuccess(null); }} className="font-semibold text-primary-700 hover:underline">
                    Cadastre-se
                  </button>
                </p>
                <button onClick={() => { setMode('recovery'); setError(null); setSuccess(null); }} className="text-xs hover:underline" style={{ color: 'var(--text-muted)' }}>
                  Esqueceu sua senha?
                </button>
              </>
            )}
            {mode !== 'login' && (
              <button onClick={() => { setMode('login'); setError(null); setSuccess(null); }} className="inline-flex items-center gap-1 font-semibold text-primary-700 hover:underline">
                <ArrowLeft size={14} /> Voltar para login
              </button>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          Crie sua conta, depois convide seu parceiro(a) nas configurações
        </p>
      </div>
    </div>
  );
}
