        function renderClientes() {
            const tbody = document.getElementById('table-clientes-body');
            tbody.innerHTML = '';
            if (clientes.length === 0) {
                tbody.innerHTML = '<tr class="empty-row"><td colspan="9">Nenhum cliente cadastrado ainda.</td></tr>';
                return;
            }
            clientes.forEach(c => {
                const pedidosCliente = pedidos.filter(p => p.cliente === c.nome);
                const totalGasto = pedidosCliente.reduce((acc, p) => acc + p.total, 0);
                const qtdPedidos = pedidosCliente.length;
                const ticket = qtdPedidos > 0 ? totalGasto / qtdPedidos : 0;
                const isVip = totalGasto > 200;
                tbody.innerHTML += `
                    <tr class="hover:bg-slate-50">
                        <td class="p-3 font-semibold text-slate-800">${c.nome}</td>
                        <td class="p-3">${c.telefone || '-'}</td>
                        <td class="p-3 text-accent-500">${c.instagram || '-'}</td>
                        <td class="p-3">${c.cidade || '-'}</td>
                        <td class="p-3 font-bold">${qtdPedidos}</td>
                        <td class="p-3 font-bold text-slate-800">R$ ${totalGasto.toFixed(2)}</td>
                        <td class="p-3">R$ ${ticket.toFixed(2)}</td>
                        <td class="p-3">${isVip ? '<span class="px-2 py-0.5 rounded bg-violet-100 text-violet-700 font-bold text-2xs">VIP</span>' : '<span class="text-slate-400">Regular</span>'}</td>
                        <td class="p-3">
                            <div class="flex items-center justify-center space-x-1">
                                <button onclick="openClienteModal(${c.id})" class="icon-btn text-accent-600" title="Editar"><i data-lucide="pencil" class="w-4 h-4"></i></button>
                                <button onclick="deleteCliente(${c.id})" class="icon-btn danger text-red-600" title="Excluir"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                            </div>
                        </td>
                    </tr>
                `;
            });
        }


        // ================= CLIENTES CRUD =================
        function openClienteModal(id = null) {
            const form = document.getElementById('form-cliente');
            form.reset();
            if (id) {
                const c = clientes.find(x => x.id === id);
                if (!c) return;
                document.getElementById('modal-cliente-title').innerText = 'Editar Cliente';
                document.getElementById('btn-salvar-cliente').innerText = 'Salvar Alterações';
                document.getElementById('cli-edit-id').value = c.id;
                document.getElementById('cli-nome').value = c.nome;
                document.getElementById('cli-telefone').value = c.telefone || '';
                document.getElementById('cli-instagram').value = c.instagram || '';
                document.getElementById('cli-cidade').value = c.cidade || '';
            } else {
                document.getElementById('modal-cliente-title').innerText = 'Cadastrar Novo Cliente';
                document.getElementById('btn-salvar-cliente').innerText = 'Salvar Cliente';
                document.getElementById('cli-edit-id').value = '';

                document.getElementById('cli-cidade').value = 'Rio de Janeiro';
            }
            openModal('modal-cliente');
        }

        // Abre modal de seleção/criação de cliente para novo pedido
        async function salvarCliente(e) {
            e.preventDefault();
            const editId = document.getElementById('cli-edit-id').value;
            const dados = {
                nome: document.getElementById('cli-nome').value,
                telefone: document.getElementById('cli-telefone').value,
                instagram: document.getElementById('cli-instagram').value,
                cidade: document.getElementById('cli-cidade').value
                
            };

            setBtnLoading('btn-salvar-cliente', true);
            try {
                if (editId) {
                    const { data, error } = await db.from('clientes').update(dados).eq('id', editId).select();
                    if (error) throw error;
                    if (!data || data.length === 0) throw new Error('Nenhuma linha foi alterada. Verifique as políticas de RLS (Row Level Security) da tabela "clientes" no Supabase — o UPDATE pode estar sendo bloqueado silenciosamente.');
                    toast('Cliente atualizado com sucesso!');
                } else {
                    const { data, error } = await db.from('clientes').insert([dados]).select();
                    if (error) throw error;
                    if (!data || data.length === 0) throw new Error('O cliente não foi salvo. Verifique as políticas de RLS (Row Level Security) da tabela "clientes" no Supabase.');
                    toast('Cliente cadastrado com sucesso!');
                }

                closeModal('modal-cliente');
                await loadAllData();
            } catch (err) {
                console.error(err);
                toast('Erro ao salvar cliente: ' + err.message, 'error');
            } finally {
                setBtnLoading('btn-salvar-cliente', false);
            }
        }

        async function deleteCliente(id) {
            const c = clientes.find(x => x.id === id);
            if (!c) return;
            if (!confirm('Tem certeza que deseja excluir "' + c.nome + '"?')) return;
            try {
                const { data, error } = await db.from('clientes').delete().eq('id', id).select();
                if (error) throw error;
                if (!data || data.length === 0) throw new Error('Nenhuma linha foi excluída. Verifique as políticas de RLS (Row Level Security) da tabela "clientes" no Supabase — o DELETE pode estar sendo bloqueado silenciosamente.');
                toast('Cliente excluído.', 'info');
                await loadAllData();
            } catch (err) {
                console.error(err);
                toast('Erro ao excluir cliente: ' + err.message, 'error');
            }
        }
