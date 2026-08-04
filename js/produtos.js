        function renderProdutos() {
            const grid = document.getElementById('grid-produtos');
            grid.innerHTML = '';
            if (estampas.length === 0) {
                grid.innerHTML = '<div class="col-span-full text-center text-slate-400 text-xs py-10 bg-white rounded-2xl border border-dashed border-slate-200">Nenhuma estampa cadastrada ainda.</div>';
                return;
            }
            estampas.forEach(es => {
                const fotoHtml = es.foto_url
                    ? `<img src="${es.foto_url}" class="w-full h-full object-cover">`
                    : `<i data-lucide="image" class="w-10 h-10"></i>`;
                const statusBadge = es.ativa
                    ? '<span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-2xs font-bold whitespace-nowrap">Ativa</span>'
                    : '<span class="px-2 py-0.5 rounded bg-slate-200 text-slate-500 text-2xs font-bold whitespace-nowrap">Inativa</span>';
                const margemPct = es.margem_pct != null ? es.margem_pct : 40;

                grid.innerHTML += `
                    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition">
                        <div class="h-32 bg-slate-100 flex items-center justify-center text-slate-300 overflow-hidden">
                            ${fotoHtml}
                        </div>
                        <div class="p-3 flex flex-col gap-1.5 flex-1 text-xs">
                            <div class="flex items-start justify-between gap-2">
                                <div>
                                    <p class="font-bold text-slate-800 text-sm leading-tight">${es.nome}</p>
                                    <p class="font-mono text-2xs text-slate-400">${es.sku}</p>
                                </div>
                                ${statusBadge}
                            </div>
                            <div class="flex items-center justify-between pt-1">
                                <span class="text-slate-500">Custo estampa: R$ ${es.custo_estampa.toFixed(2)}</span>
                                <span class="font-bold text-slate-800">Margem: ${margemPct}%</span>
                            </div>
                            <p class="text-2xs text-slate-400">Preço = (material + estampa) × (1 + margem%)</p>
                            <div class="flex items-center justify-end gap-1 pt-2 mt-auto border-t border-slate-100">
                                <button onclick="openEstampaModal(${es.id})" class="icon-btn text-accent-600" title="Editar"><i data-lucide="pencil" class="w-4 h-4"></i></button>
                                <button onclick="deleteEstampa(${es.id})" class="icon-btn danger text-red-600" title="Excluir"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                            </div>
                        </div>
                    </div>
                `;
            });
            lucide.createIcons();
        }


        // ================= PRODUTOS CRUD =================
        // ================= ESTAMPAS (CATÁLOGO) CRUD =================
        function generateNextSkuEstampa() {
            const prefix = 'EST-';
            const nums = estampas
                .filter(e => e.sku && e.sku.startsWith(prefix))
                .map(e => parseInt(e.sku.slice(prefix.length), 10))
                .filter(n => !isNaN(n));
            const next = nums.length ? Math.max(...nums) + 1 : 1;
            console.log(estampas.map(e => e.sku));

            return prefix + String(next).padStart(3, '0');
        }

        function openEstampaModal(id = null) {
            const form = document.getElementById('form-produto');
            form.reset();
            document.getElementById('est-foto-preview').classList.add('hidden');
            document.getElementById('est-foto-preview').src = '';
            document.getElementById('est-foto-icon').classList.remove('hidden');
            document.getElementById('est-foto-url').value = '';
            document.getElementById('est-foto-input').value = '';

            if (id) {
                const es = estampas.find(x => x.id === id);
                if (!es) return;
                document.getElementById('modal-produto-title').innerText = 'Editar Estampa';
                document.getElementById('btn-salvar-produto').innerText = 'Salvar Alterações';
                document.getElementById('est-edit-id').value = es.id;
                document.getElementById('est-sku').value = es.sku;
                document.getElementById('est-nome').value = es.nome;
                document.getElementById('est-custo').value = es.custo_estampa;
                document.getElementById('est-markup').value = es.margem_pct != null ? es.margem_pct : 40;
                if (es.foto_url) {
                    document.getElementById('est-foto-url').value = es.foto_url;
                    const preview = document.getElementById('est-foto-preview');
                    preview.src = es.foto_url;
                    preview.classList.remove('hidden');
                    document.getElementById('est-foto-icon').classList.add('hidden');
                }
            } else {
                document.getElementById('modal-produto-title').innerText = 'Cadastrar Nova Estampa';
                document.getElementById('btn-salvar-produto').innerText = 'Salvar Estampa';
                document.getElementById('est-edit-id').value = '';
                document.getElementById('est-sku').value = generateNextSkuEstampa();
                document.getElementById('est-markup').value = 15;
            }
            openModal('modal-produto');
        }

        function previewFotoEstampa(event) {
            const file = event.target.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) {
                toast('Por favor, selecione uma imagem válida.', 'error');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast('Arquivo muito grande. Máximo: 5MB', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = document.getElementById('est-foto-preview');
                preview.src = e.target.result;
                preview.classList.remove('hidden');
                document.getElementById('est-foto-icon').classList.add('hidden');
            };
            reader.readAsDataURL(file);
        }

        // Upload genérico de foto (usado pelas fotos de estampas do catálogo)
        async function uploadFotoItem(file, referencia) {
            if (!file) return null;
            try {
                const timestamp = Date.now();
                const nomeArquivoLimpo = file.name
                    .replace(/[^a-zA-Z0-9._-]/g, '_')
                    .toLowerCase()
                    .replace(/_{2,}/g, '_')
                    .replace(/\.+/g, '.');
                const nomeArquivo = `${referencia}_${timestamp}_${nomeArquivoLimpo}`;

                const { data, error: uploadError } = await db.storage
                    .from('product-images')
                    .upload(nomeArquivo, file, { cacheControl: '3600', upsert: false });
                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = db.storage.from('product-images').getPublicUrl(nomeArquivo);
                return publicUrl;
            } catch (err) {
                console.error('Erro ao upload de foto:', err);
                toast('Erro ao fazer upload da foto: ' + err.message, 'error');
                return null;
            }
        }

        async function salvarEstampa(e) {
            e.preventDefault();
            const editId = document.getElementById('est-edit-id').value;
            const sku = document.getElementById('est-sku').value;
            const nome = document.getElementById('est-nome').value;

            setBtnLoading('btn-salvar-produto', true);
            try {
                let fotoUrl = document.getElementById('est-foto-url').value || null;
                const fileInput = document.getElementById('est-foto-input');
                if (fileInput.files.length > 0) {
                    const refNome = `${sku}_${nome}`.replace(/[^a-zA-Z0-9_-]/g, '');
                    const urlUpload = await uploadFotoItem(fileInput.files[0], refNome);
                    if (urlUpload) fotoUrl = urlUpload;
                }

                const dados = {
                    sku: sku,
                    nome: nome,
                    custo: parseFloat(document.getElementById('est-custo').value) || 0,
                    margem_pct: parseFloat(document.getElementById('est-markup').value) || 0,
                    foto_url: fotoUrl,
                    ativa: true
                };

                if (editId) {
                    const { data, error } = await db.from('estampas').update(dados).eq('id', editId).select();
                    if (error) throw error;
                    if (!data || data.length === 0) throw new Error('Nenhuma linha foi alterada. Verifique as políticas de RLS (Row Level Security) da tabela "estampas" no Supabase — o UPDATE pode estar sendo bloqueado silenciosamente.');
                    toast('Estampa atualizada com sucesso!');
                } else {
                    const { data, error } = await db.from('estampas').insert([dados]).select();
                    if (error) throw error;
                    if (!data || data.length === 0) throw new Error('A estampa não foi salva. Verifique as políticas de RLS (Row Level Security) da tabela "estampas" no Supabase.');
                    toast('Estampa cadastrada com sucesso!');
                }

                closeModal('modal-produto');
                await loadAllData();
            } catch (err) {
                console.error(err);
                toast('Erro ao salvar estampa: ' + err.message, 'error');
            } finally {
                setBtnLoading('btn-salvar-produto', false);
            }
        }

        async function deleteEstampa(id) {
            const es = estampas.find(e => e.id === id);
            if (!es) return;
            if (!confirm('Tem certeza que deseja excluir a estampa "' + es.nome + '"?')) return;
            try {
                const { data, error } = await db.from('estampas').delete().eq('id', id).select();
                if (error) throw error;
                if (!data || data.length === 0) throw new Error('Nenhuma linha foi excluída. Verifique as políticas de RLS (Row Level Security) da tabela "estampas" no Supabase — o DELETE pode estar sendo bloqueado silenciosamente.');
                toast('Estampa excluída.', 'info');
                await loadAllData();
            } catch (err) {
                console.error(err);
                toast('Erro ao excluir estampa: ' + err.message, 'error');
            }
        }

