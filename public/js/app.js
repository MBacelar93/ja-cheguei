/**
 * ========================================
 * PUBLIC/JS/APP.JS
 * ========================================
 * 
 * Lógica principal da aplicação
 * Com verificação de autenticação
 */

let usuarioLogado = null;

// ========== INICIALIZAÇÃO ==========

document.addEventListener('DOMContentLoaded', async () => {
    console.log('✅ App.js iniciado');
    
    // 1. Verificar autenticação
    await verificarAutenticacao();
    
    // 2. Se não autenticado, redirecionar
    if (!usuarioLogado) {
        window.location.href = '/login';
        return;
    }
    
    // 3. Carregar dados do usuário
    atualizarNavbar();
    
    // 4. Configurar event listeners
    document.getElementById('form-cadastro').addEventListener('submit', handleCadastro);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // 5. Carregar dashboard admin se for admin
    if (usuarioLogado.role === 'Administração' || usuarioLogado.role === 'Admin do Sistema') {
        document.getElementById('adminBtn').style.display = 'block';
    }
});

// ========== VERIFICAR AUTENTICAÇÃO ==========

async function verificarAutenticacao() {
    try {
        const response = await fetch('http://localhost:3000/api/auth/me', {
            method: 'GET',
            credentials: 'include',  // ← ESSENCIAL! Envia cookies
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            usuarioLogado = data.usuario;
            console.log('✅ Autenticado como:', usuarioLogado.nome);
            return true;
        } else {
            console.log('❌ Token não válido, status:', response.status);
            usuarioLogado = null;
            return false;
        }
    } catch (erro) {
        console.error('❌ Erro ao verificar autenticação:', erro);
        usuarioLogado = null;
        return false;
    }
}

// ========== ATUALIZAR NAVBAR ==========

function atualizarNavbar() {
    const userDisplay = document.getElementById('userDisplay');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (usuarioLogado) {
        userDisplay.textContent = `👤 ${usuarioLogado.nome} (${usuarioLogado.role})`;
        logoutBtn.style.display = 'inline-block';
    } else {
        userDisplay.textContent = 'Não autenticado';
        logoutBtn.style.display = 'none';
    }
}

// ========== LOGOUT ==========

async function handleLogout() {
    if (!confirm('Tem certeza que deseja sair?')) {
        return;
    }

    try {
        await fetch('http://localhost:3000/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (erro) {
        console.error('Erro ao fazer logout:', erro);
    }

    // Limpar storage
    localStorage.removeItem('ja_cheguei_usuario');
    
    // Redirecionar para login
    window.location.href = '/login';
}

// ========== GERENCIAMENTO DE ABAS ==========

function showTab(tabName) {
    // Ocultar todas as abas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remover active dos botões
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Mostrar aba selecionada
    const tabElement = document.getElementById(`${tabName}-tab`);
    if (tabElement) {
        tabElement.classList.add('active');
    }

    // Marcar botão como active
    event.target.classList.add('active');

    // Ações específicas por aba
    switch(tabName) {
        case 'listar':
            atualizarLista();
            break;
        case 'admin':
            carregarDashboard();
            break;
    }
}

// ========== TAB: CADASTRO ==========

async function handleCadastro(event) {
    event.preventDefault();

    limparMensagem('cadastro-message');

    const formData = new FormData(event.target);
    const dados = Object.fromEntries(formData);

    // Remover campos vazios
    Object.keys(dados).forEach(chave => {
        if (!dados[chave]) delete dados[chave];
    });

    try {
        const btnSubmit = event.target.querySelector('button[type="submit"]');
        const textOriginal = btnSubmit.textContent;
        btnSubmit.textContent = '⏳ Cadastrando...';
        btnSubmit.disabled = true;

        const resposta = await criarEncomenda(dados);

        if (resposta.sucesso) {
            mostrarMensagem(
                'cadastro-message',
                'success',
                `✅ Encomenda ${resposta.encomenda.id} cadastrada com sucesso!`
            );

            event.target.reset();

            setTimeout(() => {
                limparMensagem('cadastro-message');
            }, 2000);
        } else {
            throw new Error(resposta.erro);
        }
    } catch (erro) {
        const mensagem = erro.erro || erro.message || 'Erro ao cadastrar encomenda';
        mostrarMensagem('cadastro-message', 'error', `❌ ${mensagem}`);
    } finally {
        const btnSubmit = event.target.querySelector('button[type="submit"]');
        btnSubmit.textContent = textOriginal;
        btnSubmit.disabled = false;
    }
}

// ========== TAB: LISTAR ==========

async function atualizarLista() {
    try {
        const status = document.getElementById('filtro-status')?.value;
        const dias = document.getElementById('filtro-dias')?.value;

        const filtros = {};
        if (status) filtros.status = status;
        if (dias) filtros.dias = dias;

        document.getElementById('listar-loading').style.display = 'block';
        document.getElementById('listar-info').style.display = 'none';

        const resposta = await listarEncomendas(filtros);

        const tbody = document.getElementById('encomendas-table').querySelector('tbody');
        tbody.innerHTML = '';

        if (resposta.encomendas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty">
                        Nenhuma encomenda encontrada
                    </td>
                </tr>
            `;
        } else {
            resposta.encomendas.forEach(enc => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${enc.id}</td>
                    <td>${enc.remetente}</td>
                    <td>${enc.apartamento} ${enc.bloco}</td>
                    <td>${enc.tipo || '-'}</td>
                    <td>
                        <span class="${getClasseStatus(enc.status)}">
                            ${traduzirStatus(enc.status)}
                        </span>
                    </td>
                    <td>${formatarData(enc.data_recebimento)}</td>
                    <td>
                        <button class="btn btn-secondary btn-sm" onclick="verDetalhes(${enc.id})">
                            👁️ Ver
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }

        document.getElementById('total-encomendas').textContent = resposta.total;
        document.getElementById('listar-info').style.display = 'block';

    } catch (erro) {
        const mensagem = erro.erro || erro.message || 'Erro ao listar encomendas';
        mostrarMensagem('listar-message', 'error', `❌ ${mensagem}`);
    } finally {
        document.getElementById('listar-loading').style.display = 'none';
    }
}

async function verDetalhes(id) {
    try {
        const encomenda = await buscarEncomendaPorId(id);
        
        if (encomenda.sucesso) {
            const enc = encomenda.encomenda;
            const conteudo = document.getElementById('detalhes-content');
            
            conteudo.innerHTML = `
                <div class="resultado-box">
                    <p><strong>ID:</strong> ${enc.id}</p>
                    <p><strong>Remetente:</strong> ${enc.remetente}</p>
                    <p><strong>Apartamento:</strong> ${enc.apartamento} ${enc.bloco}</p>
                    <p><strong>Tipo:</strong> ${enc.tipo || '-'}</p>
                    <p><strong>Número:</strong> ${enc.numero || '-'}</p>
                    <p><strong>Status:</strong> ${traduzirStatus(enc.status)}</p>
                    <p><strong>Data Recebimento:</strong> ${formatarData(enc.data_recebimento)}</p>
                    <p><strong>Data Retirada:</strong> ${formatarData(enc.data_retirada) || 'Ainda não retirada'}</p>
                    <p><strong>Observações:</strong> ${enc.observacoes || '-'}</p>
                </div>

                <div style="margin-top: 1rem;">
                    ${enc.status === 'Ativa' ? `
                        <button class="btn btn-primary" onclick="abrirModalRetirada(${enc.id})">
                            ✅ Marcar Retirada
                        </button>
                    ` : ''}
                </div>
            `;

            abrirModal('modal-detalhes');
        }
    } catch (erro) {
        const mensagem = erro.erro || erro.message || 'Erro ao buscar detalhes';
        mostrarMensagem('listar-message', 'error', `❌ ${mensagem}`);
    }
}

// ========== TAB: BUSCAR ==========

async function buscarPorId() {
    const id = document.getElementById('buscar-id').value;

    if (!id) {
        mostrarMensagem('buscar-message', 'warning', '⚠️ Digite um ID');
        return;
    }

    try {
        const resposta = await buscarEncomendaPorId(id);

        if (resposta.sucesso) {
            const enc = resposta.encomenda;
            const resultado = document.getElementById('resultado-content');

            resultado.innerHTML = `
                <p><strong>ID:</strong> ${enc.id}</p>
                <p><strong>Remetente:</strong> ${enc.remetente}</p>
                <p><strong>Apartamento:</strong> ${enc.apartamento} ${enc.bloco}</p>
                <p><strong>Tipo:</strong> ${enc.tipo || '-'}</p>
                <p><strong>Status:</strong> ${traduzirStatus(enc.status)}</p>
                <p><strong>Data Recebimento:</strong> ${formatarData(enc.data_recebimento)}</p>
            `;

            document.getElementById('buscar-resultado').style.display = 'block';
        }
    } catch (erro) {
        const mensagem = erro.erro || erro.message || 'Encomenda não encontrada';
        mostrarMensagem('buscar-message', 'error', `❌ ${mensagem}`);
        document.getElementById('buscar-resultado').style.display = 'none';
    }
}

async function buscarPorApartamento() {
    const apto = document.getElementById('buscar-apto').value;
    const bloco = document.getElementById('buscar-bloco').value;

    if (!apto || !bloco) {
        mostrarMensagem('buscar-message', 'warning', '⚠️ Digite apto e bloco');
        return;
    }

    try {
        const resposta = await buscarEncomendaPorApartamento(apto, bloco);

        if (resposta.sucesso && resposta.encomendas.length > 0) {
            const resultado = document.getElementById('resultado-content');
            let html = '';

            resposta.encomendas.forEach(enc => {
                html += `
                    <div style="padding: 1rem; border-bottom: 1px solid #ddd;">
                        <p><strong>ID:</strong> ${enc.id}</p>
                        <p><strong>Remetente:</strong> ${enc.remetente}</p>
                        <p><strong>Status:</strong> ${traduzirStatus(enc.status)}</p>
                        <p><strong>Data:</strong> ${formatarData(enc.data_recebimento)}</p>
                    </div>
                `;
            });

            resultado.innerHTML = html;
            document.getElementById('buscar-resultado').style.display = 'block';
        } else {
            mostrarMensagem('buscar-message', 'info', 'ℹ️ Nenhuma encomenda para este apto');
            document.getElementById('buscar-resultado').style.display = 'none';
        }
    } catch (erro) {
        const mensagem = erro.erro || erro.message || 'Erro na busca';
        mostrarMensagem('buscar-message', 'error', `❌ ${mensagem}`);
        document.getElementById('buscar-resultado').style.display = 'none';
    }
}

// ========== TAB: ADMIN ==========

async function carregarDashboard() {
    try {
        const resposta = await obterDashboard();

        if (resposta.sucesso) {
            const dash = resposta.dashboard;
            document.getElementById('stat-ativas').textContent = dash.encomendas.total_ativa || 0;
            document.getElementById('stat-retiradas').textContent = dash.encomendas.total_retirada || 0;
            document.getElementById('stat-pendentes').textContent = dash.encomendas.total_pendente_validacao || 0;
            document.getElementById('stat-arquivo').textContent = dash.encomendas.total_encaminhada_admin || 0;
        }
    } catch (erro) {
        console.error('Erro ao carregar dashboard:', erro);
    }
}

async function executarRotina15Dias() {
    if (!confirm('⚠️ Tem certeza que deseja executar a rotina de 15 dias?')) {
        return;
    }

    try {
        const btn = event.target;
        const textOriginal = btn.textContent;
        btn.textContent = '⏳ Executando...';
        btn.disabled = true;

        const resposta = await executarRotina15Dias();

        if (resposta.sucesso) {
            mostrarMensagem(
                'admin-message',
                'success',
                `✅ Rotina executada: ${resposta.processadas} encomendas movidas`
            );

            carregarDashboard();
        }
    } catch (erro) {
        const mensagem = erro.erro || erro.message || 'Erro ao executar rotina';
        mostrarMensagem('admin-message', 'error', `❌ ${mensagem}`);
    } finally {
        const btn = event.target;
        btn.textContent = textOriginal;
        btn.disabled = false;
    }
}

async function carregarLogs() {
    try {
        const resposta = await listarLogs({ limite: 20 });

        if (resposta.sucesso) {
            const conteudo = document.getElementById('admin-content');
            let html = '<h3>📝 Últimos Logs (20 registros)</h3>';

            if (resposta.logs.length === 0) {
                html += '<p>Nenhum log encontrado</p>';
            } else {
                html += '<div style="max-height: 400px; overflow-y: auto;">';
                resposta.logs.forEach(log => {
                    html += `
                        <div style="padding: 0.75rem; border-bottom: 1px solid #ddd;">
                            <strong>${log.tipo}</strong> - ${log.usuario}<br>
                            <small>${log.acao}</small><br>
                            <small style="color: #999;">${formatarData(log.data)}</small>
                        </div>
                    `;
                });
                html += '</div>';
            }

            conteudo.innerHTML = html;
            document.getElementById('admin-resultado').style.display = 'block';
        }
    } catch (erro) {
        const mensagem = erro.erro || erro.message || 'Erro ao carregar logs';
        mostrarMensagem('admin-message', 'error', `❌ ${mensagem}`);
    }
}

async function verificarStatus() {
    try {
        const resposta = await verificarStatusSistema();

        if (resposta.sucesso) {
            const conteudo = document.getElementById('admin-content');
            const bd = resposta.banco_de_dados;

            const html = `
                <h3>🏥 Status do Sistema</h3>
                <div style="padding: 1rem; background: #e6f4ea; border-radius: 8px;">
                    <p><strong>Status:</strong> ${resposta.status}</p>
                    <p><strong>Banco de Dados:</strong> ${bd.conectado ? '✅ Conectado' : '❌ Desconectado'}</p>
                    <p><strong>Total de Encomendas:</strong> ${bd.total_encomendas || 0}</p>
                    <p><strong>Última Verificação:</strong> ${formatarData(resposta.timestamp)}</p>
                </div>
            `;

            conteudo.innerHTML = html;
            document.getElementById('admin-resultado').style.display = 'block';
        }
    } catch (erro) {
        const mensagem = erro.erro || erro.message || 'Erro ao verificar status';
        mostrarMensagem('admin-message', 'error', `❌ ${mensagem}`);
    }
}

// ========== MODAIS ==========

function abrirModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
    }
}

function fecharModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

function abrirModalRetirada(id) {
    document.getElementById('retirada-info').textContent = `Confirmar retirada da encomenda #${id}?`;
    window.encomendaIdParaRetirada = id;
    fecharModal('modal-detalhes');
    abrirModal('modal-retirada');
}

async function confirmarRetirada() {
    const id = window.encomendaIdParaRetirada;

    try {
        const resposta = await marcarRetirada(id);

        if (resposta.sucesso) {
            mostrarMensagem(
                'admin-message',
                'success',
                `✅ Encomenda ${id} marcada como retirada!`
            );

            fecharModal('modal-retirada');
            atualizarLista();
        }
    } catch (erro) {
        const mensagem = erro.erro || erro.message || 'Erro ao marcar retirada';
        mostrarMensagem('admin-message', 'error', `❌ ${mensagem}`);
    }
}

// ========== MENSAGENS ==========

function mostrarMensagem(elementId, tipo, mensagem) {
    const elemento = document.getElementById(elementId);
    if (!elemento) return;

    elemento.textContent = mensagem;
    elemento.className = `message ${tipo}`;
    elemento.style.display = 'block';

    if (tipo !== 'error') {
        setTimeout(() => {
            limparMensagem(elementId);
        }, 5000);
    }
}

function limparMensagem(elementId) {
    const elemento = document.getElementById(elementId);
    if (elemento) {
        elemento.style.display = 'none';
        elemento.textContent = '';
    }
}

// ========== ESTILOS DINÂMICOS ==========

const style = document.createElement('style');
style.textContent = `
    .btn-sm {
        padding: 0.5rem 0.75rem;
        font-size: 0.85rem;
    }

    .navbar {
        background: linear-gradient(135deg, #1a73e8 0%, #1557b0 100%);
        color: white;
        padding: 1rem 0;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        margin-bottom: 2rem;
    }

    .navbar-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .navbar-brand h1 {
        margin: 0;
        font-size: 24px;
    }

    .navbar-brand p {
        margin: 4px 0 0 0;
        font-size: 12px;
        opacity: 0.9;
    }

    .navbar-user {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .modal.show {
        display: flex;
    }

    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
    }

    .stat-card {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        text-align: center;
    }

    .stat-card h4 {
        margin: 0 0 0.5rem 0;
        color: #666;
        font-size: 14px;
    }

    .stat-number {
        font-size: 32px;
        font-weight: bold;
        color: #1a73e8;
        margin: 0;
    }

    .admin-actions {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
    }

    .filters {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    .search-section {
        margin-bottom: 2rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid #e0e0e0;
    }

    .search-section h3 {
        margin-bottom: 1rem;
    }

    .modal-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        margin-top: 1rem;
    }
`;
document.head.appendChild(style);

console.log('✅ App.js carregado com sucesso');