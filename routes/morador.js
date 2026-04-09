import { Router } from 'express';
import MoradorController from '../controllers/MoradorController.js';
import { verifyToken, checkRole, auditLog } from '../middleware/auth.js';

const router = Router();

router.get('/constantes', MoradorController.obterConstantes);


router.get('/listar',
    verifyToken,
    checkRole('Porteiro', 'Administração'), 
    MoradorController.listar
);
router.get('/:id', 
    verifyToken,
    checkRole('Porteiro', 'Administração'),
    auditLog('Consultou morador'),
    MoradorController.buscarPorId
);
router.get('/buscar/:nome', 
    verifyToken,
    checkRole('Portaria', 'Administração'),
    auditLog('Consultou morador'),
    MoradorController.buscarPorNome
);
router.get('/apartamento/:apartamento/:bloco', 
    verifyToken,
    checkRole('Porteiro', 'Administração'),
    auditLog('Buscou morador por apto'),
    MoradorController.buscarPorApartamento
);



router.post('/criar',
    verifyToken,
    checkRole('Administração'),
    auditLog('Criou morador'),
    MoradorController.criar
);



router.put('/:id', 
    verifyToken,
    checkRole('Administração'),
    auditLog('Atualizou morador'),
    MoradorController.atualizar
);
router.put('/:id/desativar', 
    verifyToken,
    checkRole('Administração'),
    auditLog('Desativou morador'),
    MoradorController.desativar
);
router.put('/:id/ativar',
    verifyToken,
    checkRole('Administração'),
    auditLog('Ativou Morador'),
    MoradorController.ativar
);



router.delete('/:id', 
    verifyToken,
    checkRole('Administração'),
    auditLog('Deletou Morador'),
    MoradorController.deletar
);

export default router;