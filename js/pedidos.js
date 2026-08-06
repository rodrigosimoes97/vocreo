// ================= STATUS DE PEDIDO (fonte única, usada em toda a tela de pedidos) =================
const STATUS_PEDIDO = ['Produção', 'Aguardando', 'Pronto', 'Enviado', 'Entregue'];
const STATUS_ICONS = {
    'Produção': 'hammer',
    'Aguardando': 'clock',
    'Pronto': 'package-check',
    'Enviado': 'truck',
    'Entregue': 'check-check'
};

function renderTimelineCompactaStatus(statusAtual) {
    const STATUS_COLORS = {
        'Produção': 'bg-amber-100 text-amber-600',
        'Aguardando': 'bg-blue-100 text-blue-600',
        'Pronto': 'bg-violet-100 text-violet-600',
        'Enviado': 'bg-cyan-100 text-cyan-600',
        'Entregue': 'bg-emerald-100 text-emerald-600'
    };

    const currentIdx = STATUS_PEDIDO.indexOf(statusAtual);
    const html = `
                <div class="flex items-center gap-1">
                    ${STATUS_PEDIDO.map((s, i) => {
        const isDone = i <= currentIdx;
        const isCurrent = i === currentIdx;
        const bgClass = isDone ? STATUS_COLORS[s] : 'bg-slate-100 text-slate-400';
        return `
                            <div class="flex flex-col items-center gap-0.5">
                                <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${bgClass} ${isCurrent ? 'ring-2 ring-offset-1 ring-slate-300' : ''}">
                                    <i data-lucide="${STATUS_ICONS[s]}" class="w-3 h-3"></i>
                                </div>
                            </div>
                            ${i < STATUS_PEDIDO.length - 1 ? `<div class="h-0.5 w-2 ${isDone ? 'bg-emerald-400' : 'bg-slate-200'}"></div>` : ''}
                        `;
    }).join('')}
                </div>
            `;
    return html;
}

function renderTimelineStatus(pedidoId, statusAtual) {
    const idxAtual = STATUS_PEDIDO.indexOf(statusAtual);

    let html = '<div class="flex items-start w-full max-w-[280px]">';
    STATUS_PEDIDO.forEach((st, idx) => {
        const preenchida = idx <= idxAtual;
        const ehAtual = idx === idxAtual;
        const cor = preenchida ? 'bg-brand-green border-brand-green text-white' : 'bg-white border-slate-300 text-slate-300';
        const anel = ehAtual ? 'ring-2 ring-offset-1 ring-brand-green' : '';
        if (idx > 0) {
            const linhaPreenchida = idx <= idxAtual;
            html += `<div class="h-0.5 flex-1 mt-3 ${linhaPreenchida ? 'bg-brand-green' : 'bg-slate-200'}"></div>`;
        }
        html += `
                    <button type="button"
                        onclick="avancarStatusPedido(${pedidoId}, '${st}')"
                        title="Marcar como ${st}"
                        class="relative flex flex-col items-center gap-1 group flex-shrink-0">
                        <span class="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${cor} ${anel} group-hover:scale-110">
                            <i data-lucide="${STATUS_ICONS[st]}" class="w-3 h-3"></i>
                        </span>
                        <span class="text-[9px] font-semibold leading-none text-center ${preenchida ? 'text-slate-700' : 'text-slate-400'} whitespace-nowrap">${st}</span>
                    </button>
                `;
    });
    html += '</div>';
    return html;
}

async function avancarStatusPedido(id, novoStatus) {
    const pedido = pedidos.find(p => p.id === id);
    if (!pedido || pedido.status === novoStatus) return;
    try {
        const { error } = await db.from('pedidos').update({ status: novoStatus }).eq('id', id);
        if (error) throw error;
        pedido.status = novoStatus;
        toast(`Pedido #${id} agora está: ${novoStatus}`);
        renderPedidos();
        renderDashboard();
        lucide.createIcons();
    } catch (err) {
        console.error(err);
        toast('Erro ao atualizar status: ' + err.message, 'error');
    }
}

