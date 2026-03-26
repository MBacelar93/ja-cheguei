
const STATUS = {
  ATIVA: 'Ativa',
  RETIRADA: 'Retirada',
  PENDENTE_VALIDACAO: 'Pendente validacao',
  ENCAMINHADA_ADMIN: 'Encaminhada admin'
};

const TIPOS = ['pacote', 'carta', 'documento', 'caixa', 'outro'];


class Encomenda {

  static async criar(dados, db) {

    
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


    const remetente = dados.remetente.trim();
    const apartamento = dados.apartamento.trim();
    const bloco = dados.bloco.trim();
    const tipo = dados.tipo || 'pacote'; // Default
    const numero = dados.numero ? dados.numero.trim() : null;
    const morador_id = dados.morador_id || null;
    const observacoes = dados.observacoes ? dados.observacoes.trim() : null;


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
        STATUS.ATIVA,
        observacoes
      ]
    );


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

  static async buscarPorStatus(status, db) {

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


  static async listarTodas(db, filtros = {}) {
    let sql = 'SELECT * FROM encomendas WHERE 1=1';
    const params = [];


    if (filtros.status) {
      if (!Object.values(STATUS).includes(filtros.status)) {
        throw new Error(`Status inválido: ${filtros.status}`);
      }
      sql += ' AND status = ?';
      params.push(filtros.status);
    }


    if (filtros.dias && !isNaN(filtros.dias)) {
      const dias = parseInt(filtros.dias);
      sql += ` AND status = 'Ativa' 
              AND DATE(data_recebimento) <= DATE('now', '-${dias} days')`;
    }

    sql += ' ORDER BY data_atualizacao DESC';

    const encomendas = await db.all(sql, params);
    return encomendas;
  }


  static async atualizarStatus(id, novoStatus, db) {

    if (!id || isNaN(id)) {
      throw new Error('ID inválido');
    }

    if (!Object.values(STATUS).includes(novoStatus)) {
      throw new Error(`Status inválido: ${novoStatus}`);
    }

    
    const encomenda = await this.buscarPorId(id, db);
    if (!encomenda) {
      throw new Error(`Encomenda com ID ${id} não encontrada`);
    }

   
    const updateData = {
      status: novoStatus,
      data_atualizacao: new Date().toISOString().replace('T', ' ').split('.')[0]
    };

  
    if (novoStatus === STATUS.RETIRADA) {
      updateData.data_retirada = new Date().toISOString().replace('T', ' ').split('.')[0];
    }

  
    const sql = `UPDATE encomendas 
                 SET status = ?, data_atualizacao = ?`;
    const params = [updateData.status, updateData.data_atualizacao];

  
    if (updateData.data_retirada) {
      sql += ', data_retirada = ?';
      params.push(updateData.data_retirada);
    }

    sql += ' WHERE id = ?';
    params.push(id);

    await db.run(sql, params);

  
    return {
      id,
      statusAnterior: encomenda.status,
      statusNovo: novoStatus,
      atualizado_em: updateData.data_atualizacao
    };
  }


  static async validarEComplementar(id, morador_id, db) {
    if (!id || isNaN(id)) {
      throw new Error('ID inválido');
    }

    if (!morador_id || isNaN(morador_id)) {
      throw new Error('ID do morador inválido');
    }

  
    const encomenda = await this.buscarPorId(id, db);
    if (!encomenda) {
      throw new Error(`Encomenda ${id} não encontrada`);
    }

   
    if (encomenda.status !== STATUS.PENDENTE_VALIDACAO) {
      throw new Error(`Encomenda não está pendente validação (atual: ${encomenda.status})`);
    }

   
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

 
  static async retirada(id, db) {
    return this.atualizarStatus(id, STATUS.RETIRADA, db);
  }

 
  static async enviarParaAdmin(id, db) {
    return this.atualizarStatus(id, STATUS.ENCAMINHADA_ADMIN, db);
  }


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


  static getStatus() {
    return STATUS;
  }


  static getTipos() {
    return TIPOS;
  }
}

export default Encomenda;