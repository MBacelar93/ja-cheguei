import { Router } from 'express';
import AuthController from '../controllers/AuthController.js';
import { verifyToken, auditLog } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req, res, next) => {
    req.db = req.app.locals.db;
    await AuthController.login(req, res);
});


router.post('/logut',
    verifyToken,
    auditLog('LOGOUT'),
    async (req, res, next) => {
        req.db = req.app.locals.db;
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
        req.db = req.app.locals.db;
        await AuthController.me(req, res);
    }
);

export default router;