function renderPedidos() {
    const grid = document.getElementById('grid-pedidos');
    grid.innerHTML = '';

    const searchInput = document.getElementById('pedidos-search-input');
    const statusFilter = document.getElementById('pedidos-status-filter');
    const termoBusca = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const statusSelecionado = statusFilter ? statusFilter.value : '';

    const pedidosFiltrados = pedidos.filter(p => {
        const passaBusca = !termoBusca || (p.cliente || '').toLowerCase().includes(termoBusca);
        const passaStatus = !statusSelecionado || p.status === statusSelecionado;
        return passaBusca && passaStatus;
    });

    if (pedidos.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center text-slate-400 text-xs py-10 bg-white rounded-2xl border border-dashed border-slate-200">Nenhum pedido cadastrado ainda. Clique em "+" para começar.</div>';
        return;
    }

    if (pedidosFiltrados.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center text-slate-400 text-xs py-10 bg-white rounded-2xl border border-dashed border-slate-200">Nenhum pedido encontrado com esse filtro.</div>';
        return;
    }

    pedidosFiltrados.forEach(p => {
        const statusBg = p.status === 'Entregue' ? 'bg-emerald-100 text-emerald-800' : p.status === 'Produção' ? 'bg-amber-100 text-amber-800' : 'bg-violet-100 text-violet-700';

        const itens = p.itens || [];
        const totalQtdItens = itens.reduce((acc, i) => acc + i.qtd, 0);

        // Fotos das estampas dos itens (até 4 no preview do card)
        const fotosItens = itens.filter(i => i.foto_url);
        let fotosHtml = '';
        if (fotosItens.length > 0) {
            fotosHtml = `<div class="flex -space-x-2 mb-2">` +
                fotosItens.slice(0, 4).map(i => `<img src="${i.foto_url}" alt="${i.produto_nome}" title="${i.produto_nome}" class="w-10 h-10 rounded-lg object-cover border-2 border-white shadow-sm">`).join('') +
                (fotosItens.length > 4 ? `<div class="w-10 h-10 rounded-lg bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center text-2xs font-bold text-slate-600">+${fotosItens.length - 4}</div>` : '') +
                `</div>`;
        } else {
            fotosHtml = `<div class="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300 mb-2"><i data-lucide="image" class="w-4 h-4"></i></div>`;
        }

        const resumoProdutos = itens.map(i => `${i.qtd}x ${i.produto_nome} (${i.tamanho})`).join(', ') || 'Nenhum item';

        const bordaPagamento = getBordaCardPedido(p.id);

        grid.innerHTML += `
                    <div class="bg-white rounded-2xl border-2 ${bordaPagamento} shadow-sm p-4 flex flex-col gap-2 hover:shadow-md transition text-xs">
                        <div class="flex items-start justify-between gap-2">
                            <div>
                                <p class="font-bold text-slate-800 text-sm">#${p.id} — ${p.cliente}</p>
                                <p class="text-slate-400 text-2xs">${p.data.split(" ")[0].split("-").reverse().join("/")}${p.cidade ? ' • ' + p.cidade : ''}</p>
                            </div>
                            <span class="px-2 py-1 rounded-full text-2xs font-bold w-fit whitespace-nowrap ${statusBg}">${p.status}</span>
                        </div>

                        ${fotosHtml}

                        <p class="text-slate-600 leading-snug line-clamp-2" title="${resumoProdutos}">${resumoProdutos}</p>

                        <div class="flex items-center justify-between pt-1 border-t border-slate-100 mt-1">
                            <span class="text-slate-500">Itens: <span class="font-bold text-slate-700">${totalQtdItens}</span></span>
                            <span class="font-bold text-slate-800">R$ ${p.total.toFixed(2)}</span>
                        </div>
                        <p class="text-emerald-600 font-bold text-2xs">Lucro: R$ ${p.lucro.toFixed(2)}</p>

                        <div class="pt-1">
                            ${renderTimelineStatus(p.id, p.status)}
                        </div>

                        <div class="pt-1">
                            ${renderStatusPagamentoPedido(p.id)}
                        </div>

                        <div class="flex items-center justify-end gap-1 pt-2 mt-1 border-t border-slate-100">
                            <button onclick="openPedidoModal(${p.id})" class="icon-btn text-accent-600" title="Editar"><i data-lucide="pencil" class="w-4 h-4"></i></button>
                            <button onclick="deletePedido(${p.id})" class="icon-btn danger text-red-600" title="Excluir"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                            <button onclick="openPagamentoModal(${p.id})" class="icon-btn danger text-green-600"><i data-lucide="dollar-sign" class="w-4 h-4"></i></button>
                        </div>
                    </div>
                `;
    });
    lucide.createIcons();
}

// ================= PEDIDOS: GERENCIAMENTO DE ITENS DINÂMICOS =================
let itemLinhaSeq = 0;

// Retorna as opções de material disponíveis para um tipo (Camiseta/Ecobag) e cor selecionados
function materiaisPorTipo(tipo) {
    return materiais.filter(m => m.tipo === tipo);
}

function coresDisponiveis(tipo) {
    return [...new Set(materiaisPorTipo(tipo).map(m => m.cor))];
}

function tamanhosDisponiveis(tipo, cor) {
    return materiaisPorTipo(tipo).filter(m => m.cor === cor).map(m => m.tamanho);
}

