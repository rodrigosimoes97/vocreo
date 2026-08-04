        function renderMetas() {
            const agora = new Date();
            const mes = agora.getMonth() + 1;
            const ano = agora.getFullYear();
            const { ini, fim } = inicioFimMes(agora);

            const pedidosMes = pedidos.filter(p => {
                const d = parseDataPedido(p.data);
                return d >= ini && d <= fim;
            });
            const receitaMes = pedidosMes.reduce((acc, p) => acc + p.total, 0);
            const vendasMes = pedidosMes.length;

            const meta = getMetaAtual();
            const metaReceita = meta ? meta.meta_receita : 0;
            const metaVendas = meta ? meta.meta_vendas : 0;

            const percReceita = metaReceita > 0 ? Math.min((receitaMes / metaReceita) * 100, 100) : 0;
            const percVendas = metaVendas > 0 ? Math.min((vendasMes / metaVendas) * 100, 100) : 0;

            document.getElementById('meta-titulo-mes').innerText = `${NOMES_MESES[agora.getMonth()]}/${ano}`;
            document.getElementById('meta-bar').style.width = percReceita + '%';
            document.getElementById('meta-perc-text').innerText = percReceita.toFixed(1) + '% Atingido';
            document.getElementById('meta-realizado').innerText = fmtMoeda(receitaMes);
            document.getElementById('meta-alvo-receita').innerText = fmtMoeda(metaReceita);

            document.getElementById('meta-bar-vendas').style.width = percVendas + '%';
            document.getElementById('meta-perc-text-vendas').innerText = percVendas.toFixed(1) + '% Atingido';
            document.getElementById('meta-realizado-vendas').innerText = vendasMes + ' pedido(s)';
            document.getElementById('meta-alvo-vendas').innerText = metaVendas + ' pedido(s)';

            document.getElementById('input-meta-receita').value = metaReceita || '';
            document.getElementById('input-meta-vendas').value = metaVendas || '';
        }

        async function salvarMeta(e) {
            e.preventDefault();
            const agora = new Date();
            const dados = {
                mes: agora.getMonth() + 1,
                ano: agora.getFullYear(),
                meta_receita: parseFloat(document.getElementById('input-meta-receita').value) || 0,
                meta_vendas: parseInt(document.getElementById('input-meta-vendas').value) || 0
            };
            setBtnLoading('btn-salvar-meta', true);
            try {
                const { error } = await db.from('metas').upsert([dados], { onConflict: 'mes,ano' });
                if (error) throw error;
                toast('Meta do mês atualizada com sucesso!');
                await loadAllData();
            } catch (err) {
                console.error(err);
                toast('Erro ao salvar meta: ' + err.message, 'error');
            } finally {
                setBtnLoading('btn-salvar-meta', false);
            }
        }

