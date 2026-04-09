import { Router } from 'express';
import AdminController from '../controllers/AdministracaoController.js';
import { verifyToken, checkRole, auditLog } from '../middleware/auth.js';
 
const router = Router();

router.get('/status', AdminController.getStatusSistema);



router.get('/dashboard', 
    verifyToken,
    checkRole('Administração', 'Admin do Sistema'),
    auditLog('Acessou dashboard'),
    AdminController.getDashboard
);
router.get('/encomendas-pendentes', 
    verifyToken,
    checkRole('Administração', 'Admin do Sistema'),
    auditLog('Consultou pendentes'),
    AdminController.getEncomendasPendentes
);
router.get('/logs', 
    verifyToken,
    checkRole('Administração', 'Admin do Sistema'),
    auditLog('Consultou logs'),
    AdminController.getLogs
);
router.get('/logs/encomenda/:id', 
    verifyToken,
    checkRole('Administração', 'Admin do Sistema'),
    auditLog('Consultou log de encomenda'),
    AdminController.getLogsPorEncomenda
);
router.get('/estatisticas', 
    verifyToken,
    checkRole('Administração', 'Admin do Sistema'),
    auditLog('Consultou estatísticas'),
    AdminController.getEstatisticas
);



router.post('/rotina-15-dias', 
    verifyToken,
    checkRole('Admin do Sistema'),
    auditLog('Executou rotina 15 dias'),
    AdminController.processarRotina15Dias
);



router.delete('/logs/limpar', 
    verifyToken,
    checkRole('Admin do Sistema'),
    auditLog('Limpou logs'),
    AdminController.limparLogs
);

export default router;