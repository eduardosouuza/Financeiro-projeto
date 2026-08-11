import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import type { Couple, CoupleMember, Profile } from '@/lib/types';

type PartnerInfo = {
  userId: string;
  fullName: string;
  email: string;
};

type CoupleContextValue = {
  couple: Couple | null;
  members: CoupleMember[];
  partner: PartnerInfo | null;
  loading: boolean;
  invitePartner: (email: string) => Promise<{ error: string | null }>;
  acceptInvite: () => Promise<{ error: string | null }>;
  declineInvite: () => Promise<{ error: string | null }>;
  leaveCouple: () => Promise<{ error: string | null }>;
  refresh: () => Promise<void>;
};

const CoupleContext = createContext<CoupleContextValue | undefined>(undefined);

export function CoupleProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [couple, setCouple] = useState<Couple | null>(null);
  const [members, setMembers] = useState<CoupleMember[]>([]);
  const [partner, setPartner] = useState<PartnerInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCouple = useCallback(async () => {
    if (!user) {
      setCouple(null);
      setMembers([]);
      setPartner(null);
      setLoading(false);
      return;
    }

    const { data: memberData } = await supabase
      .from('couple_members')
      .select('*, couples!couple_members_couple_id_fkey(*)')
      .eq('user_id', user.id);

    if (!memberData || memberData.length === 0) {
      setCouple(null);
      setMembers([]);
      setPartner(null);
      setLoading(false);
      return;
    }

    const c = (memberData[0] as unknown as { couples: Couple }).couples;
    setCouple(c);

    const { data: allMembers } = await supabase
      .from('couple_members')
      .select('*')
      .eq('couple_id', c.id);
    setMembers(allMembers as CoupleMember[] ?? []);

    // Find partner
    const partnerMember = (allMembers as CoupleMember[])?.find((m) => m.user_id !== user.id);
    if (partnerMember) {
      const { data: partnerProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', partnerMember.user_id)
        .maybeSingle();
      const pp = partnerProfile as Profile | null;
      setPartner({
        userId: partnerMember.user_id,
        fullName: pp?.full_name ?? 'Parceiro(a)',
        email: '',
      });
    } else {
      setPartner(null);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadCouple();
  }, [loadCouple]);

  const invitePartner = async (email: string): Promise<{ error: string | null }> => {
    if (!user || !profile) return { error: 'Não autenticado' };
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail === user.email?.toLowerCase()) {
      return { error: 'Você não pode convidar a si mesmo.' };
    }

    // Check if already in a couple
    if (couple) return { error: 'Você já está em um casal.' };

    // Create couple + add self as inviter
    const { data: newCouple, error: coupleErr } = await supabase
      .from('couples')
      .insert({ status: 'pending', invited_email: normalizedEmail })
      .select()
      .single();
    if (coupleErr) return { error: coupleErr.message };

    const { error: memberErr } = await supabase
      .from('couple_members')
      .insert({ couple_id: (newCouple as Couple).id, user_id: user.id, role: 'inviter' });
    if (memberErr) return { error: memberErr.message };

    // Save partner email on profile
    await supabase.from('profiles').update({ partner_email: normalizedEmail }).eq('id', user.id);

    await loadCouple();
    return { error: null };
  };

  const acceptInvite = async (): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Não autenticado' };

    // Find pending couple where invited_email matches user's email
    const { data: pendingCouples } = await supabase
      .from('couples')
      .select('*')
      .eq('invited_email', user.email ?? '')
      .eq('status', 'pending');

    if (!pendingCouples || pendingCouples.length === 0) {
      return { error: 'Nenhum convite pendente encontrado.' };
    }

    const c = pendingCouples[0] as Couple;

    // Add self as invitee
    const { error: memberErr } = await supabase
      .from('couple_members')
      .insert({ couple_id: c.id, user_id: user.id, role: 'invitee' });
    if (memberErr) return { error: memberErr.message };

    // Activate couple
    await supabase.from('couples').update({ status: 'active' }).eq('id', c.id);

    await loadCouple();
    return { error: null };
  };

  const declineInvite = async (): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Não autenticado' };

    const { data: pendingCouples } = await supabase
      .from('couples')
      .select('*')
      .eq('invited_email', user.email ?? '')
      .eq('status', 'pending');

    if (!pendingCouples || pendingCouples.length === 0) {
      return { error: 'Nenhum convite pendente encontrado.' };
    }

    const c = pendingCouples[0] as Couple;
    await supabase.from('couples').update({ status: 'declined' }).eq('id', c.id);

    await loadCouple();
    return { error: null };
  };

  const leaveCouple = async (): Promise<{ error: string | null }> => {
    if (!user || !couple) return { error: 'Sem casal para sair' };

    // Remove self from couple_members
    await supabase.from('couple_members').delete().eq('couple_id', couple.id).eq('user_id', user.id);
    // Set couple to declined (or it will be deleted via cascade if both leave)
    await supabase.from('couples').update({ status: 'declined' }).eq('id', couple.id);
    // Clear partner email
    await supabase.from('profiles').update({ partner_email: '' }).eq('id', user.id);

    await loadCouple();
    return { error: null };
  };

  return (
    <CoupleContext.Provider
      value={{ couple, members, partner, loading, invitePartner, acceptInvite, declineInvite, leaveCouple, refresh: loadCouple }}
    >
      {children}
    </CoupleContext.Provider>
  );
}

export function useCouple() {
  const ctx = useContext(CoupleContext);
  if (!ctx) throw new Error('useCouple must be used within CoupleProvider');
  return ctx;
}
