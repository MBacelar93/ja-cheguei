import Morador from "../models/Morador.js";
import Log from "../models/Log.js";

class MoradorController {

    static async criar(req, res) {
        try {
            const { nome, apartamento, bloco, telefone, email } = req.body;

            if (!nome || !apartamento || !bloco) {
                return res.status(400).json({
                    sucesso: false,
                    erro: 'Nome, apartamento e blocos são obrigatórios'
                });
            }

            const morador = await Morador.criar(
                { nome, apartamento, bloco, telefone, email },
                req.db
            );

            await Log.registrar(
                'sistema',
                {
                    morador_id: morador.id,
                    usuario: 'admin',
                    acao: `Morador ${morador.nome} cadastrado (Apto ${morador.apartamento} Bloco ${morador.bloco}))`
                },
                req.db
            );

            return res.status(201).json({
                sucesso: true,
                morador
            });

        } catch (erro) {
            console.error('❌ Erro em criar morador:', erro.message);

            await Log.registrar(
                'erro',
                {
                    usuario: 'admin',
                    acao: `Erro ao criar morador: ${erro.message}`
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
            const { status, bloco } = req.query;

            const filtros = {};
            if (status) filtros.status = status;
            if (bloco) filtros.bloco = bloco;

            const moradores = await Morador.listarTodos(req.db, filtros);

            return res.status(200).json({
                sucesso: true,
                total: moradores.length,
                moradores
            });
        } catch (erro) {
            console.erro('❌ Erro em listar moradores:', erro.message);

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

            const morador = await Morador.buscarPorId(id, req.db);

            if (!morador) {
                return res.status(404).json({
                    sucesso: false,
                    erro: `Morador ${id} não encontrado`
                });
            }

            return res.status(200).json({
                sucesso: true,
                morador
            });
        } catch (erro) {
            console.error('❌ Erro em buscarPorId:', erro.message);

            return res.status(500).json({
                sucesso: false,
                erro: erro.message
            })
        }
    }

    static async buscarPorApartamento(re, res) {
        try {
            const { apartamento, bloco } = req.params;

            if (!apartamento || !bloco) {
                return res.status(400).json({
                    sucesso: false,
                    erro: 'Apartamento e bloco são obrigatórios'
                });
            }

            const morador = await Morador.buscarPorApartamento(
                apartamento,
                bloco,
                req.db
            );

            if (!morador) {
                return res.status(404).json({
                    sucesso: false,
                    erro: `Morador do apto ${apartamento} bloco ${bloco} não encontrado`
                });
            }

            return res.status(200).json({
                sucesso: true,
                morador
            });
        } catch (erro) {
            console.error('❌ Erro em buscarPorApartamento:', erro.message);

            return res.status(500).json({
                sucesso: false,
                erro: erro.message
            });
        }
    }

    static async buscarPorNome(req, res) {
        try {
            const { nome } = req.params;

            if (!nome || nome.trim() === '') {
                return res.status(400).json({
                    sucesso: false,
                    erro: 'Nome é obrigatório para buscar'
                });
            }
            const moradores = await Morador.buscarPorNome(nome, req.db);

            return res.status(200).json({
                sucesso: true,
                total: moradores.length,
                moradores
            });

        } catch (erro) {
            console.error('❌ Erro em buscarPorNome:', erro.message);

            return res.status(500).json({
                sucesso: false,
                erro: message
            });
        }
    }

    static async atualizar(req, res) {
        try {
            const { id } = req.params;
            const dados = req.body;

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    sucesso: false,
                    erro: 'ID inválido'
                });
            }

            if (!Object.keys(dados).length) {
                return res.status(400).json({
                    sucesso: false,
                    erro: 'Nenhum dado para atualizar'
                });
            }

            const resultado = await Morador.atualizar(id, dados, req.db);

            if (!resultado.atualizado) {
                return res.status(400).json({
                    sucesso: false,
                    erro: resultado.mensagem
                });
            }

            await Log.registrar(
                'sistema',
                {
                    morador_id: id,
                    usuario: 'admin',
                    acao: `Morador ${id} atualizado: ${resultado.campos.join(', ')}`
                },
                req.db
            );

            return res.status(200).json({
                sucesso: true,
                resultado
            });

        } catch (erro) {
            console.error('❌ Erro em atualizar morador:', erro.message);

            return res.status(400).json({
                sucesso: false,
                erro: erro.message
            });
        }
    }

    static async desativar(req, res) {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    sucesso: false,
                    erro: 'ID inválido'
                });
            }

            const resultado = await Morador.desativar(id, req.db);

            if (resultado.desativado) {
                await Log.registrar(
                    'sistema',
                    {
                        morador_id: id,
                        usuario: 'admin',
                        acao: `Morador ${id} desativado`
                    }
                );
            }

            return res.status(200).json({
                sucesso: true,
                resultado
            });

        } catch (erro) {
            console.error('❌ Erro em desativar morador:', erro.message);

            return res.status(400).json({
                sucesso: false,
                erro: erro.message
            });
        }
    }

    static async ativar(req, res) {
        try {
            const { id } = req.parms;

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    sucesso: false,
                    erro: 'ID inválido'
                });
            }

            const resultado = await Morador.ativar(id, req.db);

            if (resultado.ativado) {
                await Log.registrar(
                    'sistema',
                    {
                        morador_id: id,
                        usuario: 'admin',
                        acao: `Morador ${id} ativado`
                    },
                    req.db
                );
            }

            return res.status(200).json({
                sucesso: true,
                resultado
            });
        } catch (erro) {
            console.error('❌ Erro em ativar morador:', erro.message);

            return res.status(400).json({
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

            const resultado = await Morador.deletar(id, req.db);

            if (!resultado.deletado) {
                return res.status(404).json({
                    sucesso: false,
                    erro: `Morador ${id} não encontrado`
                });
            }

            await Log.registrar(
                'sistema',
                {
                    morador_id: id,
                    usuario: 'admin',
                    acao: `Morador ${id} deletado do sistema`
                },
                req.db
            );

            return res.status(200).json({
                sucesso: true,
                resultado
            });

        } catch (erro) {
            console.error('❌ Erro em deletar morador:', erro.message);

            return res.status(500).json({
                sucesso: false,
                erro: erro.message
            });
        }
    }

    static async obterConstantes(req, res) {
        try {
            const constantes = {
                status: Morador.getStatus()
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
}

export default MoradorController;
