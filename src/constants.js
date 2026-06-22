const FUNNEL_STAGES = [
  { id: 'novo_lead', label: 'Novo lead' },
  { id: 'qualificacao', label: 'Qualificação' },
  { id: 'visita_proposta', label: 'Visita / Proposta' },
  { id: 'negociacao', label: 'Negociação' },
  { id: 'ganho', label: 'Ganho' },
  { id: 'perdido', label: 'Perdido' },
];

const SOURCES = [
  { id: 'whatsapp_direto', label: 'WhatsApp direto' },
  { id: 'facebook_ads', label: 'Facebook/Instagram Ads' },
  { id: 'instagram', label: 'Instagram (orgânico)' },
  { id: 'site', label: 'Site' },
  { id: 'indicacao', label: 'Indicação' },
  { id: 'outdoor', label: 'Outdoor/Placa' },
  { id: 'outro', label: 'Outro' },
];

module.exports = { FUNNEL_STAGES, SOURCES };
