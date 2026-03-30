const TIPOS_LOG = {
    CADASTRO:  'cadastro',
    RETIRADA: 'retirada',
    VALIDACAO: 'validacao',
    ADMIN_MOVE: 'admin_move',
    EXCECAO: 'excecao',
    SISTEMA: 'sistema',
    ERRO: 'error'
};

const USUARIOS = {
    PORTEIRO: 'porteiro',
    MORADOR: 'morador',
    ADMIN: 'admin',
    SISTEMA: 'sistema'
};

class Log {
    static async registrar(tipo, dados, db) {
        if (!Object.values(TIPOS_LOG).includes(tipo)) {
            console.warn(`⚠️ Tipo de log inválido: ${tipo}`);
            tipo = TIPOS_LOG.SISTEMA;
        }
        
        if (!dados.usuario) {
            throw new Error('Usuário é o obrigatório em log');
        }

        if (!dados.acao || dados.acao.trim() === '') {
            throw new Error('Ação é obrigatório em log');
        }

        const encomenda_id = dados.encomenda_id || null;
        const morador_id = dados.morador_id || null;
        const usuario = dados.usuario.trim();
        const acao = dados.acao.trim();


        const resultado = await db.run(
            `INSERT INTO logs 
            (tipo, encomenda_id, morador_id, usuario, acao) 
            VALUES (?, ?, ?, ?, ?)`,
            [tipo, encomenda_id, morador_id, usuario, acao]
        );

        return {
            id: resultado.id,
            tipo,
            encomenda_id,
            morador_id,
            usuario,
            acao,
            data: new Date().toISOString()
        };
    }

    static async buscarPorEncomenda(encomenda_id, db) {
        if (!encomenda_id || isNaN(encomenda_id)){
            throw new Error('ID de encomenda inválido');
        }

        const logs = await db.all(
            `SELECT * FROM logs 
            WHERE encomenda_id = ? 
            ORDER BY data DESC`,
            [encomenda_id]
        );

        return logs;
    }

    static async buscarPorMorador(morador_id, db) {
        if (!morador_id || isNaN(morador_id)) {
            throw new Error('ID de morador inválido');
        }

        const logs = await db.all(
            `SELECT * FROM logs 
            WHERE morador_id = ? 
            ORDER BY data DESC`,
            [morador_id]
        );

        return logs;
    }

    static async buscarPorTipo(tipo, db, filtros = {}) {
        if (!Object.values(TIPOS_LOG).includes(tipo)) {
            throw new Error(`Tipo de log inválido: ${tipo}`);
        }

        let sql = 'SELECT * FROM logs WHERE tipo = ?';
        const params = [tipo];

        if (filtros.usuario) {
            sql += ' AND usuarios = ?';
            params.push(filtros.usuario);
        }

        if (filtros.dataInicio) {
            sql += ` AND data >= ?`;
            params.push(filtros.dataInicio);
        }

        if (filtros.dataFim) {
            sql += ` AND data <= ?`;
            params.push(filtros.dataFim)
        }

        sql += ` ORDER BY data desc`;

        const logs = await db.all(sql, params);
        return logs;
    }

    static async listarTodos(db, filtros = {}) {
        let sql = 'SELECT * FROM logs WHERE 1=1';
        const params = [];

        if (filtros.usuario) {
            sql += ' AND usuario = ?';
            params.push(filtros.usuario);
        }

        if (filtros.dataInicio) {
            sql += ' AND data >= ?';
            params.push(filtros.dataInicio);
        }

        if (filtros.dataFim) {
            sql += ' AND data <= ?';
            params.push(filtros.dataFim);
        }

        sql += ' ORDER BY data DESC LIMIT ?';
        const limite = filtros.limite || 100;
        params.push(limite);

        const logs = await db.all(sql, params);
        return logs;
    }


    static async buscarPorId(id, db) {
        if (!id || isNaN(id)) {
            throw new Error('ID inválido');
        }

        const log = await db.get(
            'SELECT * FROM logs WHERE id = ?',
            [id]
        );

        return log || null;
    }

    static async obterEstatistica (db, filtros = {}) {
        for (const [chave, tipo] of Object.entreies(TIPOS_LOG)) {
            let sql = 'SELECT COUNT (*) as total FROM logs WHERE tipo = ?';
            const params = [tipo];

            if (filtros.dataInicio) {
                sql += ' AND data >= ?';
                params.push(filtros.dataInicio);
            }

            if (filtros.dataFim) {
                sql += ' AND data <= ?';
            }

            const row = await db.get(sql, params);
            resultado[chave.toLowerCase()] = row?.total || 0;
        }
        return resultado;
    }

    static async limparLogs (diasRetencao, db) {
        if (!diasRetencao || isNaN(diasRetencao) || diasRetencao < 1) {
            throw new Error('Dias de retenção deve ser >= 1');
    
        }

        const resultado = await db.run(
            `DELETE FROM logs 
            WHERE DATE(data) <= DATE('now', '-${diasRetencao} days')`,
            []
        );

        return {
            deletados: resultado.changes,
            mensagem: `Removidos ${resultado.changes} logs com mais de ${diasRetencao} dias`
        };
    }

    static getConstantes() {
    return {
      tipos: TIPOS_LOG,
      usuarios: USUARIOS
    };
  }
}

export default Log;