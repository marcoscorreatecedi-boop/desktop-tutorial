const STAGES = ['novo', 'qualificando', 'interessado', 'negociacao', 'fechado', 'perdido'];

const STAGE_LABELS = {
  novo: 'Novo contato',
  qualificando: 'Qualificando',
  interessado: 'Interessado',
  negociacao: 'Em negociação',
  fechado: 'Fechado (ganho)',
  perdido: 'Perdido',
};

module.exports = { STAGES, STAGE_LABELS };
