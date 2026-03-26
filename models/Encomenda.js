/**
 * ========================================
 * MODELS/ENCOMENDA.JS - Model de Encomendas
 * ========================================
 * 
 * Responsabilidade:
 *   - Encapsular operações com tabela "encomendas"
 *   - Fornecer métodos limpos (criar, buscar, atualizar, listar)
 *   - Validar dados antes de inserir
 * 
 * Por quê usar Model?
 *   - SQL fica centralizado (não espalhado em controllers)
 *   - Reutilizável (controllers só chamam métodos)
 *   - Fácil testar
 *   - Fácil mudar banco depois (MySQL, PostgreSQL, etc)
 * 
 * Fluxo:
 *   Controller → Model.criar() → SQL → Banco → Resposta
 */

// ========== CONSTANTES ==========
// Por quê aqui? Usar em múltiplos métodos, evita repetir string

const STATUS = {
  ATIVA: 'Ativa',
  RETIRADA: 'Retirada',
  PENDENTE_VALIDACAO: 'Pendente validacao',
  ENCAMINHADA_ADMIN: 'Encaminhada admin'
};

const TIPOS = ['pacote', 'carta', 'documento', 'caixa', 'outro'];

/**
 * Classe Encomenda
 * 
 * Static methods (Encomenda.criar, não precisa instanciar)
 * Por quê static? Não precisa de estado de instância
 * É apenas um "organizador" de funções SQL
 */
