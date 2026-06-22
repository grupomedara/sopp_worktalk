export const INCOME_CATEGORIES = [
    'RECEITA_SALARIO',
    'RECEITA_INVESTIMENTO',
    'RECEITA_VENDA',
    'RECEITA_SERVICO',
    'OUTRA_RECEITA'
];

export const isIncome = (category: string) => INCOME_CATEGORIES.includes(category);
export const isExpense = (category: string) => !isIncome(category);
