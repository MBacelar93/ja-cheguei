const API_BASE_URL = 'http://localhost:3000/api';

const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const senhaInput = document.getElementById('senha');
const lembrarCheckbox = document.getElementById('lembrar');
const btnLogin = document.getElementById('btnLogin');
const messageDiv = document.getElementById('message');
const loadingDiv = document.getElementById('loading');

document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Login.js carregado');

    verificarAutenticacao();

    loginForm.addEventListener('submit', handleLogin);

    restaurarEmail();
});


async function verificarAutenticacao() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            console.log('✅ Usuário já autenticado, redirecionando...');
            window.location.href = '/';
        }
    } catch (erro) {
        console.log('Usuário não autenticado, mostrar formulário');
    }


}

async function restaurarEmail() {
    const emailSalvo = localStorage.getItem('ja_cheguei_email');

    if (emailSalvo) {
        emailInput.value = emailSalvo;
        lembrarCheckbox.checked = true;
    }
}

async function handleLogin(event) {
    event.preventDefault();

    limparMensagem();

    const email = emailInput.value.trim();
    const senha = senhaInput.value;

    console.log('📤 Enviando:', { email, senha });

    if (!email || !senha) {
        mostrarMensagem('erro', '⚠️ Email e senha são obrigatórios');
        return;
    }

    if (!validarEmail(email)) {
        mostrarMensagem('error', '❌ Email inválido');
        return;
    }

    try {

        mostrarLoading(true);
        btnLogin.disabled = true;

        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                senha: senha
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw {
                status: response.status,
                erro: data.erro || 'Erro ao fazer login'
            };
        }

        if (data.sucesso) {
            if (lembrarCheckbox.checked) {
                localStorage.setItem('ja_cheguei_email', email);
            } else {
                localStorage.removeItem('ja_cheguei_email');
            }

            mostrarMensagem('success', `✅ Bem-vindo, ${data.usuario.nome}!`);

            localStorage.setItem('ja_cheguei_usuario', JSON.stringify(data.usuario));

            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
        }

    } catch (erro) {
        console.error('❌ Erro no login:', erro);

        let mensagemErro = '❌ Erro ao fazer login';

        if (erro.status === 401) {
            mensagemErro = '❌ Email ou senha incorretos';
        } else if (erro.erro) {
            mensagemErro = `❌ ${erro.erro}`;
        }

        mostrarMensagem('error', mensagemErro);

    } finally {
        mostrarLoading(false);
        btnLogin.disabled = false;
    }

}


function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function mostrarMensagem(tipo, mensagem) {
    messageDiv.textContent = mensagem;
    messageDiv.className = `message ${tipo}`;
    messageDiv.style.display = 'block';

    if (tipo === 'error') {
        setTimeout(() => {
            limparMensagem();
        }, 5000);
    }
}

function limparMensagem() {
    messageDiv.textContent = '';
    messageDiv.className = 'message';
    messageDiv.style.display = 'none';
}

function mostrarLoading(ativo) {
    if (ativo) {
        loadingDiv.style.display = 'block';
        btnLogin.style.display = 'none';
    } else {
        loadingDiv.style.display = 'none';
        btnLogin.style.display = 'block';
    }
}

async function logout() {
    try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (erro) {
        console.error('Erro ao fazer logout:', erro);
    }
    
    
    localStorage.removeItem('ja_cheguei_usuario');
    
    
    window.location.href = '/login';
}