function adicionarLinhaItem(itemData = null) {
    const container = document.getElementById('container-itens-pedido');
    const itemDiv = document.createElement('div');
    const itemUid = 'item-' + (++itemLinhaSeq);
    itemDiv.className = 'item-linha bg-white p-2.5 rounded-lg border border-slate-200 space-y-2';
    itemDiv.dataset.uid = itemUid;

    const optionsEstampa = estampas.map(e => `<option value="${e.id}">${e.nome}</option>`).join('');

    itemDiv.innerHTML = `
                <div class="grid grid-cols-12 gap-2 items-end">
                    <div class="col-span-12 sm:col-span-4">
                        <label class="block text-2xs font-semibold text-slate-500 mb-0.5">Estampa</label>
                        <select class="item-estampa-id w-full border rounded p-1.5 text-xs" onchange="onChangeItemEstampa(this)">
                            <option value="">Sem estampa</option>
                            ${optionsEstampa}
                        </select>
                    </div>
                    <div class="col-span-4 sm:col-span-2">
                        <label class="block text-2xs font-semibold text-slate-500 mb-0.5">Tipo</label>
                        <select class="item-tipo w-full border rounded p-1.5 text-xs" onchange="onChangeItemTipo(this)">
                            <option>Camiseta</option>
                            <option>Ecobag</option>
                        </select>
                    </div>
                    <div class="col-span-4 sm:col-span-2">
                        <label class="block text-2xs font-semibold text-slate-500 mb-0.5">Cor</label>
                        <select class="item-cor w-full border rounded p-1.5 text-xs" onchange="onChangeItemCor(this)"></select>
                    </div>
                    <div class="col-span-4 sm:col-span-2">
                        <label class="block text-2xs font-semibold text-slate-500 mb-0.5">Tamanho</label>
                        <select class="item-tamanho w-full border rounded p-1.5 text-xs" onchange="atualizarTotalPedidoPreview()"></select>
                    </div>
                    <div class="col-span-8 sm:col-span-1">
                        <label class="block text-2xs font-semibold text-slate-500 mb-0.5">Qtd</label>
                        <input type="number" value="1" min="1" class="item-qtd w-full border rounded p-1.5 text-xs" oninput="atualizarTotalPedidoPreview()">
                    </div>
                    <div class="col-span-4 sm:col-span-1 text-right">
                        <button type="button" onclick="removerLinhaItem(this)" class="text-red-500 hover:text-red-700 p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>
                </div>
                <div class="flex items-center justify-between gap-2 bg-slate-50 rounded-lg p-2">
                    <div class="flex items-center gap-2 min-w-0">
                        <div class="item-foto-thumb flex-shrink-0 w-8 h-8 rounded-md overflow-hidden bg-slate-200 flex items-center justify-center text-slate-400">
                            <i data-lucide="image" class="w-4 h-4"></i>
                        </div>
                        <p class="item-custo-info text-2xs text-slate-500 truncate">Selecione a estampa e o material para ver o custo</p>
                    </div>
                    <div class="flex items-center gap-1 flex-shrink-0">
                        <label class="text-2xs font-semibold text-slate-600">Preço unit. (R$)</label>
                        <input type="number" step="0.01" readonly class="item-preco w-24 border bg-slate-100 text-slate-700 font-bold rounded p-1 text-xs text-right cursor-not-allowed" title="Calculado automaticamente: (custo material + custo estampa) × (1 + margem%)">
                    </div>
                </div>
            `;

    container.appendChild(itemDiv);
    lucide.createIcons();

    popularCoresItem(itemDiv);

    if (itemData) {
        if (itemData.estampa_id) itemDiv.querySelector('.item-estampa-id').value = itemData.estampa_id;
        if (itemData.categoria) itemDiv.querySelector('.item-tipo').value = itemData.categoria;
        popularCoresItem(itemDiv);
        if (itemData.cor) itemDiv.querySelector('.item-cor').value = itemData.cor;
        popularTamanhosItem(itemDiv);
        if (itemData.tamanho) itemDiv.querySelector('.item-tamanho').value = itemData.tamanho;
        if (itemData.qtd) itemDiv.querySelector('.item-qtd').value = itemData.qtd;
        itemDiv.dataset.materialId = itemData.material_id || '';
        if (itemData.foto_url) {
            const thumb = itemDiv.querySelector('.item-foto-thumb');
            thumb.innerHTML = `<img src="${itemData.foto_url}" class="w-full h-full object-cover">`;
        }
    }
    atualizarInfoCustoItem(itemDiv);

    atualizarTotalPedidoPreview();
}

