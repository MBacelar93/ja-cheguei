import { Router } from 'express';
import AdminController from '../controllers/AdministracaoController';
 
const router = Router();

router.get('/status', AdminController.getStatusSistema);
router.get('/dashboard', AdminController.getDashboard);
router.get('/encomendas-pendentes', AdminController.getEncomendasPendentes);
router.get('/logs', AdminController.getLogs);
router.get('/logs/encomenda/:id', AdminController.getLogsPorEncomenda);


router.get('/estatisticas', AdminController.getEstatisticas);


router.post('/rotina-15-dias', AdminController.processarRotina15Dias);


router.delete('/logs/limpar', AdminController.limparLogs);

export default router;