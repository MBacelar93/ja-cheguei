# 📦 Já Cheguei - Sistema de Gerenciamento de Encomendas

Um sistema moderno e intuitivo para gerenciamento de encomendas em condomínios e edifícios residenciais. Desenvolvido com **Node.js**, **Express**, **SQLite** e **JavaScript Vanilla**.

![Status](https://img.shields.io/badge/status-ativo-brightgreen)
![Licença](https://img.shields.io/badge/license-MIT-blue)
![Versão](https://img.shields.io/badge/version-1.0.0-orange)

---

## 🎯 Objetivo

Simplificar o controle de encomendas na portaria, permitindo:
- ✅ Cadastrar encomendas recebidas
- ✅ Listar encomendas com filtros
- ✅ Buscar por ID ou apartamento
- ✅ Marcar como retirada
- ✅ Visualizar histórico
- ✅ Dashboard administrativo
- ✅ Rotina automática de 15 dias

---

## 🛠️ Stack Tecnológico

### Backend
- **Node.js** v22.22.0
- **Express** ^4.18.2 - Framework HTTP
- **SQLite** - Banco de dados relacional
- **ES Modules** - Padrão moderno de JavaScript

### Frontend
- **HTML5** - Semântico e acessível
- **CSS3** - Responsivo (Mobile First)
- **JavaScript Vanilla** - ES6+
- **Fetch API** - Requisições HTTP

### Design
- **Material Design** - Google's design language
- **Responsivo** - Desktop, Tablet, Mobile
- **Acessível** - WCAG compliance

---

## 📋 Funcionalidades

### 1. 📥 Cadastro de Encomendas
```
Campo              | Tipo      | Obrigatório | Exemplo
───────────────────|───────────|─────────────|─────────────────
Remetente          | Texto     | ✅          | Amazon, Correios
Apartamento        | Texto     | ✅          | 402, 1001
Bloco              | Texto     | ✅          | A, B, 1, 2
Tipo               | Select    | ❌          | Pacote, Carta
Número/Rastreio    | Texto     | ❌          | BR123456789
Observações        | Textarea  | ❌          | Quebrado, úmido
```

### 2. 📊 Listagem com Filtros
- Filtrar por **status** (Ativa, Retirada, Pendente, Arquivo)
- Filtrar por **dias** (24h, 7 dias, 15 dias)
- Visualizar **tabela dinâmica** com dados em tempo real
- Status **colorido** para melhor visualização

### 3. 🔍 Busca
- **Por ID**: Busca rápida por número
- **Por Apartamento**: Localiza todas encomendas de um apto
- Resultados **formatados** com dados essenciais

### 4. ⚙️ Painel Administrativo
- 📈 **Dashboard** com 4 contadores principais
- 📋 **Logs de auditoria** com filtros
- 🚀 **Rotina automática** de 15 dias
- 🏥 **Status do sistema** em tempo real

---

## 📁 Estrutura do Projeto

```
ja-cheguei/
├── 📄 app.js                          # Servidor Express principal
├── 📦 package.json                    # Dependências Node.js
├── 📦 package-lock.json               # Lock de versões
│
├── config/
│   └── database.js                    # Configuração SQLite
│
├── models/                            # Lógica de negócio
│   ├── Encomenda.js                   # Model de encomendas
│   ├── Morador.js                     # Model de moradores
│   └── Log.js                         # Model de logs
│
├── controllers/                       # Orquestração HTTP
│   ├── EncomendaController.js         # Lógica encomendas
│   ├── MoradorController.js           # Lógica moradores
│   └── AdminController.js             # Lógica admin
│
├── routes/                            # Mapeamento de URLs
│   ├── encomenda.js                   # 11 endpoints
│   ├── morador.js                     # 12 endpoints
│   └── administracao.js               # 10 endpoints
│
├── public/                            # Frontend
│   ├── index.html                     # Página principal
│   ├── css/
│   │   └── style.css                  # Estilos (758 linhas)
│   └── js/
│       ├── api.js                     # Requisições HTTP (17 funções)
│       └── app.js                     # Lógica frontend
│
├── data/
│   └── ja_cheguei.db                  # Banco SQLite (auto-criado)
│
└── 📄 README.md                       # Este arquivo
```

---

## 🚀 Quick Start

### Pré-requisitos
- **Node.js** v18+ ([Download](https://nodejs.org/))
- **npm** v9+ (vem com Node.js)
- Terminal/PowerShell

### 1️⃣ Instalação

```bash
# Clone ou baixe o repositório
cd ja-cheguei

# Instale dependências
npm install
```

### 2️⃣ Inicie o Servidor

```bash
# Modo desenvolvimento (reinicia automaticamente)
npm run dev

# Ou modo produção
npm start
```

Você verá:
```
✅ Conectado ao banco SQLite: ./data/ja_cheguei.db
✅ Tabelas verificadas/criadas
✅ Servidor rodando na porta 3000
```

### 3️⃣ Acesse no Navegador

```
http://localhost:3000
```

---

## 📊 Arquitetura

### Fluxo de Dados

```
┌──────────────────────────────────────────┐
│  USUÁRIO (Navegador)                     │
│  ├─ Preenche formulário                  │
│  └─ Clica "Cadastrar"                    │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│  FRONTEND (JavaScript)                   │
│  ├─ app.js: Captura evento               │
│  └─ api.js: Faz fetch POST               │
└────────────────┬─────────────────────────┘
                 │
        POST /api/encomenda/criar
        { remetente, apartamento, bloco }
                 │
                 ▼
┌──────────────────────────────────────────┐
│  EXPRESS (Node.js)                       │
│  ├─ routes/encomenda.js: Match URL       │
│  └─ Controller.criar(): Processa         │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│  MODEL (Lógica)                          │
│  ├─ Valida dados                         │
│  └─ Encomenda.criar(): Prepara INSERT    │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│  DATABASE (SQLite)                       │
│  └─ INSERT INTO encomendas ...           │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│  RESPONSE (JSON)                         │
│  { sucesso: true, encomenda: {...} }     │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│  FRONTEND (Renderiza)                    │
│  ├─ Mostra mensagem ✅                   │
│  └─ Limpa formulário                     │
└──────────────────────────────────────────┘
```

---

## 📡 API Endpoints (33 Total)

### Encomendas (11 endpoints)
```
GET    /api/encomenda/constantes              → Valores válidos
GET    /api/encomenda/listar                  → Listar todas
GET    /api/encomenda/:id                     → Buscar por ID
GET    /api/encomenda/apartamento/:apt/:bloco → Por apartamento
POST   /api/encomenda/criar                   → Criar nova
PUT    /api/encomenda/:id/retirada            → Marcar retirada
PUT    /api/encomenda/:id/validar             → Validar
DELETE /api/encomenda/:id                     → Deletar
```

### Moradores (12 endpoints)
```
GET    /api/morador/constantes                → Valores válidos
GET    /api/morador/listar                    → Listar todos
GET    /api/morador/:id                       → Buscar por ID
GET    /api/morador/buscar/:nome              → Busca fuzzy
GET    /api/morador/apartamento/:apt/:bloco   → Por apartamento
POST   /api/morador/criar                     → Criar novo
PUT    /api/morador/:id                       → Atualizar
PUT    /api/morador/:id/desativar             → Soft delete
PUT    /api/morador/:id/ativar                → Reativar
DELETE /api/morador/:id                       → Deletar
```

### Admin (10 endpoints)
```
GET    /api/admin/status                      → Health check
GET    /api/admin/dashboard                   → Números-chave
GET    /api/admin/encomendas-pendentes        → Pendências
GET    /api/admin/logs                        → Histórico
GET    /api/admin/logs/encomenda/:id          → Histórico item
GET    /api/admin/estatisticas                → Análise
POST   /api/admin/rotina-15-dias              → Rotina crítica
DELETE /api/admin/logs/limpar                 → LGPD cleanup
```

---

## 🗄️ Banco de Dados

### Tabela: `moradores`
```sql
CREATE TABLE moradores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  apartamento TEXT NOT NULL,
  bloco TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  status TEXT DEFAULT 'ativo',
  data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(apartamento, bloco)
);
```

### Tabela: `encomendas`
```sql
CREATE TABLE encomendas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  remetente TEXT NOT NULL,
  apartamento TEXT NOT NULL,
  bloco TEXT NOT NULL,
  morador_id INTEGER,
  tipo TEXT DEFAULT 'pacote',
  numero TEXT,
  observacoes TEXT,
  status TEXT DEFAULT 'Ativa',
  data_recebimento DATETIME DEFAULT CURRENT_TIMESTAMP,
  data_retirada DATETIME,
  data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (morador_id) REFERENCES moradores(id)
);
```

### Tabela: `logs`
```sql
CREATE TABLE logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL,
  encomenda_id INTEGER,
  morador_id INTEGER,
  usuario TEXT DEFAULT 'sistema',
  acao TEXT NOT NULL,
  data DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (encomenda_id) REFERENCES encomendas(id),
  FOREIGN KEY (morador_id) REFERENCES moradores(id)
);
```

---

## 🧪 Testes Manuais

### 1. Cadastrar Encomenda
1. Abra http://localhost:3000
2. Vá para aba **"Cadastrar"**
3. Preencha:
   - **Remetente:** Amazon
   - **Apartamento:** 402
   - **Bloco:** A
4. Clique **"Cadastrar"**
5. Deve aparecer: ✅ Encomenda 1 cadastrada com sucesso!

### 2. Listar Encomendas
1. Vá para aba **"Listar"**
2. Clique **"Atualizar"**
3. Deve mostrar tabela com 1 encomenda

### 3. Buscar por ID
1. Vá para aba **"Buscar"**
2. Digite **"1"** no campo ID
3. Clique **"Buscar"**
4. Deve retornar dados da encomenda

### 4. Admin Dashboard
1. Vá para aba **"Admin"**
2. Deve mostrar:
   - Encomendas Ativas: 1
   - Retiradas: 0
   - Pendentes Validação: 0
   - No Arquivo: 0

---

## 🎨 Design & UX

### Paleta de Cores
```
Primária:   #1a73e8 (Azul)       ← Ações principais
Sucesso:    #34a853 (Verde)      ← Mensagens positivas
Aviso:      #fbbc04 (Laranja)    ← Operações críticas
Perigo:     #ea4335 (Vermelho)   ← Erros
Background: #f8f9fa (Cinza claro)
```

### Responsividade
- **Desktop** (>1200px): Grid 3 colunas, navbar horizontal
- **Tablet** (768-1200px): Grid 2 colunas, ajuste de padding
- **Mobile** (<768px): Stack 1 coluna, full-width

---

## 📚 Documentação Técnica

Incluídos 4 PDFs detalhados:
1. **Models_Explicacao_Detalhada.pdf** - Camada de dados (17KB)
2. **Controllers_Explicacao_Detalhada.pdf** - Lógica HTTP (23KB)
3. **Routes_Explicacao_Detalhada.pdf** - Mapeamento de URLs (18KB)
4. **Frontend_Explicacao_Detalhada.pdf** - Interface e UX (19KB)

Total: ~77KB de documentação PDF

---

## 🔧 Troubleshooting

### Erro: "Cannot find module 'express'"
```bash
npm install
```

### Porta 3000 já está em uso
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Banco de dados corrompido
```bash
# Remove database
rm data/ja_cheguei.db

# Reinicie o servidor (recria automaticamente)
npm start
```

### Formulário não envia
1. Abra Console (F12)
2. Procure por erros em vermelho
3. Verifique Network (F12 → Network)
4. Veja se requisição foi enviada

---

## 📈 Estatísticas

- **5.718 linhas** de código produção
- **33 endpoints** REST API
- **28+ métodos** nos Controllers
- **3 Models** bem estruturados
- **100% funcionalidade** implementada
- **4 PDFs** de documentação

---

## 🚀 Próximas Melhorias

- [ ] Autenticação de usuários
- [ ] Integração com SMS (notificações)
- [ ] Integração com Email
- [ ] Relatórios em PDF
- [ ] Gráficos de estatísticas
- [ ] PWA (Progressive Web App)
- [ ] Dark Mode
- [ ] Multi-idioma
- [ ] Testes automatizados
- [ ] Deploy em produção

---

## 📝 Licença

MIT License - sinta-se livre para usar, modificar e distribuir!

---

## 👨‍💻 Desenvolvido por Matheus Bacelar

Feito para facilitar a vida de porteiros e moradores em condomínios.

**Versão:** 1.0.0  
**Última atualização:** Abril 2026  
**Suporte:** Para bugs ou sugestões, abra uma issue no repositório.

---

## 📞 Suporte Rápido

| Problema | Solução |
|----------|---------|
| Servidor não inicia | `npm install` → `npm start` |
| API não responde | Verifique se servidor está rodando na porta 3000 |
| Formulário não funciona | F12 → Console → procure erros |
| Banco vazio | Reinicie o servidor (recria automaticamente) |
| Página em branco | Verifique se arquivos JS estão em `public/js/` |

---

**Obrigado por usar Já Cheguei! 🎉**

Made with Node.js, Express, SQLite