function popularCoresItem(itemDiv) {
    const tipo = itemDiv.querySelector('.item-tipo').value;
    const selCor = itemDiv.querySelector('.item-cor');
    const cores = coresDisponiveis(tipo);
    selCor.innerHTML = cores.length
        ? cores.map(c => `<option value="${c}">${c}</option>`).join('')
        : `<option value="">Cadastre um material</option>`;
    popularTamanhosItem(itemDiv);
}

function popularTamanhosItem(itemDiv) {
    const tipo = itemDiv.querySelector('.item-tipo').value;
    const cor = itemDiv.querySelector('.item-cor').value;
    const selTam = itemDiv.querySelector('.item-tamanho');
    const tamanhos = tamanhosDisponiveis(tipo, cor);
    selTam.innerHTML = tamanhos.length
        ? tamanhos.map(t => `<option value="${t}">${t}</option>`).join('')
        : `<option value="">-</option>`;
}

function onChangeItemTipo(sel) {
    const itemDiv = sel.closest('.item-linha');
    popularCoresItem(itemDiv);
    atualizarInfoCustoItem(itemDiv);
    atualizarTotalPedidoPreview();
}

function onChangeItemCor(sel) {
    const itemDiv = sel.closest('.item-linha');
    popularTamanhosItem(itemDiv);
    atualizarInfoCustoItem(itemDiv);
    atualizarTotalPedidoPreview();
}

function onChangeItemEstampa(sel) {
    const itemDiv = sel.closest('.item-linha');
    atualizarInfoCustoItem(itemDiv);
    atualizarTotalPedidoPreview();

    const estampaId = sel.value;
    const estampa = estampas.find(e => e.id == estampaId);
    const thumb = itemDiv.querySelector('.item-foto-thumb');
    if (estampa && estampa.foto_url) {
        thumb.innerHTML = `<img src="${estampa.foto_url}" class="w-full h-full object-cover">`;
    } else {
        thumb.innerHTML = `<i data-lucide="image" class="w-4 h-4"></i>`;
        lucide.createIcons();
    }
}

// Busca o material exato (tipo+cor+tamanho) que essa linha representa
function getMaterialDaLinha(itemDiv) {
    const tipo = itemDiv.querySelector('.item-tipo').value;
    const cor = itemDiv.querySelector('.item-cor').value;
    const tamanho = itemDiv.querySelector('.item-tamanho').value;
    return materiais.find(m => m.tipo === tipo && m.cor === cor && m.tamanho === tamanho);
}

// Margem padrão (%) aplicada quando o item não tem estampa vinculada (só material/acessório)
const MARGEM_PADRAO_SEM_ESTAMPA = 40;

// Atualiza o texto informativo de custo e sempre recalcula o preço de venda automaticamente
// Preço = (custo material + custo estampa) × (1 + margem% / 100)
// A margem% usada é a da estampa selecionada; se não houver estampa, usa a margem padrão.
function atualizarInfoCustoItem(itemDiv) {
    const estampaId = itemDiv.querySelector('.item-estampa-id').value;
    const estampa = estampas.find(e => e.id == estampaId);
    const material = getMaterialDaLinha(itemDiv);
    const infoEl = itemDiv.querySelector('.item-custo-info');

    const custoMaterial = material ? material.custo : 0;
    const custoEstampa = estampa ? estampa.custo_estampa : 0;
    const custoTotal = custoMaterial + custoEstampa;
    const margemPct = estampa && estampa.margem_pct != null ? estampa.margem_pct : MARGEM_PADRAO_SEM_ESTAMPA;
    const precoFinal = custoTotal * (1 + margemPct / 100);

    // Remove alerta de estoque anterior (se houver) antes de recalcular
    const alertaAnterior = itemDiv.querySelector('.item-alerta-estoque');
    if (alertaAnterior) alertaAnterior.remove();

    if (!material) {
        infoEl.innerText = 'Sem estoque cadastrado para essa combinação de cor/tamanho.';
        infoEl.className = 'item-custo-info text-2xs text-red-500 truncate';
    } else {
        const semEstoque = material.estoque <= 0;
        const saldoBaixo = !semEstoque && material.estoque <= material.min;
        const saldoTxt = semEstoque ? ` · 🚫 sem estoque` : (saldoBaixo ? ` · ⚠️ saldo baixo (${material.estoque} un)` : ` · saldo: ${material.estoque} un`);
        infoEl.innerText = `Custo: R$ ${custoTotal.toFixed(2)} (material R$ ${custoMaterial.toFixed(2)} + estampa R$ ${custoEstampa.toFixed(2)}) · margem ${margemPct}%${saldoTxt}`;
        infoEl.className = 'item-custo-info text-2xs text-slate-500 truncate';

        // Alerta visual destacado (banner), não só o texto discreto acima
        if (semEstoque || saldoBaixo) {
            const alertaDiv = document.createElement('div');
            alertaDiv.className = `item-alerta-estoque text-2xs font-bold rounded px-2 py-1 mt-1 ${semEstoque ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`;
            alertaDiv.innerText = semEstoque
                ? `🚫 Estoque zerado para "${material.tipo} ${material.cor} ${material.tamanho}". Reponha antes de vender.`
                : `⚠️ Estoque baixo: só ${material.estoque} un disponível (mínimo: ${material.min}).`;
            itemDiv.querySelector('.grid').insertAdjacentElement('afterend', alertaDiv);
        }
    }

    itemDiv.querySelector('.item-preco').value = precoFinal.toFixed(2);
    itemDiv.dataset.custoMaterial = custoMaterial;
    itemDiv.dataset.custoEstampa = custoEstampa;
    itemDiv.dataset.margemPct = margemPct;
}

