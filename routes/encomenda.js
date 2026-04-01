import { Router } from 'express';
import EncomendaController from '../controllers/EncomendaController.js';

const router = Router();

router.get('/constante', EncomendaController.obterConstantes);
router.get('/listar', EncomendaController.listar);
router.get('/apartamento/:apartamento/:bloco', EncomendaController.buscarPorApartamento);
router.get('/id', EncomendaController.buscarPorId);


router.post('/criar', EncomendaController.criar);


router.put('/:id/retirada', EncomendaController.retirada);
router.put('/:id/validar', EncomendaController.validar);
router.put('/:id/enviar-admin', EncomendaController.enviarParaAdmin);


router.delete('/:id', EncomendaController.deletar);

export default router;