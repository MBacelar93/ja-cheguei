import { Router } from 'express';
import EncomendaController from '../controllers/EncomendaController.js';
import { verifyToken, checkRole, auditLog } from '../middleware/auth.js';

const router = Router();

router.get('/constante', EncomendaController.obterConstantes);


router.get('/listar', 
    verifyToken,
    checkRole('Porteiro', 'Administração'),
    auditLog('Listou encomendas'), 
    EncomendaController.listar
);
router.get('/id',
    verifyToken,
    checkRole('Porteiro', 'Administração'),
    auditLog('Listou encomendas'),
    EncomendaController.buscarPorId
);
router.get('/apartamento/:apartamento/:bloco', 
    verifyToken,
    checkRole('Porteiro', 'Administração'),
    auditLog('Buscou por apartamento'),
    EncomendaController.buscarPorApartamento
);



router.post('/criar', 
    verifyToken,
    checkRole('Porteiro', 'Administração'),
    auditLog('Criou encomenda'),
    EncomendaController.criar
);



router.put('/:id/retirada', 
    verifyToken,
    checkRole('Porteiro', 'Administração'),
    auditLog('Marcou retirada'),
    EncomendaController.retirada
);
router.put('/:id/validar', 
    verifyToken,
    checkRole('Porteiro', 'Administração'),
    auditLog('Validou encomenda'),
    EncomendaController.validar
);
router.put('/:id/enviar-admin', 
    verifyToken,
    checkRole('Administração'),
    auditLog('Enviou para admin'),
    EncomendaController.enviarParaAdmin
);



router.delete('/:id', 
    verifyToken,
    checkRole('Administração'),
    auditLog('Deletou encomenda'),
    EncomendaController.deletar
);

export default router;