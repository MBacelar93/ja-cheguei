import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from './config/database.js';
import encomendaRoutes from './routes/encomenda.js';
import moradorRoutes from './routes/morador.js';
import administracaoRoutes from './routes/administracao.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname,'public')));


const db = new Database();
db.init();

app.use((req, res, next) => {
    req.db = db;
    next();
});

app.use('/api/encomenda', encomendaRoutes);
app.use('/api/admin', moradorRoutes);
app.use('/api/admin', administracaoRoutes);

app.get('/api/status', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        banco: 'Conectado'
    });
});


app.use((req, res) => {
    res.status(404).json({
        erro: 'Rota não encontrada',
        requisicao: `${req.method} ${req.path}`
    });
});

app.use((err, req, res, next) => {
    console.error('❌ ERRO:', err.message);
    res.status(500).json({
        erro: 'Erro interno do servidor',
        mensagem: err.message
    });
});


app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════╗
║   🎯 JÁ CHEGUEI - Servidor On      ║
║   Porta: ${PORT}                      ║
║   Acesse: http://localhost:${PORT}    ║
╚════════════════════════════════════╝
  `);
});
 
export default app;