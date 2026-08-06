// ================= SUPABASE CONNECTION =================
const SUPABASE_URL = 'https://jmrhgqccquttipuivjto.supabase.co';
const SUPABASE_KEY = 'sb_publishable__7yDbI8gH1PoAV0CeAMC-g_CyADuLbi';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let materiais = [];
let estampas = [];
let pedidos = [];
let clientes = [];
let despesas = [];
let metas = [];
let pagamentos = [];
let parcelas = [];

let chartCatInstance = null;
let chartProdInstance = null;
let chartEvolucaoInstance = null;

// INIT APP
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    loadAllData();
    calcularPreco();
});

function toggleMoreMenu() {
    const sheet = document.getElementById('more-sheet');
    if (sheet.classList.contains('hidden')) {
        sheet.classList.remove('hidden');
        sheet.classList.add('flex');
    } else {
        sheet.classList.add('hidden');
        sheet.classList.remove('flex');
    }
}

function setConnStatus(state, text) {
    const dot = document.getElementById('conn-dot');
    const label = document.getElementById('conn-text');
    const colors = { ok: 'bg-emerald-500', error: 'bg-red-500', loading: 'bg-amber-400' };
    dot.className = 'w-2 h-2 rounded-full ' + colors[state] + (state === 'loading' ? ' animate-pulse' : '');
    label.innerText = text;
}

async function loadAllData() {
    document.getElementById('loading-overlay').classList.remove('hidden');
    setConnStatus('loading', 'Conectando ao banco...');
    try {
        const [maRes, esRes, peRes, clRes, piRes, deRes, meRes, pgtoRes, parcRes] = await Promise.all([
            db.from('materiais').select('*').order('id'),
            db.from('estampas').select('*').order('id'),
            db.from('pedidos').select('*').order('id'),
            db.from('clientes').select('*').order('id'),
            db.from('itens_pedido').select('*'),
            db.from('despesas').select('*').order('data', { ascending: false }),
            db.from('metas').select('*'),
            db.from('pagamentos').select('*').order('data_criacao', { ascending: false }),
            db.from('parcelas').select('*').order('id')
        ]);

        if (maRes.error) throw maRes.error;
        if (esRes.error) throw esRes.error;
        if (peRes.error) throw peRes.error;
        if (clRes.error) throw clRes.error;
        if (piRes.error) throw piRes.error;
        if (deRes.error) throw deRes.error;
        if (meRes.error) throw meRes.error;
        if (pgtoRes.error) throw pgtoRes.error;
        if (parcRes.error) throw parcRes.error;

        materiais = (maRes.data || []).map(m => ({ ...m, custo: Number(m.custo), estoque: Number(m.estoque), entradas: Number(m.entradas || 0), min: Number(m.min), tipo: m.categoria }));
        estampas = (esRes.data || []).map(e => ({ ...e, custo_estampa: Number(e.custo), margem_pct: e.margem_pct != null ? Number(e.margem_pct) : 40, ativa: e.ativa !== false }));
        clientes = clRes.data || [];
        despesas = (deRes.data || []).map(d => ({ ...d, valor: Number(d.valor) }));
        metas = (meRes.data || []).map(m => ({ ...m, meta_receita: Number(m.meta_receita), meta_vendas: Number(m.meta_vendas) }));
        pagamentos = (pgtoRes.data || []).map(p => ({ ...p, valor_total: Number(p.valor_total) }));
        parcelas = (parcRes.data || []).map(p => ({ ...p, valor: Number(p.valor) }));

        const todosItens = (piRes.data || []).map(i => {
            const precoMaterial = Number(i.preco_material) || 0;
            const precoEstampa = Number(i.preco_estampa) || 0;
            const custoMaterial = Number(i.custo_material) || 0;
            const custoEstampa = Number(i.custo_estampa) || 0;
            return {
                ...i,
                qtd: Number(i.qtd),
                preco_material: precoMaterial,
                preco_estampa: precoEstampa,
                custo_material: custoMaterial,
                custo_estampa: custoEstampa,
                preco_unit: precoMaterial + precoEstampa,
                custo_unit: custoMaterial + custoEstampa
            };
        });
        pedidos = (peRes.data || []).map(p => {
            const itens = todosItens.filter(item => item.pedido_id === p.id);
            return {
                ...p,
                total: Number(p.total),
                custo: Number(p.custo),
                lucro: Number(p.lucro),
                itens: itens.map(i => ({ ...i, produto_nome: i.estampa_nome ? `${i.estampa_nome} — ${i.material_nome || i.material_desc || ''}` : (i.material_nome || i.material_desc || 'Item') }))
            };
        });

        setConnStatus('ok', 'Conectado ao Supabase');
        renderAll();
    } catch (err) {
        console.error(err);
        setConnStatus('error', 'Erro de conexão com o banco');
        toast('Não foi possível carregar os dados do Supabase.', 'error');
    } finally {
        document.getElementById('loading-overlay').classList.add('hidden');
    }
}

