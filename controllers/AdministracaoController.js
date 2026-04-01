import Encomenda from '../models/Encomenda';
import Morador from '../models/Morador';
import Log from '../models/Log';

class AdminController {
    static async getDashboard(req, res) {
        try {
            const statusPossiveis = Encomenda.getStatus();
            const encomendas = {};

            for (const [chaves, status] of Object.entries(statusPossives)) {
                const lista = await Encomenda.buscarPorStatus(status, req.db);
                const chaveFormatada = `total_${chaves.toLocaleLowerCase()}`;
                encomendas[chaveFormatada] = lista.length;
            }

            const statusAtivos = await Morador.listarTodos(req.db, { status: 'ativo' });
            const statusInativos = await Morador.listarTodos(req.db, { status: 'inativo' });

            const moradores = {
                total_ativos: statusAtivos.length,
                total_inativos: statusInativos.length
            };

            const agora = new Date();
            const ontemData = new Date(agora.getTime() - 24 * 60 * 60 * 1000);
            const ontemISO = ontemData.toISOString();

            const logs24h = await Log.listarTodos(req.db, {
                dataInicio: ontemISO,
                limite: 1000
            });

            const seteDiasAtras = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
            const seteDiasAtrasISO = seteDiasAtras.toISOString();

            const logs7d = await Log.listarTodos(req.db, {
                dataInicio: seteDiasAtrasISO,
                limite: 1000
            });

            const logs = {
                ultimas_24h: logs24h.length,
                ultimas_7d: logs7d.length
            };

            return res.status(200).json({
                sucesso: true,
                dashboard: {
                    encomendas,
                    moradores,
                    logs
                }
            });
        } catch (erro) {
            console.error('❌ Erro em getDashboard:', erro.message);

            return res.status(500).json({
                sucesso: false,
                erro: erro.message
            });
        }
    }

    static async getEncomendasPendentes(req, res) {
        try {
            const pendentes = await Encomenda.buscarPorStatus(
                Encomenda.getStatus().PENDENTE_VALIDACAO,
                req.db
            );

            const encaminhadas = await Encomenda.buscarPorStatu(
                Encomenda.getStatus().ENCAMINHADA_ADMIN,
                req.db
            );

            return res.status(200).json({
                sucesso: true,
                pendentes: {
                    validacao: {
                        total: pendentes.length,
                        items: pendentes
                    },
                    admin: {
                        total: encaminhadas.length,
                        items: encaminhadas
                    }
                }
            });
        } catch (erro) {
            console.error('❌ Erro em getEncomendasPendentes:', erro.message);

            return res.status(500).json({
                sucesso: false,
                erro: erro.message
            });
        }
    }

    static async processarRotina15Dias(req, res) {
        try {
            console.log('🔄 Iniciando rotina de 15 dias...');

            const elegiveis = await Encomenda.listarTodas(req.db, { dias: 15 });


            if (elegiveis.length === 0) {
                console.log('✅ Nenhuma encomenda elegível para arquivo');
                return res.status(200).json({
                    sucesso: true,
                    processadas: 0,
                    mensagem: 'Nenhuma encomenda elegível para arquivo'
                });
            }

            console.log(`⏳ Processando ${elegiveis.length} encomendas...`);


            let processadas = 0;
            let erros = 0;

            for (const encomenda of elegiveis) {
                try {
                    const atualizacao = await Encomenda.buscarPorId(encomenda.id, req.db);

                    if (atualizacao && atualizacao.status === Encomenda.getStatus().ATIVA) {
                        await Encomenda.enviarParaAdmin(encomenda.id, req.db);

                        await Log.registrar(
                            'admin_move',
                            {
                                encomenda_id: encomenda.id,
                                usuario: 'sistema',
                                acao: `Encomenda movida para arquivo (15+ duas sem atualização)`
                            },
                            req.db
                        );

                        processadas++;
                    }
                } catch (erroItem) {
                    console.error(`❌ Erro processando encomenda ${encomenda.id}:`, erroItem.message);
                    erros++;
                }
            }

            await Log.registrar(
                'sistema',
                {
                    usuario: 'sistema',
                    acao: `Rotina de 15 dias executada: ${processadas} processadas, ${erros} erros`
                },

                req.db
            );

            console.log(`✅ Rotina completa: ${processadas} processadas, ${erros} erros`);


            return res.status(200).json({
                sucesso: true,
                processadas,
                erros,
                mensagem: `Rotina executada: ${processadas} encomendas movidas para arquivo`
            });
        } catch (erro) {
            console.error('❌ Erro fatal em processarRotina15Dias:', erro.message);

            await Log.registrar(
                'erro',
                {
                    usuario: 'sistema',
                    acao: `ERRO CRÍTICO na rotina de 15 dias: ${erro.message}`
                },
                req.db
            ).catch(() => { });

            return res.status(500).json({
                sucesso: false,
                erro: erro.mensagem
            });
        }
    }


