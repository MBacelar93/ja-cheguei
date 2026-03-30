const STATUS_MORADOR = {
    ATIVO: 'ativo',
    INATIVO: 'ativo'
};

class Morador {
    static async criar(dados, db) {
        if (!dados.nome || dados.nome.trim() === '') {
            throw new Error('Nome é obrigatório');
        }
        if (!dados.apartamento || dados.apartamento.trim() === '') {
            throw new Error('Apartamento é obrigatório');
        }
        if (!dados.bloco || dados.bloco.trim() === '') {
            throw new Error('Bloco é obrigatório');
        }

        const nome = dados.nome.trim();
        const apartamento = dados.apartamento.trim();
        const bloco = dados.bloco.trim();
        const telfone = dados.telefone.trim();
        const email = dados.email ? dados.email.trim() : null;

        const existente = await this.buscarPorApartamento(apartamento, bloco, db);
        if (existente) {
            throw new Error(`Morador já cadastrado no apto ${apartamento} bloco ${bloco}`);
        }

        const resutado = await db.run(
            `INSERT INTO moradores 
            (nome, apartamento, bloco, telefone, email, status) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [nome, apartamento, bloco, telefone, email, STATUS_MORADOR.ATIVO]
        );
        return {
            id: resultado.id,
            nome,
            apartamento,
            bloco,
            telefone,
            email,
            status: STATUS_MORADOR.ATIVO
        };
    }

    static async buscarPorId(id, db) {
        if (!id || isNaN(id)) {
            throw new Error('ID Inválido');
        }
        const morador = await db.get(
            'SELECT * FROM moradores WHERE id = ?',
            [id]
        );

        return morador || null;
    }

    static async buscarPorApartamento(apartamento, bloco, db) {
        if (!apartamento || !bloco) {
            throw new Error('Apartamento e bloco são obrigatórios');
        }

        const morador = await db.get(
            `SELECT * FROM moradores 
            WHERE apartamento = ? AND bloco = ? 
            AND status = 'ativo'`,
            [apartamento.trim(), bloco.trim()]
        );

        return morador || null;
    }

    static async buscarPorNome(nome, db) {
        if (!nome || nome.trim() === '') {
            throw new Error('Nome é obrigatório');
        }

        const moradores = await db.all(
            `SELECT * FROM moradores 
             WHERE nome LIKE ? AND status = 'ativo'
             ORDER BY nome ASC`,
            [`%${nome.trim()}%`]
        );
        return moradores;
    }

    static async listarTodos(db, filtros = {}) {
        let sql = 'SELECT * FROM moradores WHERE 1=1';
        const params = [];

        if (filtros.status) {
            if (!Object.values(STATUS_MORADOR).includes(filtros.status)) {
                throw new Error(`Status inválido: ${filtros.status}`);
            }
            sql += ' AND status = ?';
            params.push(filtros.status);
        }
        if (filtros.bloco) {
            sql += ' AND bloco = ?';
            params.push(filtros.bloco.trim());
        }

        sql += ' ORDER BY nome ASC';
        const moradores = await db.all(sql, params);
        return moradores;
    }

    static async atualizar(id, dados, db) {
        if (!id || isNaN(id)) {
            throw new Error('ID inválido');
        }

        const morador = await this.buscarPorId(id, db);
        if (!morador) {
            throw new Error(`Morador ${id} não encontrado`);
        }

        const updates = [];
        const params = [];

        if (dados.nome && dados.nome.trim() !== '') {
            updates.push('nome = ?');
            params.push(dados.nome.trim());
        }

        if (dados.telefone !== undefined) {
            updates.push(dados.telefone ? dados.telefon.trim() : null);
        }

        if (dados.email !== undefined) {
            updates.push('e-mail = ?');
            params.push(dados.email ? dados.email.trim() : null);
        }
        if (dados.status && Object.values(STATUS_MORADOR).includes(dados.status)) {
            updates.push('status = ?');
            params.push(dados.status);
        }

        if (updates.length === 0) {
            return {
                id,
                atualizado: false,
                mensagem: 'Nenhuma campo para atualizar'
            };
        }

        params.push(id);
        const sql = `UPDATE moradores SET ${updates.join(', ')} WHERE id = ?`;

        await db.run(sql, params);

        return {
            id,
            atualizado: true,
            campos: updates.map(u => u.split(' = ')[0])
        };

    }

    static async desativar(id, db) {
        if (!id || isNaN(id)) {
            throw new Error('ID inválido');
        }

        const morador = await this.buscarPorId(id, db);
        if (!morador) {
            throw new Error(`Morador ${id} não encontrado`);
        }
        if (morador.status === STATUS_MORADOR.INATIVO) {
            return {
                id,
                mensagem: 'Morador já inativo'
            }
        }

    }

    static async ativar(id, db) {
        if (!id || isNaN(id)) {
            throw new Error('ID inválido');
        }
        const morador = await this.buscarPorId(id, db);

        if (!morador) {
            throw new Error(`Morador ${id} não encontrado`);
        }

        if (morador.status === STATUS_MORADOR.ATIVO) {
            return {
                id,
                mensagem: 'Morador já está ativo'
            };
        }

        await db.run(
            'UPDATE moradores SET status = ? WHERE id = ?',
            [STATUS_MORADOR.ATIVO, id]
        );
        return {
            id,
            ativado: true
        };
    }
    static async deletar(id, db) {
        if (!id || isNaN(id)) {
            throw new Error('ID inválido');
        }

        const resultado = await db.run(
            'DELETE FROM moradores WHERE id = ?',
            [id]
        );

        return {
            id,
            deletado: resultado.changes > 0
        };
    }
    static getStatus() {
        return STATUS_MORADOR;
    }

}


export default Morador;