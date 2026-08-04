        function renderEstoque() {
            const tbody = document.getElementById('table-estoque-body');
            tbody.innerHTML = '';
            if (materiais.length === 0) {
                tbody.innerHTML = '<tr class="empty-row"><td colspan="12">Nenhum material cadastrado ainda.</td></tr>';
                return;
            }
            materiais.forEach(m => {
                let vendasQtd = 0;
                pedidos.forEach(p => {
                    (p.itens || []).forEach(item => {
                        if (item.material_id === m.id) {
                            vendasQtd += item.qtd;
                        }
                    });
                });

                const saldo = m.estoque;
                const eCritico = saldo <= m.min;
                const statusBadge = eCritico ? '<span class="px-2 py-0.5 rounded bg-red-100 text-red-700 text-2xs font-bold">Crítico</span>' : '<span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-2xs font-bold">Normal</span>';
                const sugestao = eCritico ? (m.min * 2) - saldo : 0;

                tbody.innerHTML += `
                    <tr class="hover:bg-slate-50">
                        <td class="p-3 font-mono">${m.sku.toUpperCase()}</td>
                        <td class="p-3">${m.tipo}</td>
                        <td class="p-3">${m.modelo || '-'}</td>
                        <td class="p-3">${m.cor}</td>
                        <td class="p-3">${m.tamanho}</td>
                        <td class="p-3">${m.entradas}</td>
                        <td class="p-3 text-amber-600 font-bold">${vendasQtd}</td>
                        <td class="p-3 font-bold ${eCritico ? 'text-red-600' : 'text-slate-800'}">${saldo} un</td>
                        <td class="p-3">${m.min}</td>
                        <td class="p-3">${statusBadge}</td>
                        <td class="p-3 font-bold text-accent-600">${sugestao > 0 ? sugestao + ' un' : '-'}</td>
                        <td class="p-3 text-center">
                            <div class="flex items-center justify-center gap-1">
                                <button onclick="openMaterialModal(${m.id})" class="icon-btn text-accent-600" title="Editar"><i data-lucide="pencil" class="w-4 h-4"></i></button>
                                <button onclick="deleteMaterial(${m.id})" class="icon-btn danger text-red-600" title="Excluir"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                            </div>
                        </td>
                    </tr>
                `;
            });
            lucide.createIcons();
        }


        // ================= MATERIAIS (ESTOQUE) CRUD =================
        function slugifySku(str) {
            return (str || '')
                .toUpperCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
                .replace(/[^A-Z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
        }

        function onChangeTipoMaterial() {
            const tipo = document.getElementById('mat-tipo').value;
            const tamanhoWrap = document.getElementById('mat-tamanho-wrap');
            const modeloWrap = document.getElementById('mat-modelo-wrap');
            if (tipo === 'Ecobag') {
                tamanhoWrap.classList.add('hidden');
                modeloWrap.classList.add('hidden');
                document.getElementById('mat-tamanho').value = 'Único';
            } else {
                tamanhoWrap.classList.remove('hidden');
                modeloWrap.classList.remove('hidden');
            }
            atualizarSkuMaterial();
        }

        function atualizarSkuMaterial() {
            const tipo = document.getElementById('mat-tipo').value;
            const modelo = document.getElementById('mat-modelo').value;
            const cor = document.getElementById('mat-cor').value;
            const tamanho = tipo === 'Ecobag' ? 'UN' : document.getElementById('mat-tamanho').value;
            const prefix = tipo === 'Ecobag' ? 'ECO' : 'CAM';
            const partes = [prefix, slugifySku(modelo), slugifySku(cor), slugifySku(tamanho)].filter(Boolean);
            document.getElementById('mat-sku').value = partes.join('-');
        }

        function openMaterialModal(id = null) {
            const form = document.getElementById('form-material');
            form.reset();

            if (id) {
                const m = materiais.find(x => x.id === id);
                if (!m) return;
                document.getElementById('modal-material-title').innerText = 'Editar Material';
                document.getElementById('btn-salvar-material').innerText = 'Salvar Alterações';
                document.getElementById('mat-edit-id').value = m.id;
                document.getElementById('mat-sku').value = m.sku;
                document.getElementById('mat-tipo').value = m.tipo;
                document.getElementById('mat-modelo').value = m.modelo || '';
                document.getElementById('mat-cor').value = m.cor;
                document.getElementById('mat-tamanho').value = m.tamanho;
                document.getElementById('mat-custo').value = m.custo;
                document.getElementById('mat-entradas').value = m.entradas;
                document.getElementById('mat-estoque').value = m.estoque;
                document.getElementById('mat-min').value = m.min;
                onChangeTipoMaterial();
                document.getElementById('mat-tamanho').value = m.tamanho;
            } else {
                document.getElementById('modal-material-title').innerText = 'Cadastrar Novo Material';
                document.getElementById('btn-salvar-material').innerText = 'Salvar Material';
                document.getElementById('mat-edit-id').value = '';
                document.getElementById('mat-tipo').value = 'Camiseta';
                document.getElementById('mat-modelo').value = 'Oversized';
                document.getElementById('mat-min').value = 3;
                onChangeTipoMaterial();
                atualizarSkuMaterial();
            }
            openModal('modal-material');
        }

        async function salvarMaterial(e) {
            e.preventDefault();
            const editId = document.getElementById('mat-edit-id').value;
            const tipo = document.getElementById('mat-tipo').value;
            const modelo = tipo === 'Ecobag' ? (document.getElementById('mat-modelo').value || 'Padrão') : document.getElementById('mat-modelo').value;
            const cor = document.getElementById('mat-cor').value;
            const tamanho = tipo === 'Ecobag' ? 'Único' : document.getElementById('mat-tamanho').value;
            const nomeGerado = `${tipo} ${modelo} ${cor}${tamanho !== 'Único' ? ' - ' + tamanho : ''}`.replace(/\s+/g, ' ').trim();

            const dados = {
                sku: document.getElementById('mat-sku').value,
                nome: nomeGerado,
                categoria: tipo,
                modelo: modelo,
                cor: cor,
                tamanho: tamanho,
                custo: parseFloat(document.getElementById('mat-custo').value) || 0,
                entradas: parseInt(document.getElementById('mat-entradas').value) || 0,
                estoque: parseInt(document.getElementById('mat-estoque').value) || 0,
                min: parseInt(document.getElementById('mat-min').value) || 0
            };

            setBtnLoading('btn-salvar-material', true);
            try {
                if (editId) {
                    const { data, error } = await db.from('materiais').update(dados).eq('id', editId).select();
                    if (error) throw error;
                    if (!data || data.length === 0) throw new Error('Nenhuma linha foi alterada. Verifique as políticas de RLS (Row Level Security) da tabela "materiais" no Supabase — o UPDATE pode estar sendo bloqueado silenciosamente.');
                    toast('Material atualizado com sucesso!');
                } else {
                    const { data, error } = await db.from('materiais').insert([dados]).select();
                    if (error) throw error;
                    if (!data || data.length === 0) throw new Error('O material não foi salvo. Verifique as políticas de RLS (Row Level Security) da tabela "materiais" no Supabase.');
                    toast('Material cadastrado com sucesso!');
                }

                closeModal('modal-material');
                await loadAllData();
            } catch (err) {
                console.error(err);
                toast('Erro ao salvar material: ' + err.message, 'error');
            } finally {
                setBtnLoading('btn-salvar-material', false);
            }
        }

        async function deleteMaterial(id) {
            const m = materiais.find(x => x.id === id);
            if (!m) return;
            if (!confirm(`Tem certeza que deseja excluir "${m.tipo} ${m.cor} - ${m.tamanho}"?`)) return;
            try {
                const { data, error } = await db.from('materiais').delete().eq('id', id).select();
                if (error) throw error;
                if (!data || data.length === 0) throw new Error('Nenhuma linha foi excluída. Verifique as políticas de RLS (Row Level Security) da tabela "materiais" no Supabase — o DELETE pode estar sendo bloqueado silenciosamente.');
                toast('Material excluído.', 'info');
                await loadAllData();
            } catch (err) {
                console.error(err);
                toast('Erro ao excluir material: ' + err.message, 'error');
            }
        }