    static async getLogs(req, res) {
        try {
            const { tipo, usuario, limite } = req.query;
            const filtros = {};
            if (tipo) filtros.tipo = tipo;
            if (usuario) filtros.usuario = usuario;
            if (limite) filtros.limite = parseInt(limite);

            const logs = await Log.listarTodos(req.db, filtros);

            return res.status(200).json({
                sucesso: true,
                total: logs.length,
                logs
            });
        } catch (erro) {
            console.error('❌ Erro em getLogs:', erro.message);

            return res.status(500).json({
                sucesso: false,
                erro: erro.message
            });

        }
    }

    static async getLogsPorEncomenda(req, res) {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    sucesso: false,
                    erro: 'ID de encomenda inválido'
                });
            }

            const encomenda = await Encomenda.buscarPorId(id, req.db);

            if (!encomenda) {
                return res.status(400).json({
                    sucesso: false,
                    erro: `Encomenda ${id} não encontrada`
                });
            }

            const logs = await Log.buscarPorEncomenda(id, req.db);

            return res.status(200).json({
                sucesso: true,
                encomenda,
                logs
            });
        } catch (erro) {
            console.error('❌ Erro em getLogsPorEncomenda:', erro.message);

            return res.status(500).json({
                sucesso: false,
                erro: erro.message
            });
        }
    }

    static async getEstatisticas(req, res) {
        try {
            const stats = await Log.obterEstatistica(req.db);

            const total = Object.values(stats).reduce((a, b) => a + b, 0);

            const percentuais = {};
            for (const [chave, valor] of Object.entries(stats)) {
                percentuais[chave] = total > 0 ? ((valor / total) * 100).toFixed(2) : 0;
            }

            return res.status(200).json({
                sucesso: true,
                estatistica: {
                    totais: stats,
                    percentuais,
                    total_geral: total
                }
            });
        } catch (erro) {
            console.error('❌ Erro em getEstatísticas:', erro.message);

            return res.status(500).json({
                sucesso: false,
                erro: erro.message
            });
        }
    }

    static async limparLogs(req, res) {
        try {
            const { dias_retencao } = req.body;

            if (!dias_retencao || isNaN(dias_retencao) || dias_retencao < 1) {
                return res.status(400).json({
                    sucesso: false,
                    erro: 'dias_retencao deve ser >= 1'
                });
            }

            const resultado = await Log.limparLogs(dias_retencao, req.db);

            await Log.registrar(
                'sistema',
                {
                    usuario: 'admin',
                    acao: `${resultado.deletados} logs deletados (retenção de ${dias_retencao} dias)`
                },
                req.db
            );

            return res.status(200).json({
                sucesso: true,
                resultado
            });
        } catch (erro) {
            console.error('❌ Erro em limparLogs:', erro.message);

            return res.status(400).json({
                sucesso: false,
                erro: erro.message
            });
        }
    }

    static async getStatusSistema(req, res) {
        try {

            const resultado = await req.db.get(
                'SELECT COUNT(*) as total FROM encomendas',
                []
            );

            return res.status(200).json({
                sucesso: true,
                status: 'OK',
                banco_de_dados: {
                    conectado: true,
                    total_encomendas: resultado.total
                },
                timestamp: new Date().toISOString()
            });
        } catch (erro) {
            console.error('❌ Erro em getStatusSistema:', erro.message);

            return res.status(500).json({
                sucesso: false,
                status: 'ERRO',
                banco_de_dados: {
                    conectado: false,
                    erro: erro.message
                },
                timestamp: new Date().toISOString()
            });
        }
    }
}

export default AdminController;