class Encomenda {
  /**
   * criar(dados, db)
   * 
   * Cria nova encomenda
   * 
   * Parâmetros:
   *   dados {Object} - { remetente, apartamento, bloco, tipo, numero?, morador_id?, observacoes? }
   *   db {Database} - Instância do banco (vem do req.db)
   * 
   * Retorna:
   *   { id, ...dados_inseridos }
   * 
   * Exceções:
   *   - Falta remetente, apartamento ou bloco
   *   - Tipo inválido
   */
  static async criar(dados, db) {
    // ========== 1. VALIDAÇÃO ==========
    // Por quê validar aqui? Garante dados válidos ANTES de ir ao banco
    
    if (!dados.remetente || dados.remetente.trim() === '') {
      throw new Error('Remetente é obrigatório');
    }

    if (!dados.apartamento || dados.apartamento.trim() === '') {
      throw new Error('Apartamento é obrigatório');
    }

    if (!dados.bloco || dados.bloco.trim() === '') {
      throw new Error('Bloco é obrigatório');
    }

    if (dados.tipo && !TIPOS.includes(dados.tipo)) {
      throw new Error(`Tipo inválido. Permitidos: ${TIPOS.join(', ')}`);
    }

    // ========== 2. PREPARAR DADOS ==========
    // Normalizar strings (trim = remover espaços)
    const remetente = dados.remetente.trim();
    const apartamento = dados.apartamento.trim();
    const bloco = dados.bloco.trim();
    const tipo = dados.tipo || 'pacote'; // Default
    const numero = dados.numero ? dados.numero.trim() : null;
    const morador_id = dados.morador_id || null;
    const observacoes = dados.observacoes ? dados.observacoes.trim() : null;

    // ========== 3. INSERIR NO BANCO ==========
    const resultado = await db.run(
      `INSERT INTO encomendas 
        (numero, remetente, tipo, apartamento, bloco, morador_id, status, observacoes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        numero,
        remetente,
        tipo,
        apartamento,
        bloco,
        morador_id,
        STATUS.ATIVA, // Status sempre começa como ATIVA
        observacoes
      ]
    );

    // ========== 4. RETORNAR RESULTADO ==========
    // Por quê retornar objeto completo?
    // Frontend/Controller quer saber ID e dados inseridos
    return {
      id: resultado.id,
      numero,
      remetente,
      tipo,
      apartamento,
      bloco,
      morador_id,
      status: STATUS.ATIVA,
      observacoes,
      data_recebimento: new Date().toISOString()
    };
  }

  /**
   * buscarPorId(id, db)
   * 
   * Busca UMA encomenda pelo ID
   * 
   * Retorna:
   *   { id, numero, remetente, ... } ou null
   * 
   * Por quê null em vez de erro?
   * - Mais comum não existir encomenda que erro no BD
   * - Controller pode verificar: if (!encomenda) { ... }
   */
  static async buscarPorId(id, db) {
    if (!id || isNaN(id)) {
      throw new Error('ID inválido');
    }

    const encomenda = await db.get(
      'SELECT * FROM encomendas WHERE id = ?',
      [id]
    );

    return encomenda || null;
  }

  /**
   * buscarPorApartamento(apartamento, bloco, db)
   * 
   * Lista encomendas de um apartamento específico
   * 
   * Usado em:
   *   - Porteiro procurando encomendas do morador
   *   - Admin vendo entregas de um apto
   * 
   * Retorna:
   *   [ { id, remetente, ... }, { ... } ] (array, pode estar vazio)
   */
  static async buscarPorApartamento(apartamento, bloco, db) {
    if (!apartamento || !bloco) {
      throw new Error('Apartamento e bloco são obrigatórios');
    }

    const encomendas = await db.all(
      `SELECT * FROM encomendas 
       WHERE apartamento = ? AND bloco = ? 
       ORDER BY data_recebimento DESC`,
      [apartamento.trim(), bloco.trim()]
    );

    return encomendas;
  }

  /**
   * buscarPorStatus(status, db)
   * 
   * Lista todas encomendas com um status específico
   * 
   * Usado em:
   *   - Admin: "Mostrar todas PENDENTES de validação"
   *   - Admin: "Mostrar todas que devem ir para arquivo (15 dias)"
   * 
   * Retorna:
   *   [ { id, remetente, status, ... }, { ... } ]
   */
  static async buscarPorStatus(status, db) {
    // Validar status
    if (!Object.values(STATUS).includes(status)) {
      throw new Error(`Status inválido. Permitidos: ${Object.values(STATUS).join(', ')}`);
    }

    const encomendas = await db.all(
      `SELECT * FROM encomendas 
       WHERE status = ? 
       ORDER BY data_atualizacao ASC`,
      [status]
    );

    return encomendas;
  }

  /**
   * listarTodas(db, filtros = {})
   * 
   * Lista TODAS as encomendas com filtros opcionais
   * 
   * Filtros:
   *   - status: filtra por status
   *   - dias: mostra encomendas ativas há X dias (para arquivo de 15 dias)
   * 
   * Exemplo:
   *   Encomenda.listarTodas(db, { status: 'Ativa', dias: 15 })
   *   → Retorna todas ATIVAS há 15+ dias
   */
  static async listarTodas(db, filtros = {}) {
    let sql = 'SELECT * FROM encomendas WHERE 1=1';
    const params = [];

    // Filtro por status
    if (filtros.status) {
      if (!Object.values(STATUS).includes(filtros.status)) {
        throw new Error(`Status inválido: ${filtros.status}`);
      }
      sql += ' AND status = ?';
      params.push(filtros.status);
    }

    // Filtro por dias (para rotina de 15 dias)
    // Por quê? Encontrar encomendas que precisam ir para arquivo
    if (filtros.dias && !isNaN(filtros.dias)) {
      const dias = parseInt(filtros.dias);
      sql += ` AND status = 'Ativa' 
              AND DATE(data_recebimento) <= DATE('now', '-${dias} days')`;
    }

    sql += ' ORDER BY data_atualizacao DESC';

    const encomendas = await db.all(sql, params);
    return encomendas;
  }

  /**
   * atualizarStatus(id, novoStatus, db)
   * 
   * Muda status de uma encomenda
   * 
   * Fluxo de status:
   *   Ativa → Retirada (morador pegou)
   *   Ativa → Encaminhada admin (após 15 dias)
   *   Pendente validacao → Ativa (após validação)
   *   Pendente validacao → Encaminhada admin (não conseguiu validar)
   * 
   * Por quê centralizar aqui?
   * - Garante que mudanças sejam registradas em LOG
   * - Valida transições de status
   * - Atualiza timestamps corretamente
   */
  static async atualizarStatus(id, novoStatus, db) {
    // ========== 1. VALIDAÇÃO ==========
    if (!id || isNaN(id)) {
      throw new Error('ID inválido');
    }

    if (!Object.values(STATUS).includes(novoStatus)) {
      throw new Error(`Status inválido: ${novoStatus}`);
    }

    // ========== 2. VERIFICAR SE ENCOMENDA EXISTE ==========
    const encomenda = await this.buscarPorId(id, db);
    if (!encomenda) {
      throw new Error(`Encomenda com ID ${id} não encontrada`);
    }

    // ========== 3. PREPARAR UPDATE ==========
    const updateData = {
      status: novoStatus,
      data_atualizacao: new Date().toISOString().replace('T', ' ').split('.')[0]
    };

    // Se mudando para RETIRADA, registrar data_retirada
    if (novoStatus === STATUS.RETIRADA) {
      updateData.data_retirada = new Date().toISOString().replace('T', ' ').split('.')[0];
    }

    // ========== 4. ATUALIZAR NO BANCO ==========
    const sql = `UPDATE encomendas 
                 SET status = ?, data_atualizacao = ?`;
    const params = [updateData.status, updateData.data_atualizacao];

    // Se tem data_retirada
    if (updateData.data_retirada) {
      sql += ', data_retirada = ?';
      params.push(updateData.data_retirada);
    }

    sql += ' WHERE id = ?';
    params.push(id);

    await db.run(sql, params);

    // ========== 5. RETORNAR RESULTADO ==========
    return {
      id,
      statusAnterior: encomenda.status,
      statusNovo: novoStatus,
      atualizado_em: updateData.data_atualizacao
    };
  }

  /**
   * validarEComplementar(id, morador_id, db)
   * 
   * Move encomenda de "Pendente validacao" para "Ativa"
   * Após validação bem-sucedida
   * 
   * Por quê método específico?
   * - Lógica de validação é específica
   * - Atualiza morador_id
   * - Muda status apropriadamente
   */
  static async validarEComplementar(id, morador_id, db) {
    if (!id || isNaN(id)) {
      throw new Error('ID inválido');
    }

    if (!morador_id || isNaN(morador_id)) {
      throw new Error('ID do morador inválido');
    }

    // Verificar encomenda
    const encomenda = await this.buscarPorId(id, db);
    if (!encomenda) {
      throw new Error(`Encomenda ${id} não encontrada`);
    }

    // Deve estar pendente
    if (encomenda.status !== STATUS.PENDENTE_VALIDACAO) {
      throw new Error(`Encomenda não está pendente validação (atual: ${encomenda.status})`);
    }

    // Atualizar
    const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
    
    await db.run(
      `UPDATE encomendas 
       SET morador_id = ?, status = ?, data_atualizacao = ? 
       WHERE id = ?`,
      [morador_id, STATUS.ATIVA, timestamp, id]
    );

    return {
      id,
      morador_id,
      status: STATUS.ATIVA,
      validado_em: timestamp
    };
  }

  /**
   * retirada(id, db)
   * 
   * Marca encomenda como RETIRADA
   * Shortcut para atualizarStatus(..., STATUS.RETIRADA)
   */
  static async retirada(id, db) {
    return this.atualizarStatus(id, STATUS.RETIRADA, db);
  }

  /**
   * enviarParaAdmin(id, db)
   * 
   * Marca encomenda para arquivo (após 15 dias)
   */
  static async enviarParaAdmin(id, db) {
    return this.atualizarStatus(id, STATUS.ENCAMINHADA_ADMIN, db);
  }

  /**
   * deletar(id, db)
   * 
   * Remove encomenda do banco
   * 
   * Por quê ter esse método?
   * - Cleanup, testes
   * - Centraliza SQL
   * 
   * ⚠️ CUIDADO: Isso afeta LOGS
   */
  static async deletar(id, db) {
    if (!id || isNaN(id)) {
      throw new Error('ID inválido');
    }

    const resultado = await db.run(
      'DELETE FROM encomendas WHERE id = ?',
      [id]
    );

    return {
      id,
      deletado: resultado.changes > 0
    };
  }

  /**
   * getStatus()
   * 
   * Retorna constantes de status
   * Útil para frontend saber quais são os status válidos
   */
  static getStatus() {
    return STATUS;
  }

  /**
   * getTipos()
   * 
   * Retorna constantes de tipos
   */
  static getTipos() {
    return TIPOS;
  }
}

export default Encomenda;