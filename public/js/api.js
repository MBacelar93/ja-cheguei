/**
 * ========================================
 * PUBLIC/JS/API.JS
 * ========================================
 * 
 * Centraliza todas as chamadas HTTP para o backend
 */

const API_BASE_URL = 'http://localhost:3000/api';

async function fazerRequisicao(metodo, endpoint, dados = null) {
    try {
        const opcoes = {
            method: metodo,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (dados && (metodo === 'POST' || metodo === 'PUT')) {
            opcoes.body = JSON.stringify(dados);
        }

        const url = `${API_BASE_URL}${endpoint}`;
        const resposta = await fetch(url, opcoes);
        const json = await resposta.json();

        if (!resposta.ok) {
            throw {
                status: resposta.status,
                erro: json.erro || 'Erro desconhecido'
            };
        }

        return json;
    } catch (erro) {
        console.error('❌ Erro na requisição:', erro);
        throw erro;
    }
}

// ========== ENCOMENDAS ==========

async function criarEncomenda(dados) {
    return fazerRequisicao('POST', '/encomenda/criar', dados);
}

async function listarEncomendas(filtros = {}) {
    let url = '/encomenda/listar';
    
    if (filtros.status || filtros.dias) {
        const params = new URLSearchParams();
        if (filtros.status) params.append('status', filtros.status);
        if (filtros.dias) params.append('dias', filtros.dias);
        url += '?' + params.toString();
    }

    return fazerRequisicao('GET', url);
}

async function buscarEncomendaPorId(id) {
    return fazerRequisicao('GET', `/encomenda/${id}`);
}

async function buscarEncomendaPorApartamento(apartamento, bloco) {
    return fazerRequisicao('GET', `/encomenda/apartamento/${apartamento}/${bloco}`);
}

async function marcarRetirada(id) {
    return fazerRequisicao('PUT', `/encomenda/${id}/retirada`);
}

async function validarEncomenda(id, moradorId) {
    return fazerRequisicao('PUT', `/encomenda/${id}/validar`, {
        morador_id: moradorId
    });
}

async function enviarParaAdmin(id) {
    return fazerRequisicao('PUT', `/encomenda/${id}/enviar-admin`);
}

async function obterConstantesEncomenda() {
    return fazerRequisicao('GET', '/encomenda/constantes');
}

async function deletarEncomenda(id) {
    return fazerRequisicao('DELETE', `/encomenda/${id}`);
}

// ========== MORADORES ==========

async function criarMorador(dados) {
    return fazerRequisicao('POST', '/morador/criar', dados);
}

async function listarMoradores(filtros = {}) {
    let url = '/morador/listar';
    
    if (filtros.status || filtros.bloco) {
        const params = new URLSearchParams();
        if (filtros.status) params.append('status', filtros.status);
        if (filtros.bloco) params.append('bloco', filtros.bloco);
        url += '?' + params.toString();
    }

    return fazerRequisicao('GET', url);
}

async function buscarMoradorPorId(id) {
    return fazerRequisicao('GET', `/morador/${id}`);
}

async function buscarMoradorPorApartamento(apartamento, bloco) {
    return fazerRequisicao('GET', `/morador/apartamento/${apartamento}/${bloco}`);
}

async function buscarMoradorPorNome(nome) {
    return fazerRequisicao('GET', `/morador/buscar/${encodeURIComponent(nome)}`);
}

// ========== ADMIN ==========

async function obterDashboard() {
    return fazerRequisicao('GET', '/admin/dashboard');
}

async function obterEncomendasPendentes() {
    return fazerRequisicao('GET', '/admin/encomendas-pendentes');
}

async function executarRotina15Dias() {
    return fazerRequisicao('POST', '/admin/rotina-15-dias');
}

async function listarLogs(filtros = {}) {
    let url = '/admin/logs';
    
    if (filtros.tipo || filtros.usuario || filtros.limite) {
        const params = new URLSearchParams();
        if (filtros.tipo) params.append('tipo', filtros.tipo);
        if (filtros.usuario) params.append('usuario', filtros.usuario);
        if (filtros.limite) params.append('limite', filtros.limite);
        url += '?' + params.toString();
    }

    return fazerRequisicao('GET', url);
}

async function obterLogsPorEncomenda(id) {
    return fazerRequisicao('GET', `/admin/logs/encomenda/${id}`);
}

async function obterEstatisticas() {
    return fazerRequisicao('GET', '/admin/estatisticas');
}

async function limparLogs(diasRetencao) {
    return fazerRequisicao('DELETE', '/admin/logs/limpar', {
        dias_retencao: diasRetencao
    });
}

async function verificarStatusSistema() {
    return fazerRequisicao('GET', '/admin/status');
}

// ========== HELPERS ==========

function formatarData(dataISO) {
    if (!dataISO) return '-';
    
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function traduzirStatus(status) {
    const traducoes = {
        'Ativa': '✅ Ativa',
        'Retirada': '🎉 Retirada',
        'Pendente validacao': '⏳ Pendente validação',
        'Encaminhada admin': '📁 Arquivo'
    };
    return traducoes[status] || status;
}

function getClasseStatus(status) {
    switch(status) {
        case 'Ativa':
            return 'status ativa';
        case 'Retirada':
            return 'status retirada';
        case 'Pendente validacao':
            return 'status pendente';
        case 'Encaminhada admin':
            return 'status arquivo';
        default:
            return 'status';
    }
}

function mostrarMensagem(elementId, tipo, mensagem) {
    const elemento = document.getElementById(elementId);
    if (!elemento) return;

    elemento.textContent = mensagem;
    elemento.className = `message ${tipo}`;
    elemento.style.display = 'block';

    if (tipo !== 'error') {
        setTimeout(() => {
            elemento.style.display = 'none';
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