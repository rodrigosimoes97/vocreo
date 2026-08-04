        function renderRelatorios() {
            const container = document.getElementById('relatorio-categoria-container');
            const catMap = {};
            pedidos.forEach(p => {
                (p.itens || []).forEach(item => {
                    const cat = item.categoria || 'Geral';
                    if (!catMap[cat]) catMap[cat] = { total: 0, qtd: 0, custo: 0 };
                    catMap[cat].total += item.preco_unit * item.qtd;
                    catMap[cat].custo += item.custo_unit * item.qtd;
                    catMap[cat].qtd += item.qtd;
                });
            });

            if (Object.keys(catMap).length === 0) {
                container.innerHTML = '<p class="text-xs text-slate-400 italic">Nenhum dado disponível ainda.</p>';
            } else {
                let html = `<table class="w-full text-left text-xs text-slate-600 border"><thead class="bg-slate-100"><tr><th class="p-2">Categoria</th><th class="p-2">Qtd Vendida</th><th class="p-2">Faturamento</th><th class="p-2">Lucro Bruto</th><th class="p-2">Margem</th></tr></thead><tbody>`;
                Object.keys(catMap).forEach(cat => {
                    const c = catMap[cat];
                    const lucro = c.total - c.custo;
                    const margem = c.total > 0 ? (lucro / c.total) * 100 : 0;
                    html += `<tr class="border-t"><td class="p-2 font-semibold">${cat}</td><td class="p-2">${c.qtd} un</td><td class="p-2 font-bold text-slate-800">${fmtMoeda(c.total)}</td><td class="p-2 font-bold text-emerald-600">${fmtMoeda(lucro)}</td><td class="p-2">${margem.toFixed(1)}%</td></tr>`;
                });
                html += `</tbody></table>`;
                container.innerHTML = html;
            }

            // Resumo financeiro geral
            const resumoEl = document.getElementById('relatorio-resumo-container');
            if (resumoEl) {
                const receitaTotal = pedidos.reduce((acc, p) => acc + p.total, 0);
                const custoTotal = pedidos.reduce((acc, p) => acc + p.custo, 0);
                const despesaTotal = despesas.reduce((acc, d) => acc + d.valor, 0);
                const lucroLiquido = receitaTotal - custoTotal - despesaTotal;
                resumoEl.innerHTML = `
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div class="bg-slate-50 rounded-lg p-3 border border-slate-200"><p class="text-2xs text-slate-400 uppercase font-bold">Receita</p><p class="text-sm font-bold text-slate-800">${fmtMoeda(receitaTotal)}</p></div>
                        <div class="bg-slate-50 rounded-lg p-3 border border-slate-200"><p class="text-2xs text-slate-400 uppercase font-bold">Custo Produtos</p><p class="text-sm font-bold text-slate-800">${fmtMoeda(custoTotal)}</p></div>
                        <div class="bg-slate-50 rounded-lg p-3 border border-slate-200"><p class="text-2xs text-slate-400 uppercase font-bold">Despesas</p><p class="text-sm font-bold text-red-600">${fmtMoeda(despesaTotal)}</p></div>
                        <div class="bg-slate-50 rounded-lg p-3 border border-slate-200"><p class="text-2xs text-slate-400 uppercase font-bold">Lucro Líquido</p><p class="text-sm font-bold ${lucroLiquido >= 0 ? 'text-emerald-600' : 'text-red-600'}">${fmtMoeda(lucroLiquido)}</p></div>
                    </div>
                `;
            }
        }

