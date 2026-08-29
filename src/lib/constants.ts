export const REVENUE_CATEGORIES = [
  'Salário',
  'Freelance',
  'Fotografia',
  'Desenvolvimento de sites',
  'Vendas',
  'Reembolso',
  'Outros',
];

export const EXPENSE_CATEGORIES = [
  'Mercado',
  'Alimentação',
  'Combustível',
  'Transporte',
  'Farmácia',
  'Saúde',
  'Lazer',
  'Roupas',
  'Casa',
  'Assinaturas',
  'Educação',
  'Presentes',
  'Viagens',
  'Manutenção',
  'Outros',
];

export const FIXED_BILL_CATEGORIES = [
  'Nubank',
  'Casa',
  'Condomínio',
  'Luz',
  'Internet',
  'Empréstimo',
  'Carro',
  'Caixa',
  'Inter',
  'Renner',
  'Máquina',
  'Outros',
];

export const PAYMENT_METHODS = [
  'Dinheiro',
  'Pix',
  'Débito',
  'Crédito',
  'Boleto',
  'Transferência',
  'TED',
  'Outros',
];

export const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  atrasado: 'Atrasado',
  parcialmente_pago: 'Parcialmente pago',
  cancelado: 'Cancelado',
};

export const STATUS_COLORS: Record<string, string> = {
  pendente: 'amber',
  pago: 'emerald',
  atrasado: 'red',
  parcialmente_pago: 'blue',
  cancelado: 'slate',
};

export const PRIORITY_LABELS: Record<string, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
};

export const CARD_COLORS = [
  { name: 'Azul', value: '#1e3a8a' },
  { name: 'Roxo', value: '#7c3aed' },
  { name: 'Verde', value: '#059669' },
  { name: 'Vermelho', value: '#dc2626' },
  { name: 'Laranja', value: '#ea580c' },
  { name: 'Cinza', value: '#475569' },
  { name: 'Rosa', value: '#db2777' },
  { name: 'Ciano', value: '#0891b2' },
];

export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export const MONTH_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
