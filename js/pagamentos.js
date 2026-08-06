// let pagamentos = []; // Array global de pagamentos
// let parcelas = [];   // Array global de parcelas

/**
 * ESTRUTURA:
 * 
 * Tabela "pagamentos" (Supabase):
 *   - id (PK)
 *   - pedido_id (FK → pedidos.id)
 *   - tipo ("PIX", "CREDITO", "DINHEIRO")
 *   - valor_total (número)
 *   - status ("Pendente", "Parcial", "Completo", "Atrasado")
 *   - data_criacao (timestamp)
 *   - observacoes (texto opcional)
 *
 * Tabela "parcelas" (Supabase):
 *   - id (PK)
 *   - pagamento_id (FK → pagamentos.id)
 *   - numero (ex: 1, 2, 3...)
 *   - valor (número)
 *   - data_vencimento (data)
 *   - data_pagamento (data, nullable)
 *   - status ("Pendente", "Pago", "Atrasado")
 *   - forma ("PIX", "CREDITO", "DINHEIRO")
 *   - observacoes (texto opcional)
 */

// ================= RENDERIZAÇÃO DE PAGAMENTOS NO PEDIDO =================

function renderPagamentosNoPedido(pedidoId) {
    const container = document.getElementById(`pagamentos-pedido-${pedidoId}`);
    if (!container) return;

    const pagtosPedido = pagamentos.filter(p => p.pedido_id === pedidoId);
    if (pagtosPedido.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <p class="text-xs text-slate-400 mb-3">Nenhum pagamento registrado</p>
                <button onclick="openPagamentoModal(${pedidoId})" class="btn-small btn-primary">
                    <i data-lucide="plus" class="w-3 h-3"></i> Registrar Pagamento
                </button>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    let html = '<div class="space-y-3">';
    pagtosPedido.forEach(pgto => {
        const parcPagto = parcelas.filter(p => p.pagamento_id === pgto.id);
        const totalRecebido = parcPagto
            .filter(p => p.data_pagamento)
            .reduce((acc, p) => acc + p.valor, 0);
        const faltaReceber = pgto.valor_total - totalRecebido;
        const percentual = (totalRecebido / pgto.valor_total) * 100;

        const statusColor = {
            'Completo': 'bg-emerald-100 text-emerald-700',
            'Parcial': 'bg-amber-100 text-amber-700',
            'Pendente': 'bg-slate-100 text-slate-700',
            'Atrasado': 'bg-red-100 text-red-700'
        };

        html += `
            <div class="bg-white border border-slate-200 rounded-lg p-3">
                <div class="flex items-center justify-between mb-2">
                    <div>
                        <p class="text-xs font-semibold text-slate-700">
                            ${pgto.tipo === 'CREDITO' ? '💳 Crédito' : pgto.tipo === 'PIX' ? '📱 PIX' : '💵 Dinheiro'}
                        </p>
                        <p class="text-2xs text-slate-500">${new Date(pgto.data_criacao).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <span class="px-2 py-1 rounded text-2xs font-bold ${statusColor[pgto.status] || ''}">${pgto.status}</span>
                </div>
                
                <div class="mb-2">
                    <div class="flex items-center justify-between text-xs mb-1">
                        <span class="text-slate-600">Recebido: <strong>${fmtMoeda(totalRecebido)}</strong></span>
                        <span class="text-slate-600">Falta: <strong class="${faltaReceber > 0 ? 'text-amber-600' : 'text-emerald-600'}">${fmtMoeda(faltaReceber)}</strong></span>
                    </div>
                    <div class="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div class="bg-accent-500 h-2 rounded-full transition-all" style="width:${percentual}%"></div>
                    </div>
                    <p class="text-2xs text-slate-400 mt-1">${percentual.toFixed(0)}% do total</p>
                </div>

                ${parcPagto.length > 0 ? `
                    <div class="space-y-1 mb-2 max-h-20 overflow-y-auto border-t pt-2">
                        ${parcPagto.map((parc, idx) => `
                            <div class="flex items-center justify-between text-2xs bg-slate-50 p-1.5 rounded">
                                <span>Parcela ${parc.numero}: ${fmtMoeda(parc.valor)}</span>
                                ${parc.data_pagamento 
                                    ? `<span class="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">Pago em ${new Date(parc.data_pagamento).toLocaleDateString('pt-BR')}</span>`
                                    : `<span class="px-1.5 py-0.5 rounded ${parc.status === 'Atrasado' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}">${parc.status}</span>`
                                }
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                <div class="flex items-center gap-1 justify-end pt-2 border-t">
                    <button onclick="openPagamentoModal(${pedidoId}, ${pgto.id})" class="icon-btn text-accent-600 text-xs" title="Editar">
                        <i data-lucide="pencil" class="w-3 h-3"></i> Editar
                    </button>
                    <button onclick="registrarParcela(${pgto.id})" class="icon-btn text-emerald-600 text-xs" title="Registrar Pagamento">
                        <i data-lucide="plus-circle" class="w-3 h-3"></i> Pagar
                    </button>
                    <button onclick="deletePagamento(${pgto.id})" class="icon-btn text-red-600 text-xs" title="Excluir">
                        <i data-lucide="trash-2" class="w-3 h-3"></i>
                    </button>
                </div>
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
    lucide.createIcons();
}

// ================= MODAL DE PAGAMENTO =================

function openPagamentoModal(pedidoId, pagamentoId = null) {
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (!pedido) return;

    const form = document.getElementById('form-pagamento');
    form.reset();

    document.getElementById('pgto-pedido-id').value = pedidoId;
    document.getElementById('pgto-pedido-info').innerText = `Pedido #${pedido.id} - ${pedido.cliente} | Total: ${fmtMoeda(pedido.total)}`;

    // Calcula quanto já foi pago
    const pagtosPedido = pagamentos.filter(p => p.pedido_id === pedidoId);
    let totalPago = 0;
    pagtosPedido.forEach(p => {
        const parcPagtas = parcelas.filter(pc => pc.pagamento_id === p.id && pc.data_pagamento);
        totalPago += parcPagtas.reduce((acc, pc) => acc + pc.valor, 0);
    });
    const faltaPagar = Math.max(0, pedido.total - totalPago);

    document.getElementById('pgto-falta-pagar').innerText = `Falta pagar: ${fmtMoeda(faltaPagar)}`;

    if (pagamentoId) {
        // Editar pagamento existente
        const pgto = pagamentos.find(p => p.id === pagamentoId);
        if (!pgto) return;

        document.getElementById('modal-pagamento-title').innerText = 'Editar Pagamento';
        document.getElementById('btn-salvar-pagamento').innerText = 'Atualizar Pagamento';
        document.getElementById('pgto-edit-id').value = pgto.id;
        document.getElementById('pgto-tipo').value = pgto.tipo;
        document.getElementById('pgto-valor').value = pgto.valor_total;
        document.getElementById('pgto-observacoes').value = pgto.observacoes || '';

        onChangeTipoPagamento();
    } else {
        // Novo pagamento
        document.getElementById('modal-pagamento-title').innerText = 'Registrar Novo Pagamento';
        document.getElementById('btn-salvar-pagamento').innerText = 'Registrar Pagamento';
        document.getElementById('pgto-edit-id').value = '';
        document.getElementById('pgto-tipo').value = 'PIX';
        document.getElementById('pgto-valor').value = faltaPagar.toFixed(2);
        document.getElementById('pgto-observacoes').value = '';

        onChangeTipoPagamento();
    }

    openModal('modal-pagamento');
}

function onChangeTipoPagamento() {
    const tipo = document.getElementById('pgto-tipo').value;
    const parcelasDiv = document.getElementById('pgto-parcelas-div');
    const sinalsDiv = document.getElementById('pgto-sinais-div');

    parcelasDiv.classList.add('hidden');
    sinalsDiv.classList.add('hidden');

    if (tipo === 'CREDITO') {
        parcelasDiv.classList.remove('hidden');
        atualizarParcelasPagamento();
    } else if (tipo === 'PIX' || tipo === 'DINHEIRO') {
        sinalsDiv.classList.remove('hidden');
    }
}

function atualizarParcelasPagamento() {
    const valor = parseFloat(document.getElementById('pgto-valor').value) || 0;
    const qtdParcelas = parseInt(document.getElementById('pgto-qtd-parcelas').value) || 1;

    const valorParcela = valor / qtdParcelas;
    const dataVencimento = new Date();

    let html = '<p class="text-xs font-semibold text-slate-600 mb-2">Parcelas a criar:</p>';
    html += '<div class="space-y-1 max-h-24 overflow-y-auto">';

    for (let i = 1; i <= qtdParcelas; i++) {
        dataVencimento.setMonth(dataVencimento.getMonth() + 1);
        html += `
            <div class="flex items-center justify-between text-xs bg-slate-50 p-1.5 rounded">
                <span>${i}ª: ${fmtMoeda(valorParcela)}</span>
                <span class="text-slate-400">${dataVencimento.toLocaleDateString('pt-BR')}</span>
            </div>
        `;
    }

    html += '</div>';
    document.getElementById('pgto-parcelas-preview').innerHTML = html;
}

function atualizarSinalPagamento() {
    const valor = parseFloat(document.getElementById('pgto-valor').value) || 0;
    const sinal = parseFloat(document.getElementById('pgto-sinal').value) || 0;
    const restante = valor - sinal;

    document.getElementById('pgto-sinal-preview').innerHTML = `
        <div class="space-y-1">
            <div class="flex items-center justify-between text-xs bg-emerald-50 p-1.5 rounded border border-emerald-200">
                <span>Sinal (entrada):</span>
                <span class="font-bold text-emerald-700">${fmtMoeda(sinal)}</span>
            </div>
            <div class="flex items-center justify-between text-xs bg-amber-50 p-1.5 rounded border border-amber-200">
                <span>Falta receber:</span>
                <span class="font-bold text-amber-700">${fmtMoeda(restante)}</span>
            </div>
        </div>
    `;
}

// ================= SALVAR PAGAMENTO =================

async function salvarPagamento(e) {
    e.preventDefault();

    const editId = document.getElementById('pgto-edit-id').value;
    const pedidoId = parseInt(document.getElementById('pgto-pedido-id').value) || 123;
    const tipo = document.getElementById('pgto-tipo').value;
    const valorTotal = parseFloat(document.getElementById('pgto-valor').value) || 0;
    const observacoes = document.getElementById('pgto-observacoes').value;

    if (valorTotal <= 0) {
        toast('Valor deve ser maior que zero', 'error');
        return;
    }

    setBtnLoading('btn-salvar-pagamento', true);

    try {
        let dadosPagamento = {
            pedido_id: pedidoId,
            tipo: tipo,
            valor_total: valorTotal,
            observacoes: observacoes,
            status: 'Pendente',
            data_criacao: new Date().toISOString()
        };

        let pagamentoId = editId;

        // Salvar ou atualizar pagamento
        if (editId) {
            const { error } = await db.from('pagamentos').update(dadosPagamento).eq('id', editId);
            if (error) throw error;
            toast('Pagamento atualizado!');
        } else {
            const { data, error } = await db.from('pagamentos').insert([dadosPagamento]).select();
            if (error) throw error;
            if (!data || data.length === 0) throw new Error('Falha ao salvar pagamento');
            pagamentoId = data[0].id;
            toast('Pagamento registrado!');
        }

        // Criar parcelas conforme tipo
        if (tipo === 'CREDITO') {
            const qtdParcelas = parseInt(document.getElementById('pgto-qtd-parcelas').value) || 1;
            const valorParcela = valorTotal / qtdParcelas;
            const dataVencimento = new Date();

            // Deletar parcelas antigas se estiver editando
            if (editId) {
                await db.from('parcelas').delete().eq('pagamento_id', editId);
            }

            const novasParcelas = [];
            for (let i = 1; i <= qtdParcelas; i++) {
                dataVencimento.setMonth(dataVencimento.getMonth() + 1);
                novasParcelas.push({
                    pagamento_id: pagamentoId,
                    numero: i,
                    valor: i === qtdParcelas ? valorTotal - (valorParcela * (i - 1)) : valorParcela,
                    data_vencimento: dataVencimento.toISOString().split('T')[0],
                    status: 'Pendente',
                    forma: 'CREDITO'
                });
            }

            const { error: errParcelas } = await db.from('parcelas').insert(novasParcelas);
            if (errParcelas) throw errParcelas;
        } else {
            // PIX ou DINHEIRO com sinal
            const sinal = parseFloat(document.getElementById('pgto-sinal').value) || 0;
            const restante = valorTotal - sinal;

            // Deletar parcelas antigas se estiver editando
            if (editId) {
                await db.from('parcelas').delete().eq('pagamento_id', editId);
            }

            const novasParcelas = [];

            // Parcela 1: Sinal (já pago)
            if (sinal > 0) {
                novasParcelas.push({
                    pagamento_id: pagamentoId,
                    numero: 1,
                    valor: sinal,
                    data_vencimento: new Date().toISOString().split('T')[0],
                    data_pagamento: new Date().toISOString().split('T')[0],
                    status: 'Pago',
                    forma: tipo
                });
            }

            // Parcela 2: Restante (pendente)
            if (restante > 0) {
                const dataVencimentoRestante = new Date();
                dataVencimentoRestante.setDate(dataVencimentoRestante.getDate() + 7); // 7 dias por padrão

                novasParcelas.push({
                    pagamento_id: pagamentoId,
                    numero: sinal > 0 ? 2 : 1,
                    valor: restante,
                    data_vencimento: dataVencimentoRestante.toISOString().split('T')[0],
                    status: 'Pendente',
                    forma: tipo
                });
            }

            if (novasParcelas.length > 0) {
                const { error: errParcelas } = await db.from('parcelas').insert(novasParcelas);
                if (errParcelas) throw errParcelas;
            }
        }

        closeModal('modal-pagamento');
        await loadAllData();
    } catch (err) {
        console.error(err);
        toast('Erro ao salvar pagamento: ' + err.message, 'error');
    } finally {
        setBtnLoading('btn-salvar-pagamento', false);
    }
}

// ================= REGISTRAR PAGAMENTO DE PARCELA =================

function registrarParcela(pagamentoId) {
    const pgto = pagamentos.find(p => p.id === pagamentoId);
    if (!pgto) return;

    const parcPendentes = parcelas.filter(
        p => p.pagamento_id === pagamentoId && p.status === 'Pendente'
    );

    if (parcPendentes.length === 0) {
        toast('Não há parcelas pendentes para este pagamento', 'info');
        return;
    }

    const parc = parcPendentes[0]; // Pega primeira parcela pendente

    const form = document.getElementById('form-registrar-parcela');
    form.reset();

    document.getElementById('regparc-parcela-id').value = parc.id;
    document.getElementById('regparc-parcela-numero').innerText = `Parcela ${parc.numero}`;
    document.getElementById('regparc-parcela-valor').innerText = fmtMoeda(parc.valor);
    document.getElementById('regparc-parcela-vencimento').innerText = new Date(parc.data_vencimento).toLocaleDateString('pt-BR');
    document.getElementById('regparc-data-pagamento').value = new Date().toISOString().split('T')[0];
    document.getElementById('regparc-forma').value = parc.forma;
    document.getElementById('regparc-observacoes').value = '';

    openModal('modal-registrar-parcela');
}

async function confirmarRegistroParcela(e) {
    e.preventDefault();

    const parcelaId = parseInt(document.getElementById('regparc-parcela-id').value);
    const dataPagamento = document.getElementById('regparc-data-pagamento').value;
    const observacoes = document.getElementById('regparc-observacoes').value;

    setBtnLoading('btn-confirmar-parcela', true);

    try {
        const { error } = await db.from('parcelas').update({
            status: 'Pago',
            data_pagamento: dataPagamento,
            observacoes: observacoes
        }).eq('id', parcelaId);

        if (error) throw error;

        toast('Pagamento registrado com sucesso!');
        closeModal('modal-registrar-parcela');
        await loadAllData();
    } catch (err) {
        console.error(err);
        toast('Erro ao registrar pagamento: ' + err.message, 'error');
    } finally {
        setBtnLoading('btn-confirmar-parcela', false);
    }
}

// ================= DELETAR PAGAMENTO =================

async function deletePagamento(pagamentoId) {
    if (!confirm('Tem certeza que deseja excluir este pagamento e todas suas parcelas?')) return;

    try {
        // Deletar parcelas associadas
        await db.from('parcelas').delete().eq('pagamento_id', pagamentoId);

        // Deletar pagamento
        const { error } = await db.from('pagamentos').delete().eq('id', pagamentoId);
        if (error) throw error;

        toast('Pagamento excluído', 'info');
        await loadAllData();
    } catch (err) {
        console.error(err);
        toast('Erro ao deletar pagamento: ' + err.message, 'error');
    }
}

// ================= RELATÓRIO DE PAGAMENTOS PENDENTES =================

// containerId: onde renderizar. limite: corta a lista (usado no card resumido do dashboard).
// Ordena por urgência (atrasados primeiro, depois por dias de atraso desc) para que, ao usar
// limite, sempre apareçam os casos mais críticos primeiro.
function renderPagamentosPendentes(containerId = 'relatorio-pagamentos-container', limite = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let pagtosPendentes = pagamentos.filter(p => p.status !== 'Completo');

    if (pagtosPendentes.length === 0) {
        container.innerHTML = '<p class="text-xs text-slate-400 italic py-4">Sem pagamentos pendentes! 🎉</p>';
        return;
    }

    // Calcula dias de atraso de cada um para poder ordenar por urgência
    const comAtraso = pagtosPendentes.map(pgto => {
        const parcelasNaoPagas = parcelas.filter(p => p.pagamento_id === pgto.id && !p.data_pagamento);
        const proximaParc = parcelasNaoPagas[0];
        const diasAtraso = proximaParc
            ? Math.max(0, Math.floor((new Date() - new Date(proximaParc.data_vencimento)) / (1000 * 60 * 60 * 24)))
            : 0;
        return { pgto, diasAtraso };
    }).sort((a, b) => b.diasAtraso - a.diasAtraso);

    pagtosPendentes = comAtraso.map(x => x.pgto);
    if (limite) pagtosPendentes = pagtosPendentes.slice(0, limite);

    let html = '<div class="space-y-2">';

    pagtosPendentes.forEach(pgto => {
        const pedido = pedidos.find(p => p.id === pgto.pedido_id);
        if (!pedido) return;

        const parcelasNaoPagas = parcelas.filter(
            p => p.pagamento_id === pgto.id && !p.data_pagamento
        );
        const proximaParc = parcelasNaoPagas[0];
        const diasAtraso = proximaParc
            ? Math.max(0, Math.floor((new Date() - new Date(proximaParc.data_vencimento)) / (1000 * 60 * 60 * 24)))
            : 0;

        const statusAtraso = diasAtraso > 0 ? ' ⚠️ ATRASADO' : '';

        html += `
            <div class="bg-white border ${diasAtraso > 0 ? 'border-red-200' : 'border-slate-200'} rounded p-2.5 text-xs">
                <div class="flex items-center justify-between mb-1">
                    <strong>${pedido.cliente} - Pedido #${pedido.id}</strong>
                    <span class="text-2xs font-bold ${diasAtraso > 0 ? 'text-red-600' : 'text-amber-600'}">${statusAtraso || 'Pendente'}</span>
                </div>
                <p class="text-slate-500 mb-1">
                    ${pgto.tipo === 'CREDITO' ? '💳 Crédito' : pgto.tipo === 'PIX' ? '📱 PIX' : '💵 Dinheiro'} |
                    Total: <strong>${fmtMoeda(pgto.valor_total)}</strong> |
                    ${parcelasNaoPagas.length} pendente(s)
                </p>
                ${proximaParc ? `
                    <p class="text-slate-500">
                        Próxima parcela: <strong>${fmtMoeda(proximaParc.valor)}</strong> |
                        Vence em: <strong>${new Date(proximaParc.data_vencimento).toLocaleDateString('pt-BR')}</strong>
                        ${diasAtraso > 0 ? ` | <strong class="text-red-600">${diasAtraso} dia(s) atrasado</strong>` : ''}
                    </p>
                ` : ''}
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}