function removerLinhaItem(btn) {
    const container = document.getElementById('container-itens-pedido');
    if (container.children.length > 1) {
        btn.closest('.item-linha').remove();
        atualizarTotalPedidoPreview();
    } else {
        toast('O pedido deve conter pelo menos um item.', 'info');
    }
}

function atualizarTotalPedidoPreview() {
    let total = 0;
    document.querySelectorAll('.item-linha').forEach(linha => {
        const qtd = parseInt(linha.querySelector('.item-qtd').value) || 0;
        const preco = parseFloat(linha.querySelector('.item-preco').value) || 0;
        total += preco * qtd;
    });
    document.getElementById('ped-total-preview').innerText = 'R$ ' + total.toFixed(2);
}

function openPedidoModal(id = null) {
    const form = document.getElementById('form-pedido');
    form.reset();
    document.getElementById('container-itens-pedido').innerHTML = '';

    if (estampas.length === 0) {
        toast('Cadastre ao menos uma estampa no catálogo antes de criar pedidos.', 'error');
        return;
    }
    if (materiais.length === 0) {
        toast('Cadastre ao menos um material no estoque antes de criar pedidos.', 'error');
        return;
    }

    if (id) {
        const p = pedidos.find(x => x.id === id);
        if (!p) return;
        document.getElementById('modal-pedido-title').innerText = 'Editar Pedido #' + p.id;
        document.getElementById('btn-salvar-pedido').innerText = 'Salvar Alterações';
        document.getElementById('ped-edit-id').value = p.id;
        document.getElementById('ped-cliente').value = p.cliente;
        document.getElementById('ped-telefone').value = p.telefone || '';
        document.getElementById('ped-cidade').value = p.cidade || '';
        document.getElementById('ped-status').value = p.status;
        renderPagamentosNoPedido(id);

        if (p.itens && p.itens.length > 0) {
            p.itens.forEach(item => adicionarLinhaItem(item));
        } else {
            adicionarLinhaItem();
        }
    } else {
        document.getElementById('modal-pedido-title').innerText = 'Cadastrar Novo Pedido';
        document.getElementById('btn-salvar-pedido').innerText = 'Salvar Pedido';
        document.getElementById('ped-edit-id').value = '';
        adicionarLinhaItem();
    }
    atualizarTotalPedidoPreview();
    openModal('modal-novo-pedido');
}