function toast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const icons = { success: 'check-circle', error: 'alert-circle', info: 'info' };
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.innerHTML = `<i data-lucide="${icons[type]}" class="w-4 h-4 flex-shrink-0"></i><span>${message}</span>`;
    container.appendChild(el);
    lucide.createIcons();
    setTimeout(() => {
        el.style.transition = 'opacity .3s ease';
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 300);
    }, 3200);
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.mtab').forEach(el => el.classList.remove('active'));

    const tabEl = document.getElementById('tab-' + tabName);
    if (tabEl) tabEl.classList.add('active');

    const btnEl = document.querySelector(`[data-mtab="${tabName}"]`);
    if (btnEl) btnEl.classList.add('active');

    const titles = {
        dashboard: 'Dashboard Geral',
        pedidos: 'Pedidos & Vendas',
        produtos: 'Catálogo de Estampas',
        estoque: 'Controle de Estoque de Materiais',
        clientes: 'Gestão de Clientes (CRM)',
        financeiro: 'Fluxo de Caixa (Receitas & Despesas)',
        custos: 'Engenharia de Custos',
        metas: 'Metas Mensais',
        relatorios: 'Relatórios de Desempenho'
    };
    document.getElementById('page-title').innerText = titles[tabName] || 'Painel VOCREO';

    if (tabName === 'dashboard') {
        renderCharts();
    }
}

function renderAll() {
    const steps = [
        ['renderDashboard', renderDashboard],
        ['renderPedidos', renderPedidos],
        ['renderProdutos', renderProdutos],
        ['renderEstoque', renderEstoque],
        ['renderClientes', renderClientes],
        ['renderFinanceiro', renderFinanceiro],
        ['renderMetas', renderMetas],
        ['renderRelatorios', renderRelatorios],
        ['renderPagamentosPendentes-relatorios', () => renderPagamentosPendentes('relatorio-pagamentos-container')],
        ['renderPagamentosPendentes-dashboard', () => renderPagamentosPendentes('dash-pagamentos-pendentes', 3)],
        ['renderCharts', renderCharts]
    ];
    for (const [nome, fn] of steps) {
        try {
            fn();
        } catch (err) {
            console.error(`Erro em ${nome}:`, err);
            toast(`Erro ao renderizar "${nome}": ${err.message}`, 'error');
        }
    }
    lucide.createIcons();
}

function fmtMoeda(v) {
    return 'R$ ' + (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function inicioFimMes(date) {
    const ini = new Date(date.getFullYear(), date.getMonth(), 1);
    const fim = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
    return { ini, fim };
}

// Normaliza nomes para comparação (evita bugs por espaço extra, maiúscula/minúscula, acentos)
// NOTA: o ideal seria ter pedidos.cliente_id referenciando clientes.id no banco.
// Hoje a tabela `pedidos` só guarda o nome do cliente como texto (ver bd.md), então
// essa normalização é a forma mais segura de "casar" pedido <-> cliente sem migrar o schema.
function normalizarNome(nome) {
    return (nome || '')
        .trim()
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Retorna todos os pedidos de um cliente, casando por nome normalizado
function pedidosDoCliente(cliente) {
    const nomeNorm = normalizarNome(cliente.nome);
    return pedidos.filter(p => normalizarNome(p.cliente) === nomeNorm);
}

function parseDataPedido(dataStr) {
    // datas vêm como 'YYYY-MM-DD' do Postgres
    const [y, m, d] = (dataStr || '').split('T')[0].split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
}


// ===== Helpers genéricos de modal =====
function openModal(id) { document.getElementById(id).classList.remove('hidden'); document.getElementById(id).classList.add('flex'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); document.getElementById(id).classList.remove('flex'); }

function setBtnLoading(btnId, loading, loadingText) {
    const btn = document.getElementById(btnId);
    if (loading) {
        btn.dataset.originalText = btn.innerText;
        btn.innerText = loadingText || 'Salvando...';
        btn.disabled = true;
        btn.classList.add('opacity-60', 'cursor-not-allowed');
    } else {
        btn.innerText = btn.dataset.originalText || btn.innerText;
        btn.disabled = false;
        btn.classList.remove('opacity-60', 'cursor-not-allowed');
    }
}

