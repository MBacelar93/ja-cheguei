import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-super-segura-mude-em-producao';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'sua-chave-refresh-super-segura-mude-em-producao';

export function verifyToken(req, res, next) {
    try {
       
        
        let token = req.cookies.token;


        if (!token) {
            token = req.headers.authorization?.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                sucesso: false,
                erro: 'Token não encontrado'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        
        req.usuario = decoded;
        next();
    } catch (erro) {
        console.error('❌ Erro ao verificar token:', erro.message);
        return res.status(401).json({
            sucesso: false,
            erro: 'Token inválido ou expirado'
        });
    }
}



export function checkRole(...rolesPermitidos) {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401)({
                sucesso: false,
                erro: 'Não autenticado'
            });
        }

        if(!rolesPermitidos.includes(req.usuario.role)) {
            return res.status(403).json({
                sucesso: false,
                erro: 'Acesso negado. Role insulficiente'
            });
        }

        next();
    }
}


export function auditLog(acao) {
    return (req, res, next) => {
        if (req.usuario) {

            try {
                const sql = `
                    INSERT INTO audit_logs (usuario_id, acao, detalhes, ip)
                    VALUES (?, ?, ?, ?)
                `;

                req.db.run(sql, [
                    req.usuario.id,
                    acao,
                    JSON.stringify({url: req.originalUrl, method: req.method}),
                    req.ip
                ]);
            } catch (erro) {
                console.error('Erro ao registrar audit Log', erro);
            }
        }

        next();
    };
}

export { JWT_SECRET, JWT_REFRESH_SECRET };