async function salvarPedido(e) {
    e.preventDefault();
    const editId = document.getElementById('ped-edit-id').value;
    const nomeCliente = document.getElementById('ped-cliente').value;

    const linhasItens = document.querySelectorAll('.item-linha');
    if (linhasItens.length === 0) {
        toast('Adicione pelo menos um item ao pedido.', 'error');
        return;
    }

    let totalGeral = 0;
    let custoGeral = 0;
    const arrayItensParaInserir = [];
    const decrementos = {}; // material_id -> quantidade a decrementar

    setBtnLoading('btn-salvar-pedido', true);

    try {
        // LOOP: valida e monta os itens
        for (const linha of linhasItens) {
            const estampaId = linha.querySelector('.item-estampa-id').value || null;
            const tipo = linha.querySelector('.item-tipo').value;
            const cor = linha.querySelector('.item-cor').value;
            const tamanho = linha.querySelector('.item-tamanho').value;
            const qtd = parseInt(linha.querySelector('.item-qtd').value) || 1;

            const estampa = estampaId ? estampas.find(e => e.id == estampaId) : null;
            const material = materiais.find(m => m.tipo === tipo && m.cor === cor && m.tamanho === tamanho);

            if (!material) {
                throw new Error(`Nenhum material em estoque para "${tipo} ${cor} ${tamanho}". Cadastre-o na aba Estoque.`);
            }

            // Soma o quanto já foi pedido desse material neste próprio pedido (para checar saldo corretamente)
            decrementos[material.id] = (decrementos[material.id] || 0) + qtd;

            const custoMaterial = material.custo;
            const custoEstampa = estampa ? estampa.custo_estampa : 0;
            const custoUnit = custoMaterial + custoEstampa;
            const margemPct = estampa && estampa.margem_pct != null ? estampa.margem_pct : MARGEM_PADRAO_SEM_ESTAMPA;

            // Preço é sempre recalculado no servidor a partir do custo real + margem (nunca confia no valor digitado/exibido),
            // garantindo consistência mesmo se o front estiver desatualizado.
            const precoUnitCalculado = custoUnit * (1 + margemPct / 100);
            const precoEstampaUnit = custoEstampa * (1 + margemPct / 100);
            const precoMaterialUnit = precoUnitCalculado - precoEstampaUnit;

            totalGeral += precoUnitCalculado * qtd;
            custoGeral += custoUnit * qtd;

            const materialDesc = `${material.tipo} ${material.modelo || ''} ${material.cor} - ${material.tamanho}`.replace(/\s+/g, ' ').trim();

            arrayItensParaInserir.push({
                estampa_id: estampa ? estampa.id : null,
                material_id: material.id,
                estampa_nome: estampa ? estampa.nome : null,
                material_nome: materialDesc,
                material_desc: materialDesc,
                categoria: tipo,
                tamanho: material.tamanho,
                cor: material.cor,
                qtd: qtd,
                preco_material: precoMaterialUnit,
                preco_estampa: precoEstampaUnit,
                custo_material: custoMaterial,
                custo_estampa: custoEstampa,
                foto_url: estampa ? (estampa.foto_url || null) : null
            });
        }

        // Checa saldo disponível considerando: saldo atual + (se for edição, o que já estava reservado nesse pedido)
        let estoqueRestituido = {};
        if (editId) {
            const pedidoAntigo = pedidos.find(p => p.id == editId);
            (pedidoAntigo?.itens || []).forEach(item => {
                if (item.material_id) {
                    estoqueRestituido[item.material_id] = (estoqueRestituido[item.material_id] || 0) + item.qtd;
                }
            });
        }

        for (const matId in decrementos) {
            const material = materiais.find(m => m.id == matId);
            const saldoDisponivel = material.estoque + (estoqueRestituido[matId] || 0);
            if (decrementos[matId] > saldoDisponivel) {
                throw new Error(`Estoque insuficiente para "${material.tipo} ${material.cor} ${material.tamanho}". Disponível: ${saldoDisponivel}, solicitado: ${decrementos[matId]}.`);
            }
        }

        const lucroGeral = totalGeral - custoGeral;

        const dadosPedido = {
            data: editId ? pedidos.find(p => p.id == editId).data : new Date().toISOString().split('T')[0],
            cliente: nomeCliente,
            telefone: document.getElementById('ped-telefone').value,
            cidade: document.getElementById('ped-cidade').value || "São Paulo",
            total: totalGeral,
            custo: custoGeral,
            lucro: lucroGeral,
            status: document.getElementById('ped-status').value
        };

        let pedidoIdAtual = editId;

        // PASSO 1: cria ou atualiza o pedido
        if (editId) {
            const { data, error } = await db.from('pedidos').update(dadosPedido).eq('id', editId).select();
            if (error) throw error;
            if (!data || data.length === 0) throw new Error('Nenhuma linha foi alterada. Verifique as políticas de RLS (Row Level Security) da tabela "pedidos" no Supabase — o UPDATE pode estar sendo bloqueado silenciosamente.');
            await db.from('itens_pedido').delete().eq('pedido_id', editId);
        } else {
            const { data, error } = await db.from('pedidos').insert([dadosPedido]).select();
            if (error) throw error;
            if (!data || data.length === 0) throw new Error('O pedido não foi salvo. Verifique as políticas de RLS (Row Level Security) da tabela "pedidos" no Supabase.');
            pedidoIdAtual = data[0].id;
        }

        // PASSO 2: insere os itens
        const itensFormatados = arrayItensParaInserir.map(i => ({ ...i, pedido_id: pedidoIdAtual }));
        const { data: itensInseridos, error: errItens } = await db.from('itens_pedido').insert(itensFormatados).select();
        if (errItens) throw errItens;
        if (!itensInseridos || itensInseridos.length === 0) throw new Error('Os itens do pedido não foram salvos. Verifique as políticas de RLS (Row Level Security) da tabela "itens_pedido" no Supabase.');

        // PASSO 3: ajusta estoque dos materiais (restitui os antigos se edição, depois decrementa os novos)
        for (const matId in estoqueRestituido) {
            const material = materiais.find(m => m.id == matId);
            await db.from('materiais').update({ estoque: material.estoque + estoqueRestituido[matId] }).eq('id', matId);
            material.estoque += estoqueRestituido[matId]; // reflete localmente antes do próximo cálculo
        }
        for (const matId in decrementos) {
            const material = materiais.find(m => m.id == matId);
            const novoSaldo = material.estoque - decrementos[matId];
            await db.from('materiais').update({ estoque: novoSaldo }).eq('id', matId);
        }

        // PASSO 4: cria cliente automaticamente se não existir
        if (!clientes.find(c => c.nome.toLowerCase() === nomeCliente.toLowerCase())) {
            await db.from('clientes').insert([{
                nome: nomeCliente,
                telefone: dadosPedido.telefone,
                instagram: '',
                cidade: dadosPedido.cidade
            }]);
        }

        toast(editId ? 'Pedido #' + pedidoIdAtual + ' atualizado com sucesso!' : 'Pedido #' + pedidoIdAtual + ' criado com sucesso!');
        closeModal('modal-novo-pedido');
        await loadAllData();
    } catch (err) {
        console.error(err);
        toast('Erro ao salvar pedido: ' + err.message, 'error');
    } finally {
        setBtnLoading('btn-salvar-pedido', false);
    }
}

