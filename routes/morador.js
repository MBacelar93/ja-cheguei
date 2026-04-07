import { Router } from 'express';
import MoradorController from '../controllers/MoradorController.js';

const router = Router();

router.get('/constantes', MoradorController.obterConstantes);
router.get('/listar', MoradorController.listar);
router.get('/buscar/:nome', MoradorController.buscarPorNome);
router.get('/apartamento/:apartamento/:bloco', MoradorController.buscarPorApartamento);
router.get('/:id', MoradorController.buscarPorId);


router.post('/criar', MoradorController.criar);


router.put('/:id', MoradorController.atualizar);
router.put('/:id/desativar', MoradorController.desativar);
router.put('/:id/ativar', MoradorController.ativar);


router.delete('/:id', MoradorController.deletar);

export default router;