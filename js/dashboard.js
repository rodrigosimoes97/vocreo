        function renderDashboard() {
            const agora = new Date();
            const { ini: iniMesAtual, fim: fimMesAtual } = inicioFimMes(agora);
            const mesAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
            const { ini: iniMesAnt, fim: fimMesAnt } = inicioFimMes(mesAnterior);

            const pedidosMesAtual = pedidos.filter(p => {
                const d = parseDataPedido(p.data);
                return d >= iniMesAtual && d <= fimMesAtual;
            });
            const pedidosMesAnterior = pedidos.filter(p => {
                const d = parseDataPedido(p.data);
                return d >= iniMesAnt && d <= fimMesAnt;
            });
            const despesasMesAtual = despesas.filter(d => {
                const dt = parseDataPedido(d.data);
                return dt >= iniMesAtual && dt <= fimMesAtual;
            });

            // ---- Totais gerais (histórico completo) ----
            const receitaTotal = pedidos.reduce((acc, p) => acc + p.total, 0);
            const custoProdutosTotal = pedidos.reduce((acc, p) => acc + p.custo, 0);
            const despesasTotal = despesas.reduce((acc, d) => acc + d.valor, 0);
            const lucroBrutoTotal = receitaTotal - custoProdutosTotal;
            const lucroLiquidoTotal = lucroBrutoTotal - despesasTotal;
            const totalPedidos = pedidos.length;
            const ticketMedio = totalPedidos > 0 ? receitaTotal / totalPedidos : 0;
            const margemLiquida = receitaTotal > 0 ? (lucroLiquidoTotal / receitaTotal) * 100 : 0;

            // ---- Comparativo mês atual x mês anterior ----
            const receitaMesAtual = pedidosMesAtual.reduce((acc, p) => acc + p.total, 0);
            const receitaMesAnterior = pedidosMesAnterior.reduce((acc, p) => acc + p.total, 0);
            const varReceita = receitaMesAnterior > 0
                ? ((receitaMesAtual - receitaMesAnterior) / receitaMesAnterior) * 100
                : (receitaMesAtual > 0 ? 100 : 0);

            const lucroMesAtual = pedidosMesAtual.reduce((acc, p) => acc + p.lucro, 0) - despesasMesAtual.reduce((acc, d) => acc + d.valor, 0);

            // ---- Estoque ----
            const estoqueTotalVal = materiais.reduce((acc, m) => acc + m.estoque, 0);
            const estoqueCriticoCount = materiais.filter(m => m.estoque <= m.min).length;
            const valorEstoqueCusto = materiais.reduce((acc, m) => acc + (m.estoque * m.custo), 0);

            // ---- KPIs principais ----
            document.getElementById('kpi-receita').innerText = fmtMoeda(receitaTotal);
            document.getElementById('kpi-receita-var').innerHTML = varReceita >= 0
                ? `<i data-lucide="trending-up" class="inline w-3 h-3"></i> +${varReceita.toFixed(1)}% vs mês anterior`
                : `<i data-lucide="trending-down" class="inline w-3 h-3"></i> ${varReceita.toFixed(1)}% vs mês anterior`;
            document.getElementById('kpi-receita-var').className = 'text-xs font-medium mt-1 ' + (varReceita >= 0 ? 'text-emerald-600' : 'text-red-500');

            document.getElementById('kpi-lucro').innerText = fmtMoeda(lucroLiquidoTotal);
            document.getElementById('kpi-lucro').className = 'text-2xl font-bold mt-1 ' + (lucroLiquidoTotal >= 0 ? 'text-emerald-600' : 'text-red-600');
            document.getElementById('kpi-margem-lucro').innerText = `Margem líquida: ${margemLiquida.toFixed(1)}% · Mês atual: ${fmtMoeda(lucroMesAtual)}`;

            document.getElementById('kpi-pedidos').innerText = totalPedidos;
            document.getElementById('kpi-ticket').innerText = 'Ticket médio: ' + fmtMoeda(ticketMedio) + ` · ${pedidosMesAtual.length} este mês`;

            document.getElementById('kpi-estoque').innerText = estoqueTotalVal + ' un';
            document.getElementById('kpi-critico').innerText = estoqueCriticoCount > 0
                ? `${estoqueCriticoCount} item(ns) abaixo do mínimo`
                : 'Estoque saudável';
            document.getElementById('kpi-critico').className = 'text-xs font-semibold mt-1 ' + (estoqueCriticoCount > 0 ? 'text-red-500' : 'text-emerald-600');

            // ---- KPIs secundários ----
            document.getElementById('kpi-despesas').innerText = fmtMoeda(despesasTotal);
            document.getElementById('kpi-valor-estoque').innerText = fmtMoeda(valorEstoqueCusto);
            document.getElementById('kpi-clientes-total').innerText = clientes.length;

            // ---- Recebido (caixa) x A Receber ----
            // Soma pedido a pedido usando a mesma lógica do card (getInfoPagamentoPedido),
            // garantindo que o dashboard bata exatamente com o que aparece em cada pedido.
            let totalRecebido = 0;
            let totalAReceber = 0;
            pedidos.forEach(p => {
                const info = getInfoPagamentoPedido(p.id);
                totalRecebido += info.totalPago;
                totalAReceber += info.faltaPagar;
            });
            document.getElementById('kpi-recebido').innerText = fmtMoeda(totalRecebido);
            document.getElementById('kpi-a-receber').innerText = fmtMoeda(totalAReceber);

            renderMetaDashboardWidget(receitaMesAtual);
            renderTopProdutos();
            renderAlertaEstoque();
            renderUltimosPedidos();
        }

        function getMetaAtual() {
            const agora = new Date();
            const mes = agora.getMonth() + 1;
            const ano = agora.getFullYear();
            return metas.find(m => m.mes === mes && m.ano === ano) || null;
        }

        function renderMetaDashboardWidget(receitaMesAtual) {
            const el = document.getElementById('dash-meta-widget');
            if (!el) return;
            const meta = getMetaAtual();
            const metaValor = meta ? meta.meta_receita : 0;
            const perc = metaValor > 0 ? Math.min((receitaMesAtual / metaValor) * 100, 100) : 0;
            if (!meta || metaValor <= 0) {
                el.innerHTML = `<p class="text-xs text-slate-400 italic">Nenhuma meta definida para este mês. Configure na aba <b>Metas</b>.</p>`;
                return;
            }
            el.innerHTML = `
                <div class="flex justify-between text-xs font-semibold mb-1.5">
                    <span class="text-slate-600">${fmtMoeda(receitaMesAtual)} de ${fmtMoeda(metaValor)}</span>
                    <span class="${perc >= 100 ? 'text-emerald-600' : 'text-accent-600'}">${perc.toFixed(1)}%</span>
                </div>
                <div class="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div class="h-2.5 rounded-full transition-all duration-500 ${perc >= 100 ? 'bg-brand-green' : 'bg-accent-500'}" style="width:${perc}%"></div>
                </div>
            `;
        }

        function renderTopProdutos() {
            const el = document.getElementById('dash-top-produtos');
            if (!el) return;
            const vendasPorProduto = {};
            pedidos.forEach(p => (p.itens || []).forEach(i => {
                if (!vendasPorProduto[i.produto_nome]) vendasPorProduto[i.produto_nome] = { qtd: 0, total: 0 };
                vendasPorProduto[i.produto_nome].qtd += i.qtd;
                vendasPorProduto[i.produto_nome].total += i.qtd * i.preco_unit;
            }));
            const top = Object.entries(vendasPorProduto).sort((a, b) => b[1].total - a[1].total).slice(0, 5);
            if (top.length === 0) {
                el.innerHTML = '<p class="text-xs text-slate-400 italic py-2">Nenhuma venda registrada ainda.</p>';
                return;
            }
            const maxTotal = top[0][1].total;
            el.innerHTML = top.map(([nome, d], idx) => `
                <div class="flex items-center gap-3">
                    <span class="text-2xs font-bold text-slate-400 w-4">${idx + 1}º</span>
                    <div class="flex-1 min-w-0">
                        <div class="flex justify-between text-xs mb-1">
                            <span class="font-semibold text-slate-700 truncate pr-2">${nome}</span>
                            <span class="text-slate-500 flex-shrink-0">${d.qtd} un · ${fmtMoeda(d.total)}</span>
                        </div>
                        <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div class="bg-accent-500 h-1.5 rounded-full" style="width:${(d.total / maxTotal) * 100}%"></div>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        function renderAlertaEstoque() {
            const el = document.getElementById('dash-alerta-estoque');
            if (!el) return;
            const criticos = materiais.filter(m => m.estoque <= m.min).sort((a, b) => a.estoque - b.estoque);
            if (criticos.length === 0) {
                el.innerHTML = '<p class="text-xs text-slate-400 italic py-2">Nenhum material abaixo do estoque mínimo. 🎉</p>';
                return;
            }
            el.innerHTML = criticos.slice(0, 5).map(m => `
                <div class="flex items-center justify-between gap-1 py-1.5">
                    <div class="min-w-0">
                        <p class="text-xs font-semibold text-slate-700 truncate">${m.tipo} ${m.modelo} ${m.cor} - ${m.tamanho}</p>
                        <p class="text-2xs text-slate-400">${m.sku}</p>
                    </div>
                    <span class="flex-shrink-0 px-2 py-1 rounded-full text-2xs font-bold bg-red-100 text-red-700">${m.estoque} un</span>
                </div>
            `).join('');
        }

        function renderUltimosPedidos() {
            const el = document.getElementById('dash-ultimos-pedidos');
            if (!el) return;
            const ultimos = [...pedidos].sort((a, b) => b.id - a.id).slice(0, 5);
            if (ultimos.length === 0) {
                el.innerHTML = '<tr class="empty-row"><td colspan="5">Nenhum pedido cadastrado ainda.</td></tr>';
                return;
            }
            const statusBg = s => s === 'Entregue' ? 'bg-emerald-100 text-emerald-800' : s === 'Produção' ? 'bg-amber-100 text-amber-800' : 'bg-violet-100 text-violet-700';
            el.innerHTML = ultimos.map(p => {
                const infoPgto = getInfoPagamentoPedido(p.id);
                const faltaHtml = infoPgto.faltaPagar > 0.009
                    ? `<span class="text-2xs font-bold ${infoPgto.atrasado ? 'text-red-600' : 'text-amber-600'}">Falta ${fmtMoeda(infoPgto.faltaPagar)}</span>`
                    : `<span class="text-2xs font-bold text-emerald-600">Pago ✓</span>`;
                return `
                <tr class="hover:bg-slate-50 cursor-pointer" onclick="switchTab('pedidos')">
                    <td class="p-2.5 font-semibold text-slate-700">${p.cliente}</td>
                    <td class="p-2.5 text-slate-500">${p.data.split('T')[0].split('-').reverse().join('/')}</td>
                    <td class="p-2.5 font-bold text-slate-800">${fmtMoeda(p.total)}</td>
                    <td class="p-2.5">${renderTimelineCompactaStatus(p.status)}</td>
                    <td class="p-2.5">${faltaHtml}</td>
                </tr>
            `;
            }).join('');
        }
        // <td class="p-2.5"><span class="px-2 py-0.5 rounded-full text-2xs font-bold ${statusBg(p.status)}">${p.status}</span></td>



        // ===== Gráficos (usados no Dashboard) =====
        function renderCharts() {
            const catTotals = {};
            const prodTotals = {};

            pedidos.forEach(p => {
                (p.itens || []).forEach(item => {
                    const cat = item.categoria || 'Outros';
                    catTotals[cat] = (catTotals[cat] || 0) + (item.preco_unit * item.qtd);
                    prodTotals[item.produto_nome] = (prodTotals[item.produto_nome] || 0) + item.qtd;
                });
            });

            const catCtx = document.getElementById('chartCategoria').getContext('2d');
            if (chartCatInstance) chartCatInstance.destroy();
            chartCatInstance = new Chart(catCtx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(catTotals),
                    datasets: [{
                        data: Object.values(catTotals),
                        backgroundColor: ['#FF5A36', '#16A34A', '#7C5CFC', '#F59E0B']
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });

            const prodCtx = document.getElementById('chartProdutos').getContext('2d');
            if (chartProdInstance) chartProdInstance.destroy();
            chartProdInstance = new Chart(prodCtx, {
                type: 'bar',
                data: {
                    labels: Object.keys(prodTotals),
                    datasets: [{
                        label: 'Unidades Vendidas',
                        data: Object.values(prodTotals),
                        backgroundColor: '#221F2E'
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });

            // ---- Evolução dos últimos 6 meses (Receita vs Lucro Líquido) ----
            const evoEl = document.getElementById('chartEvolucao');
            if (evoEl) {
                const agora = new Date();
                const meses = [];
                for (let i = 5; i >= 0; i--) {
                    meses.push(new Date(agora.getFullYear(), agora.getMonth() - i, 1));
                }
                const labels = meses.map(m => NOMES_MESES[m.getMonth()].slice(0, 3) + '/' + String(m.getFullYear()).slice(2));
                const receitaPorMes = meses.map(m => {
                    const { ini, fim } = inicioFimMes(m);
                    return pedidos.filter(p => { const d = parseDataPedido(p.data); return d >= ini && d <= fim; })
                        .reduce((acc, p) => acc + p.total, 0);
                });
                const lucroPorMes = meses.map((m, idx) => {
                    const { ini, fim } = inicioFimMes(m);
                    const lucroBruto = pedidos.filter(p => { const d = parseDataPedido(p.data); return d >= ini && d <= fim; })
                        .reduce((acc, p) => acc + p.lucro, 0);
                    const despesaMes = despesas.filter(d => { const dt = parseDataPedido(d.data); return dt >= ini && dt <= fim; })
                        .reduce((acc, d) => acc + d.valor, 0);
                    return lucroBruto - despesaMes;
                });

                const evoCtx = evoEl.getContext('2d');
                if (chartEvolucaoInstance) chartEvolucaoInstance.destroy();
                chartEvolucaoInstance = new Chart(evoCtx, {
                    type: 'line',
                    data: {
                        labels,
                        datasets: [
                            { label: 'Receita', data: receitaPorMes, borderColor: '#FF5A36', backgroundColor: 'rgba(255,90,54,.1)', tension: 0.35, fill: true },
                            { label: 'Lucro Líquido', data: lucroPorMes, borderColor: '#16A34A', backgroundColor: 'rgba(22,163,74,.08)', tension: 0.35, fill: true }
                        ]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } } },
                        scales: { y: { ticks: { callback: v => 'R$ ' + v } } }
                    }
                });
            }
        }

