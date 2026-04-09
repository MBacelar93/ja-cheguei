import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Database {
    constructor () {
        const dataDir = path.join(__dirname, '../data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        this.dbPath = path.join(dataDir, 'ja_cheguei.db');
        this.db = null;
    }

    init(){
        this.db = new sqlite3.Database(this.dbPath, (err) => {
            if (err) {
                console.error('❌ Erro ao conectar SQLite:', err.message);
            } else {
                console.log('✅ SQLite conectado:', this.dbPath);
            }
        });
        
        this.createTables();
    }
    createTables() {
        this.db.run('PRAGMA foreing_keys = ON');
        this.db.run(`
            CREATE TABLE IF NOT EXISTS moradores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            apartamento TEXT NOT NULL,
            bloco TEXT NOT NULL,
            telefone TEXT,
            email TEXT,
            status TEXT DEFAULT 'ativo' CHECK(status IN ('ativo', 'inativo')),
            data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(apartamento, bloco)
            );
            
        `);
        
        this.db.run(`
            CREATE TABLE IF NOT EXISTS encomendas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            numero TEXT,
            remetente TEXT NOT NULL,
            tipo TEXT DEFAULT 'pacote' CHECK(tipo IN ('pacote', 'carta', 'documento', 'caixa', 'outro')),
            apartamento TEXT NOT NULL,
            bloco TEXT NOT NULL,
            morador_id INTEGER,
            status TEXT DEFAULT 'Ativa' CHECK(status IN ('Ativa', 'Retirada', 'Pendente validacao', 'Encaminhada admin')),
            data_recebimento DATETIME DEFAULT CURRENT_TIMESTAMP,
            data_retirada DATETIME,
            data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP,
            observacoes TEXT,
            FOREIGN KEY(morador_id) REFERENCES moradores(id)
            );
        `);

      
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL UNIQUE,
        descricao TEXT,
        data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

 
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS permissoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL UNIQUE,
        descricao TEXT,
        data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

   
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        senha_hash TEXT NOT NULL,
        nome TEXT NOT NULL,
        ativo INTEGER DEFAULT 1,
        data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
        ultimo_login DATETIME
      )
    `);

    
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        role_id INTEGER NOT NULL,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
        FOREIGN KEY (role_id) REFERENCES roles(id),
        UNIQUE(usuario_id, role_id)
      )
    `);

    
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER,
        acao TEXT NOT NULL,
        detalhes TEXT,
        ip TEXT,
        data DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      )
    `);

   
    try {
      const roles = ['Porteiro', 'Administração', 'Admin do Sistema'];
      roles.forEach(role => {
        this.db.exec(`
          INSERT OR IGNORE INTO roles (nome, descricao) 
          VALUES ('${role}', 'Role: ${role}')
        `);
      });
    } catch (e) {
     
    }
        
        this.db.run(`
            CREATE TABLE IF NOT EXISTS logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tipo TEXT NOT NULL,
                encomenda_id INTEGER,
                morador_id INTEGER,
                usuario TEXT,
                acao TEXT NOT NULL,
                data DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(encomenda_id) REFERENCES encomendas(id),
                FOREIGN KEY(morador_id) REFERENCES moradores(id)
            );
        `);
         console.log('✅ Tabelas criadas/verificadas');
    }


        run(sql, params = []){
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err){
                if (err){
                    console.error('❌ DB erro (run):', err.message);

                    reject(err);

                } else {
                    resolve ({
                        id: this.lastID,
                        changes: this.changes
                    });
                }
            })
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if(err) {
                    console.error('❌ DB erro (get):', err.message);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    all(sql, params = []){
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('❌ DB erro (all):', err.message);
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }

    close () {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

}

export default Database;