async function deletePedido(id) {
    if (!confirm('Tem certeza que deseja excluir o pedido #' + id + '? O estoque dos materiais usados será devolvido. Essa ação não pode ser desfeita.')) return;
    try {
        const pedido = pedidos.find(p => p.id === id);

        // Devolve estoque dos materiais usados neste pedido
        if (pedido && pedido.itens) {
            for (const item of pedido.itens) {
                if (item.material_id) {
                    const material = materiais.find(m => m.id === item.material_id);
                    if (material) {
                        await db.from('materiais').update({ estoque: material.estoque + item.qtd }).eq('id', material.id);
                    }
                }
            }
        }

        const { data, error } = await db.from('pedidos').delete().eq('id', id).select();
        if (error) throw error;
        if (!data || data.length === 0) throw new Error('Nenhuma linha foi excluída. Verifique as políticas de RLS (Row Level Security) da tabela "pedidos" no Supabase — o DELETE pode estar sendo bloqueado silenciosamente.');
        toast('Pedido #' + id + ' excluído e estoque devolvido.', 'info');
        await loadAllData();
    } catch (err) {
        console.error(err);
        toast('Erro ao excluir pedido: ' + err.message, 'error');
    }
}


// ===== Seleção de cliente (usado no fluxo de Pedidos) =====
// ================= SELEÇÃO DE CLIENTE =================
// ✅ ABRE MODAL DE SELEÇÃO DE CLIENTE
function openSelectClienteModal() {
    const searchInput = document.getElementById('cliente-search-input');
    const resultsList = document.getElementById('cliente-results-list');

    searchInput.value = '';
    resultsList.innerHTML = '';
    displayClientesSearch('');
    openModal('modal-select-cliente');
}

// ✅ EXIBE LISTA DE CLIENTES COM FILTRO EM TEMPO REAL
function displayClientesSearch(termo) {
    const resultsList = document.getElementById('cliente-results-list');
    const clientesFiltrados = clientes.filter(c =>
        c.nome.toLowerCase().includes(termo.toLowerCase()) ||
        (c.telefone && c.telefone.includes(termo)) ||
        (c.instagram && c.instagram.toLowerCase().includes(termo))
    );

    resultsList.innerHTML = '';

    if (clientesFiltrados.length === 0) {
        resultsList.innerHTML = `
                    <div class="p-6 text-center text-slate-500">
                        <p class="text-sm mb-2">Nenhum cliente encontrado</p>
                        ${termo ? '<p class="text-xs text-slate-400">Crie um novo cliente com o botão abaixo</p>' : '<p class="text-xs text-slate-400">Clique em um cliente para selecionar</p>'}
                    </div>
                `;
        return;
    }

    clientesFiltrados.forEach(c => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'w-full text-left p-3 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-accent-500 transition active:scale-[0.98]';
        item.innerHTML = `
                    <div class="font-semibold text-sm text-slate-800">${c.nome}</div>
                    ${c.telefone ? `<div class="text-xs text-slate-500">📱 ${c.telefone}</div>` : ''}
                    ${c.cidade ? `<div class="text-xs text-slate-500">📍 ${c.cidade}</div>` : ''}
                `;
        item.onclick = (e) => {
            e.preventDefault();
            selectClienteForPedido(c);
        };
        resultsList.appendChild(item);
    });
}

