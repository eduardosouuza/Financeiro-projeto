import { useState, useEffect } from 'react';
import { Moon, Sun, User, LogOut, Download, Trash2, Shield, Heart, HeartCrack, Check, X, Mail, HeartHandshake, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCouple } from '@/contexts/CoupleContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Field, Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

export function SettingsPage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { couple, partner, invitePartner, acceptInvite, declineInvite, leaveCouple, refresh: refreshCouple } = useCouple();
  const { theme, setTheme } = useTheme();
  const [nameModal, setNameModal] = useState(false);
  const [name, setName] = useState(profile?.full_name ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  // Couple invite state
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Pending incoming invite
  const [pendingInvite, setPendingInvite] = useState<{ id: string; invited_email: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [confirmLeave, setConfirmLeave] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    (async () => {
      const { data } = await supabase
        .from('couples')
        .select('*')
        .eq('invited_email', user.email)
        .eq('status', 'pending')
        .maybeSingle();
      if (data) setPendingInvite(data as { id: string; invited_email: string });
      else setPendingInvite(null);
    })();
  }, [user, couple]);

  const updateName = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').update({ full_name: name }).eq('id', user.id);
    await refreshProfile();
    setSaving(false);
    setNameModal(false);
  };

  const handleInvite = async () => {
    setInviteError(null);
    setInviteLoading(true);
    const { error } = await invitePartner(inviteEmail);
    setInviteLoading(false);
    if (error) {
      setInviteError(error);
    } else {
      setInviteSuccess(true);
      setInviteEmail('');
      setTimeout(() => {
        setInviteModal(false);
        setInviteSuccess(false);
      }, 1500);
    }
  };

  const handleAccept = async () => {
    setActionLoading(true);
    await acceptInvite();
    setActionLoading(false);
    setPendingInvite(null);
  };

  const handleDecline = async () => {
    setActionLoading(true);
    await declineInvite();
    setActionLoading(false);
    setPendingInvite(null);
  };

  const handleLeave = async () => {
    setActionLoading(true);
    await leaveCouple();
    setActionLoading(false);
    setConfirmLeave(false);
  };

  const exportData = async () => {
    if (!user) return;
    const tables = ['revenues', 'expenses', 'cards', 'purchases', 'loans', 'goals', 'budgets', 'financial_accounts', 'categories'];
    const data: Record<string, unknown> = {};
    for (const t of tables) {
      const { data: rows } = await supabase.from(t).select('*').eq('user_id', user.id);
      data[t] = rows;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'duofinance_backup.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteAccount = async () => {
    if (!user) return;
    await supabase.from('profiles').delete().eq('id', user.id);
    await supabase.auth.signOut();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl" style={{ color: 'var(--text-primary)' }}>Configurações</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Gerencie sua conta, casal e preferências</p>
      </div>

      {/* Profile */}
      <Card>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white sm:h-14 sm:w-14"
            style={{ background: 'linear-gradient(135deg, #2563eb, #0891b2)' }}>
            <User size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold sm:text-base" style={{ color: 'var(--text-primary)' }}>{profile?.full_name || 'Usuário'}</p>
            <p className="truncate text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { setName(profile?.full_name ?? ''); setNameModal(true); }} className="shrink-0">Editar</Button>
        </div>
      </Card>

      {/* Couple section */}
      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Heart size={20} className="text-primary-600" />
          <h3 className="text-sm font-bold sm:text-base" style={{ color: 'var(--text-primary)' }}>Casal</h3>
        </div>

        {/* Pending incoming invite */}
        {pendingInvite && !couple && (
          <div className="mb-4 rounded-xl border border-primary-200 bg-primary-50 p-4 dark:border-primary-800/40 dark:bg-primary-900/20">
            <div className="mb-2 flex items-center gap-2">
              <Mail size={18} className="text-primary-700" />
              <p className="text-sm font-semibold text-primary-700 dark:text-primary-300">Você recebeu um convite!</p>
            </div>
            <p className="mb-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
              Alguém quer compartilhar as finanças com você. Aceite para começar a organizar juntos.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAccept} disabled={actionLoading}>
                <Check size={16} /> Aceitar
              </Button>
              <Button size="sm" variant="secondary" onClick={handleDecline} disabled={actionLoading}>
                <X size={16} /> Recusar
              </Button>
            </div>
          </div>
        )}

        {/* Active couple */}
        {couple?.status === 'active' && partner && (
          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
                <HeartHandshake size={22} className="text-primary-700" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{partner.fullName}</p>
                <div className="flex items-center gap-1.5">
                  <Badge tone="success">Conectado</Badge>
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
              Vocês compartilham receitas, contas, cartões e metas. Cada item mostra quem cadastrou.
            </p>
            <button
              onClick={() => setConfirmLeave(true)}
              className="mt-3 flex items-center gap-2 text-xs font-medium text-danger-600 hover:underline"
            >
              <HeartCrack size={14} /> Desconectar casal
            </button>
          </div>
        )}

        {/* Pending invite sent */}
        {couple?.status === 'pending' && (
          <div className="rounded-xl border border-warning-200 bg-warning-50 p-4 dark:border-warning-800/40 dark:bg-warning-900/20">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-warning-600" />
              <p className="text-sm font-semibold text-warning-700 dark:text-warning-300">Convite enviado</p>
            </div>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
              Aguardando <span className="font-semibold">{couple.invited_email}</span> aceitar o convite.
            </p>
            <button
              onClick={() => setConfirmLeave(true)}
              className="mt-3 flex items-center gap-2 text-xs font-medium text-danger-600 hover:underline"
            >
              <X size={14} /> Cancelar convite
            </button>
          </div>
        )}

        {/* No couple yet */}
        {!couple && !pendingInvite && (
          <div className="rounded-xl border border-dashed p-6 text-center" style={{ borderColor: 'var(--border-color)' }}>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 dark:bg-primary-900/30">
              <Heart size={24} className="text-primary-600" />
            </div>
            <p className="mb-1 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Organize as finanças com seu parceiro(a)</p>
            <p className="mb-4 text-xs" style={{ color: 'var(--text-muted)' }}>
              Convide seu amor para compartilhar receitas, contas e metas. Vocês verão tudo no mesmo lugar.
            </p>
            <Button size="sm" onClick={() => setInviteModal(true)}>
              <Heart size={16} /> Conviar parceiro(a)
            </Button>
          </div>
        )}
      </Card>

      {/* Theme */}
      <Card>
        <h3 className="mb-3 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Aparência</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setTheme('light')}
            className={`flex items-center gap-3 rounded-xl border p-4 transition-all ${theme === 'light' ? 'ring-2 ring-primary-500/30' : ''}`}
            style={{ borderColor: theme === 'light' ? '#2563eb' : 'var(--border-color)' }}
          >
            <Sun size={22} className="text-warning-500" />
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Modo claro</span>
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`flex items-center gap-3 rounded-xl border p-4 transition-all ${theme === 'dark' ? 'ring-2 ring-primary-500/30' : ''}`}
            style={{ borderColor: theme === 'dark' ? '#2563eb' : 'var(--border-color)' }}
          >
            <Moon size={22} className="text-primary-400" />
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Modo escuro</span>
          </button>
        </div>
      </Card>

      {/* Data */}
      <Card>
        <h3 className="mb-3 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Dados</h3>
        <div className="space-y-2">
          <button onClick={exportData} className="flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800" style={{ borderColor: 'var(--border-color)' }}>
            <Download size={20} className="text-success-600" />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Exportar dados (backup)</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Baixar todos os seus dados em JSON</p>
            </div>
          </button>
        </div>
      </Card>

      {/* Account */}
      <Card>
        <h3 className="mb-3 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Conta</h3>
        <div className="space-y-2">
          <button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800" style={{ borderColor: 'var(--border-color)' }}>
            <LogOut size={20} className="text-primary-700" />
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Sair da conta</p>
          </button>
          <button onClick={() => setConfirmDelete(true)} className="flex w-full items-center gap-3 rounded-xl border border-danger-200 p-3 text-left transition-all hover:bg-danger-50 dark:border-danger-900/40 dark:hover:bg-danger-900/20">
            <Trash2 size={20} className="text-danger-600" />
            <div>
              <p className="text-sm font-medium text-danger-600">Excluir conta</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Apaga todos os seus dados permanentemente</p>
            </div>
          </button>
        </div>
      </Card>

      <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>Duo Finance · Finanças a dois, organizadas juntos</p>

      {/* Modals */}
      <Modal open={nameModal} onClose={() => setNameModal(false)} title="Editar nome"
        footer={<><Button variant="secondary" onClick={() => setNameModal(false)}>Cancelar</Button><Button onClick={updateName} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button></>}>
        <Field label="Nome completo"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
      </Modal>

      <Modal open={inviteModal} onClose={() => { setInviteModal(false); setInviteError(null); }} title="Convidar parceiro(a)"
        footer={<><Button variant="secondary" onClick={() => { setInviteModal(false); setInviteError(null); }}>Cancelar</Button><Button onClick={handleInvite} disabled={inviteLoading || !inviteEmail.trim()}>{inviteLoading ? 'Enviando...' : 'Enviar convite'}</Button></>}>
        {inviteSuccess ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success-100 dark:bg-success-900/30">
              <Check size={28} className="text-success-600" />
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Convite enviado!</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Seu parceiro(a) receberá o convite ao fazer login.</p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Digite o e-mail do seu parceiro(a). Ele precisará criar uma conta com esse e-mail para aceitar o convite e compartilhar as finanças com você.
            </p>
            <Field label="E-mail do parceiro(a)">
              <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="parceiro@email.com" />
            </Field>
            {inviteError && (
              <div className="mt-3 rounded-xl bg-danger-50 px-4 py-3 text-sm text-danger-700 dark:bg-danger-900/30 dark:text-danger-300">
                {inviteError}
              </div>
            )}
          </>
        )}
      </Modal>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Excluir conta"
        footer={<><Button variant="secondary" onClick={() => setConfirmDelete(false)}>Cancelar</Button><Button variant="danger" onClick={deleteAccount}>Excluir tudo</Button></>}>
        <div className="flex items-start gap-3">
          <Shield size={22} className="text-danger-600 shrink-0" />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Tem certeza? Todos os seus dados financeiros serão apagados permanentemente. Esta ação não pode ser desfeita.
          </p>
        </div>
      </Modal>

      <Modal open={confirmLeave} onClose={() => setConfirmLeave(false)} title="Desconectar casal"
        footer={<><Button variant="secondary" onClick={() => setConfirmLeave(false)}>Cancelar</Button><Button variant="danger" onClick={handleLeave} disabled={actionLoading}>{actionLoading ? 'Desconectando...' : 'Desconectar'}</Button></>}>
        <div className="flex items-start gap-3">
          <HeartCrack size={22} className="text-danger-600 shrink-0" />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {couple?.status === 'pending'
              ? 'Deseja cancelar o convite pendente? Seu parceiro(a) não poderá aceitá-lo depois.'
              : 'Tem certeza que deseja desconectar? Vocês deixarão de compartilhar as finanças. Os dados já cadastrados não serão perdidos, apenas não serão mais visíveis um para o outro.'}
          </p>
        </div>
      </Modal>
    </div>
  );
}
