import { Router } from 'express';
import AuthController from '../controllers/AuthController.js';
import { verifyToken, auditLog } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req, res, next) => {
    await AuthController.login(req, res);
});


router.post('/logout',
    verifyToken,
    auditLog('LOGOUT'),
    async (req, res, next) => {
        
        if (!req.db) {
            console.log('❌ req.db é undefined!');
            return res.status(500).json({
                sucesso: false,
                erro: 'Erro interno: banco de dados não disponível'
            });
        }
        
        await AuthController.logout(req, res);
    }
);

router.post('refresh', async (req, res, next) => {
    req.db = req.app.locals.db;
    await AuthController.refresh(req, res);
});

router.get('/me',
    verifyToken,
    auditLog('CONSULTOU_DADOS'),
    async (req, res, next) => {
        await AuthController.me(req, res);
    }
);

export default router;