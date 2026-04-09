import bcryptjs from "bcryptjs";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-super-segura-mude-em-producao';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'sua-chave-refresh-super-segura-mude-em-producao';

class AuthController {
    static async login(req, res) {
    try {
        const { email, senha } = req.body;


        if (!email || !senha) {
            return res.status(400).json({
                sucesso: false,
                erro: 'Email e senha são obrigatórios'
            });
        }

        const sqlUsuario = `
            SELECT u.id, u.email, u.nome, u.senha_hash, u.ativo,
                GROUP_CONCAT(r.nome) as roles
            FROM usuarios u
            LEFT JOIN user_roles ur ON u.id = ur.usuario_id
            LEFT JOIN roles r ON ur.role_id = r.id
            WHERE u.email = ?
            GROUP BY u.id
        `;

        const usuario = await req.db.get(sqlUsuario, [email]);

        

        if (!usuario) {
            
            return res.status(401).json({
                sucesso: false,
                erro: 'Email ou senha incorretos'
            });
        }

        console.log('✅ Usuário encontrado:', usuario.email);

        if (!usuario.ativo) {
            console.log('❌ Usuário inativo');
            return res.status(401).json({
                sucesso: false,
                erro: 'Usuário inativo. Contate o Administrador'
            });
        }

        const senhaValida = await bcryptjs.compare(senha, usuario.senha_hash);

    

        if (!senhaValida) {
            console.log('❌ Senha incorreta');
            return res.status(401).json({
                sucesso: false,
                erro: 'Email ou senha incorretos'
            });
        }


        const rolesPrincipal = usuario.roles ? usuario.roles.split(',')[0] : 'Porteiro';

        const accessToken = jwt.sign({
            id: usuario.id,
            email: usuario.email,
            nome: usuario.nome,
            role: rolesPrincipal
        },
            JWT_SECRET,
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            {
                id: usuario.id,
                email: usuario.email
            },
            JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        const sqlLastLogin = `
            UPDATE usuarios 
            SET ultimo_login = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        await req.db.run(sqlLastLogin, [usuario.id]);

        const sqlAudit = `
            INSERT INTO audit_logs (usuario_id, acao, detalhes, ip)
            VALUES (?, ?, ?, ?)    
        `;

        await req.db.run(sqlAudit, [
            usuario.id,
            'LOGIN',
            JSON.stringify({ email: usuario.email }),
            req.ip
        ]);


        res.cookie('token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });


        return res.status(200).json({
            sucesso: true,
            mensagem: 'Login realizado com sucesso',
            usuario: {
                id: usuario.id,
                email: usuario.email,
                nome: usuario.nome,
                role: rolesPrincipal
            },
            tokens: {
                accessToken: accessToken,
                refreshToken: refreshToken
            }
        });
    } catch (erro) {
        console.error('❌ Erro em login:', erro);
        return res.status(500).json({
            sucesso: false,
            erro: 'Erro ao fazer login'
        });
    }
}


    static async logout(req, res) {
        try {
            if (req.usuario) {
                const sqlAudit = `
                    INSERT INTO audit_logs (usuario_id, acao, detalhes, ip)
                    VALUES (?, ?, ?, ?)               
                `;
                await req.db.run(sqlAudit, [
                    req.usuario.id,
                    'LOGOUT',
                    JSON.stringify({ email: req.usuario.mail }),
                ]);
            }

            res.clearCookie('token');
            res.clearCookie('refreshToken');

            return res.status(200).json({
                sucesso: true,
                mensagem: 'Logout realizado com sucesso'
            });
        } catch (erro) {
            console.error('❌ Erro em logout:', erro);
            return res.status(500).json({
                sucesso: false,
                erro: 'Erro ao fazer logout'
            });
        }
    }

    static async refresh(req, res) {
        try {
            const refreshToken = req.cookies?.refreshToken;

            if (!refreshToken) {
                return res.status(401).json({
                    sucesso: false,
                    erro: 'Refresh token não encontrado'
                });
            }

            const sqlUsuario = `
                SELECT u.id, u.email, u.nome, u.ativo,
                    GROUP_CONCAT(r.nome) as roles
                FROM usuarios u
                LEFT JOIN user_roles ur ON u.id = ur.usuario_id
                LEFT JOIN roles r ON ur.role_id = r.id
                WHERE u.id = ?
                GROUP BY u.id
            `;

            const usuario = await req.db.get(sqlUsuario, [decode.id]);

            if (!usuario || !usuario.ativo) {
                return res.status(401).json({
                    sucesso: false,
                    erro: 'Usuário inativo ou não encontrado'
                });
            }

            const rolesPrincipal = usuario.roles ? usuario.roles.spli(',')[0] : 'Porteiro';

            const novoAccessToken = jwt.sign(
                {
                    id: usuario.id,
                    email: usuario.email,
                    nome: usuario.nome,
                    role: rolesPrincipal
                },
                JWT_SECRET,
                { expiresIn: '15m' }
            );

            res.cookie('token', novoAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 15 * 60 * 1000
            });

            const sqlAudit = `
                INSERT INTO audit_logs (usuario_id, acao, detalhes, ip)
                VALUES (?, ?, ?, ?)  
            `;
            await req.db.run(sqlAudit, [
                usuario.id,
                'REFRESH_TOKEN',
                JSON.stringify({ email: usuario.email }),
                req.ip
            ]);

            return res.status(200).json({
                sucesso: true,
                mensagem: 'Token renovado com sucesso',
                accessToken: novoAccessToken
            });

        } catch (erro) {
            console.error('❌ Erro em refresh:', erro);
            return res.status(500).json({
                sucesso: false,
                erro: 'Erro ao renovar token'
            });
        }
    }


    static async me(req, res) {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    sucesso: false,
                    erro: 'Não autenticado'
                });
            }

            const sqlUsuario = `
                SELECT u.id, u.email, u.nome, u.ativo,
                    GROUP_CONCAT(r.nome) as roles
                FROM usuarios u
                LEFT JOIN user_roles ur ON u.id = ur.usuario_id
                LEFT JOIN roles r ON ur.role_id = r.id
                WHERE u.id = ?
                GROUP BY u.id
            `;

            const usuario = await req.db.get(sqlUsuario, [req.usuario.id]);

            if (!usuario) {
                return res.status(404).json({
                    sucesso: false,
                    erro: 'Usuário não encontrado'
                });
            }

            return res.status(200).json({
                sucesso: true,
                usuario: {
                    id: usuario.id,
                    email: usuario.email,
                    nome: usuario.nome,
                    ativo: usuario.ativo,
                    roles: usuario.roles ? usuario.roles.split(',') : []
                }
            });
        } catch (erro) {
            console.error('❌ Erro em me:', erro);
            return res.status(500).json({
                sucesso: false,
                erro: 'Erro ao buscar dados do usuário'
            });
        }
    }
}

export default AuthController;