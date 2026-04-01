//Controller de Encomendas

import Encomenda from '../models/Encomenda.js';
import Log from '../models/Log.js';

class EncomendaController {
    static async criar(req, res) {
        try {
            const { remetente, apartamento, bloco, tipo, numero, observacoes } = req.body;

            if (!remetente || !apartamento || !bloco) {
                return res.status(400).json({
                    sucesso: false,
                    erro: 'Remetente, apartamento e bloco são obrigatórios'
                });
            }

            const encomenda = await Encomenda.criar(
                { remetente, apartamento, bloco, tipo, numero, observacoes }, req.db
            );

            await Log.registrar(
                'cadastro',

                {
                    encomenda_id: encomenda.id,
                    usuario: 'porteiro',
                    acao: `Encomenda de ${encomenda.remetente} cadastrada (Apto ${encomenda.apartamento} Bloco ${encomenda.bloco})`
                },
                req.db
            );

            return res.status(201).json({
                sucesso: true,
                encomenda
            });
        } catch (erro) {
            console.error('❌ Erro em criar:', erro.message);

            await Log.registrar(
                'erro',
                {
                    usuario: 'porteiro',
                    acao: `Erro ao criar encomenda: ${erro.message}`
                },
                req.db
            ).catch(() => { });

            return res.status(400).json({
                sucesso: false,
                erro: erro.message
            });
        }
    }

    static async listar(req, res) {
        try {
            const { status, dias } = req.query;
            const filtros = {};
            if (dias) filtros.dias = dias;

            const encomendas = await Encomenda.listarTodas(req.db, filtros);

            return res.status(200).json({
                sucesso: true,
                total: encomendas.length,
                encomendas
            });
        } catch (erro) {
            console.error('❌ Erro em listar:', erro.message);

            return res.status(500).json({
                sucesso: false,
                erro: erro.message
            });
        }


    }

    static async buscarPorId(req, res) {
        try {
            const { id } = req.params;
            if (!id || isNaN(id)) {
                return res.status(400).json({
                    sucesso: false,
                    erro: 'ID inválido'
                });
            }

            const encomenda = await Encomenda.buscarPorId(id, req.db);

            if (!encomenda) {
                return res.status(400).json({
                    sucesso: false,
                    erro: `Encomenda ${id} não encontrada`
                });
            }

            return res.status(200).json({
                sucesso: true,
                encomenda
            });
        } catch (erro) {
            console.error('❌ Erro em buscarPorId:', erro.message);

            return res.status(500).json({
                sucesso: false,
                erro: erro.message
            });
        }
    }

    static async buscarPorApartamento(req, res) {
        try {
            const { apartamento, bloco } = req.params;

            if (!apartamento || !bloco) {
                return res.status(400).json({
                    sucesso: false,
                    erro: 'Apartamento e bloco são obrigatórios'
                });
            }

            const encomendas = await Encomenda.buscarPorApartamento(apartamento, bloco, req.db);

            return res.status(200).json({
                sucesso: true,
                total: encomendas.length,
                encomendas
            });
        } catch (erro) {
            console.error('❌ Erro em buscarPorApartamento:', erro.message);

            return res.status(500).json({
                sucesso: false,
                erro: erro.message
            });
        }
    }


    static async retirada(req, res) {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    sucesso: false,
                    erro: 'ID inválido'
                });
            }

            const resultado = await Encomenda.retirada(id, req.db);

            await Log.registrar(
                'retirada',
                {
                    encomenda_id: id,
                    usuario: 'porteiro',
                    acao: `Encomenda ${id} entregue ao morador`
                },
                req.db
            );

            return res.status(200).json({
                sucesso: true,
                resultado
            });
        } catch (erro) {
            console.error('❌ Erro em retirada:', erro.message);

            return res.status(400).json({
                sucesso: false,
                erro: erro.message
            });
        }
    }

    static async validar(req, res) {
        try {
            const { id } = req.params;
            const { morador_id } = req.body;

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    sucesso: false,
                    erro: 'ID inválido'
                });
            }

            const resultado = await Encomenda.validarEComplementar(
                id,
                morador_id,
                req.db
            );

            await Log.registrar(
                'validacao',
                {
                    encomenda_id: id,
                    morador_id,
                    usuario: 'sistema',
                    acao: `Encomenda ${id} validada e morador ${morador_id} complementado`
                },
                req.db
            );

            return res.status(200).json({
                sucesso: true,
                resultado
            });
        } catch (erro) {
            console.error('❌ Erro em validar:', erro.message);

            return res.status(400).json({
                sucesso: false,
                erro: erro.message
            });
        }
    }


    static async enviarParaAdmin(req, res) {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    sucesso: false,
                    erro: 'ID inválido'
                });
            }

            const resultado = await Encomenda.enviarParaAdmin(id, req.db);

            await Log.registrar(
                'admin_move',
                {
                    encomenda_id: id,
                    usuario: 'sistema',
                    acao: `Encomenda ${id} movida para arquivo (15+ sem atualização)`
                },
                req.db
            );

            return res.status(200).json({
                sucesso: true,
                resultado
            });
        } catch (erro) {
            console.error('❌ Erro em enviarParaAdmin:', erro.message);

            return res.status(400).json({
                sucesso: false,
                erro: erro.message
            });
        }
    }

    static async obterConstantes(req, res) {
        try {
            const constantes = {
                status: Encomenda.getStatus(),
                tipos: Encomenda.getTipos()
            };

            return res.status(200).json({
                sucesso: true,
                constantes
            });
        } catch (erro) {
            console.error('❌ Erro em obterConstantes:', erro.message);

            return res.status(500).json({
                sucesso: false,
                erro: erro.message
            });
        }
    }

    static async deletar(req, res) {
        try {

            const { id } = req.params;

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    sucesso: false,
                    erro: 'ID inválido'
                });
            }


            const resultado = await Encomenda.deletar(id, req.db);

            if (!resultado.deletado) {
                return res.status(404).json({
                    sucesso: false,
                    erro: `Encomenda ${id} não encontrada`
                });
            }


            await Log.registrar(
                'sistema',
                {
                    encomenda_id: id,
                    usuario: 'admin',
                    acao: `Encomenda ${id} deletada do sistema`
                },
                req.db
            );


            return res.status(200).json({
                sucesso: true,
                resultado
            });
        } catch (erro) {
            console.error('❌ Erro em deletar:', erro.message);

            return res.status(500).json({
                sucesso: false,
                erro: erro.message
            });
        }
    }

}

export default EncomendaController;