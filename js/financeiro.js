        function renderFinanceiro() {
            const tbody = document.getElementById('table-financeiro-body');
            tbody.innerHTML = '';

            const movimentos = [
                ...pedidos.map(p => ({
                    data: p.data,
                    tipo: 'Receita',
                    categoria: 'Vendas',
                    descricao: `Pedido #${p.id} - ${p.cliente}`,
                    valor: p.total,
                    forma: 'PIX / Cartão'
                })),
                ...despesas.map(d => ({
                    data: d.data,
                    tipo: 'Despesa',
                    categoria: d.categoria,
                    descricao: d.descricao,
                    valor: -d.valor,
                    forma: d.forma_pagamento || '-'
                }))
            ].sort((a, b) => parseDataPedido(b.data) - parseDataPedido(a.data));

            if (movimentos.length === 0) {
                tbody.innerHTML = '<tr class="empty-row"><td colspan="6">Nenhuma movimentação registrada ainda.</td></tr>';
                return;
            }

            const receitaTotal = pedidos.reduce((acc, p) => acc + p.total, 0);
            const despesaTotal = despesas.reduce((acc, d) => acc + d.valor, 0);
            document.getElementById('fin-receita-total').innerText = fmtMoeda(receitaTotal);
            document.getElementById('fin-despesa-total').innerText = fmtMoeda(despesaTotal);
            document.getElementById('fin-saldo-total').innerText = fmtMoeda(receitaTotal - despesaTotal);

            movimentos.forEach(m => {
                const isReceita = m.tipo === 'Receita';
                tbody.innerHTML += `
                    <tr class="hover:bg-slate-50">
                        <td class="p-3 card-title">${m.data.split('T')[0].split("-").reverse().join("/")} — ${m.descricao}</td>
                        <td class="p-3" data-label="Data">${m.data.split('T')[0].split("-").reverse().join("/")}</td>
                        <td class="p-3" data-label="Tipo"><span class="px-2 py-0.5 rounded text-2xs font-bold ${isReceita ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}">${m.tipo}</span></td>
                        <td class="p-3" data-label="Categoria">${m.categoria}</td>
                        <td class="p-3" data-label="Descrição">${m.descricao}</td>
                        <td class="p-3 font-bold ${isReceita ? 'text-emerald-600' : 'text-red-600'}" data-label="Valor">${isReceita ? '+' : '-'} R$ ${Math.abs(m.valor).toFixed(2)}</td>
                        <td class="p-3" data-label="Pagamento">${m.forma}</td>
                    </tr>
                `;
            });
        }

        // ================= DESPESAS CRUD =================
        function openDespesaModal() {
            document.getElementById('form-despesa').reset();
            document.getElementById('desp-data').value = new Date().toISOString().split('T')[0];
            openModal('modal-despesa');
        }

        async function salvarDespesa(e) {
            e.preventDefault();
            const dados = {
                data: document.getElementById('desp-data').value,
                categoria: document.getElementById('desp-categoria').value,
                descricao: document.getElementById('desp-descricao').value,
                valor: parseFloat(document.getElementById('desp-valor').value) || 0,
                forma_pagamento: document.getElementById('desp-forma').value
            };
            setBtnLoading('btn-salvar-despesa', true);
            try {
                const { error } = await db.from('despesas').insert([dados]);
                if (error) throw error;
                toast('Despesa registrada com sucesso!');
                closeModal('modal-despesa');
                await loadAllData();
            } catch (err) {
                console.error(err);
                toast('Erro ao salvar despesa: ' + err.message, 'error');
            } finally {
                setBtnLoading('btn-salvar-despesa', false);
            }
        }

        const NOMES_MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