// ✅ SELECIONA CLIENTE E PRÉ-PREENCHE PEDIDO
function selectClienteForPedido(cliente) {
    closeModal('modal-select-cliente');
    openPedidoModal();

    document.getElementById('ped-cliente').value = cliente.nome;
    document.getElementById('ped-telefone').value = cliente.telefone || '';
    document.getElementById('ped-cidade').value = cliente.cidade || '';
    document.getElementById('ped-cliente-id').value = cliente.id || '';

    toast(`✅ Cliente: ${cliente.nome}`, 'info');
}

// ✅ ABRE NOVO CLIENTE DIRETO DO MODAL DE SELEÇÃO
function abrirNovoClienteDoModal() {
    closeModal('modal-select-cliente');
    openClienteModal();
}

// ================= CÁLCULO CENTRAL DE STATUS DE PAGAMENTO =================
// Usado tanto pelo card (badge + barra + borda) quanto por outras telas.
function getInfoPagamentoPedido(pedidoId) {
    const pedido = pedidos.find(p => p.id === pedidoId);
    const pagtosPedido = pagamentos.filter(p => p.pedido_id === pedidoId);
    const totalPedido = pedido ? pedido.total : 0;

    if (pagtosPedido.length === 0) {
        return {
            temPagamento: false,
            totalPedido,
            totalPago: 0,
            faltaPagar: totalPedido,
            percentual: 0,
            status: 'Sem pagamento',
            atrasado: false
        };
    }

    // Soma tudo que já foi efetivamente pago (todas as parcelas pagas de todos os pagamentos do pedido)
    let totalPago = 0;
    pagtosPedido.forEach(pgto => {
        const parcPagto = parcelas.filter(pc => pc.pagamento_id === pgto.id);
        totalPago += parcPagto
            .filter(pc => pc.data_pagamento)
            .reduce((acc, pc) => acc + pc.valor, 0);
    });

    const faltaPagar = Math.max(0, totalPedido - totalPago);
    const percentual = totalPedido > 0 ? Math.min(100, (totalPago / totalPedido) * 100) : 0;

    // Verifica se existe parcela pendente vencida (atrasada) em qualquer pagamento do pedido
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const atrasado = pagtosPedido.some(pgto =>
        parcelas.some(pc =>
            pc.pagamento_id === pgto.id &&
            !pc.data_pagamento &&
            new Date(pc.data_vencimento) < hoje
        )
    );

    // Status "consolidado": se ainda falta algo, não é Completo mesmo que o status salvo diga isso
    let status = pagtosPedido[0].status;
    if (faltaPagar > 0.009 && status === 'Completo') {
        status = 'Parcial';
    }
    if (atrasado && faltaPagar > 0.009) {
        status = 'Atrasado';
    }

    return { temPagamento: true, totalPedido, totalPago, faltaPagar, percentual, status, atrasado };
}

// Retorna a classe de borda do card conforme urgência do pagamento
function getBordaCardPedido(pedidoId) {
    const info = getInfoPagamentoPedido(pedidoId);
    if (info.atrasado && info.faltaPagar > 0.009) return 'border-red-300';
    if (info.faltaPagar > 0.009) return 'border-amber-300';
    return 'border-slate-200';
}

function renderStatusPagamentoPedido(pedidoId) {
    const info = getInfoPagamentoPedido(pedidoId);

    const statusColor = {
        'Completo': 'bg-emerald-100 text-emerald-700',
        'Parcial': 'bg-amber-100 text-amber-700',
        'Pendente': 'bg-slate-100 text-slate-700',
        'Atrasado': 'bg-red-100 text-red-700',
        'Sem pagamento': 'bg-slate-100 text-slate-600'
    };

    const barraCor = info.atrasado ? 'bg-red-500' : (info.faltaPagar > 0.009 ? 'bg-amber-500' : 'bg-emerald-500');

    return `
        <div class="space-y-1.5">
            <div class="flex items-center justify-between gap-2">
                <span class="px-2 py-1 rounded text-2xs font-bold ${statusColor[info.status] || ''}">${info.status}</span>
                ${info.faltaPagar > 0.009
                    ? `<span class="text-2xs font-bold ${info.atrasado ? 'text-red-600' : 'text-amber-600'}">Falta: ${fmtMoeda(info.faltaPagar)}</span>`
                    : `<span class="text-2xs font-bold text-emerald-600">Pago ✓</span>`
                }
            </div>
            <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div class="${barraCor} h-1.5 rounded-full transition-all" style="width:${info.percentual}%"></div>
            </div>
        </div>
    `;
}