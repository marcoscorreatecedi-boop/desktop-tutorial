const KEYWORDS = {
  vendas: ['comprar', 'preço', 'preco', 'valor', 'orçamento', 'orcamento', 'produto'],
  suporte: ['problema', 'erro', 'não funciona', 'nao funciona', 'ajuda', 'dúvida', 'duvida'],
  financeiro: ['boleto', 'pagamento', 'nota fiscal', 'fatura', 'cobrança', 'cobranca'],
};

function classifyMessage(text) {
  const lower = (text || '').toLowerCase();
  for (const [category, words] of Object.entries(KEYWORDS)) {
    if (words.some((w) => lower.includes(w))) return category;
  }
  return null;
}

module.exports = { classifyMessage };
