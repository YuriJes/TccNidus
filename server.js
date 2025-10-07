const express = require('express');
const cors = require('cors');
// MUDANÇA 1: Usamos o driver 'pg' em vez de 'mysql2/promise'
const { Pool } = require('pg'); 
const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// --- 1. CONFIGURAÇÃO DO BANCO DE DADOS ---

// A configuração agora usa apenas a DATABASE_URL
let pool;

async function connectToDatabase() {
    // MUDANÇA 2: Usamos a variável DATABASE_URL do Render
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('ERRO CRÍTICO: Variável de ambiente DATABASE_URL não foi definida. A API NÃO irá se conectar ao PostgreSQL.');
        return; 
    }

    try {
        // MUDANÇA 3: Cria um Pool usando a connectionString e habilita o SSL
        pool = new Pool({
            connectionString: connectionString,
            ssl: { 
                rejectUnauthorized: false // Necessário para a conexão com o Render
            }
        });
        await pool.connect(); // Tenta conectar para validar a conexão
        console.log('Conexão com o PostgreSQL estabelecida com sucesso usando DATABASE_URL!');
    } catch (error) {
        console.error('Falha ao conectar ao PostgreSQL:', error.stack);
    }
}

connectToDatabase();

// =========================================================================
// MUDANÇA 4: ATUALIZAÇÃO GLOBAL dos métodos de consulta
// pool.execute(...) (do MySQL) AGORA é pool.query(...) (do PostgreSQL)
// E a desestruturação do resultado é diferente (não usa [result] nem rows[0])
// =========================================================================


// --- ROTAS DO PACIENTE (CREATE) ---

app.post('/api/paciente/nome', async (req, res) => {
    const { nome } = req.body;

    if (!nome) {
        return res.status(400).json({ error: 'O campo "nome" é obrigatório.' });
    }

    try {
        // MUDANÇA: pool.query, e o resultado não é desestruturado.
        // Usa RETURNING id para pegar o ID inserido (substitui result.insertId)
        const result = await pool.query(
            `INSERT INTO pacientes (nome) VALUES ($1) RETURNING id`, // $1 é a sintaxe de placeholder do PG
            [nome]
        );
        
        // MUDANÇA: O ID inserido vem em result.rows[0].id
        res.status(201).json({ 
            id: result.rows[0].id, 
            message: `Nome ${nome} registrado com sucesso.`, 
            nome: nome
        });

    } catch (error) {
        console.error('Erro ao registrar nome do paciente:', error.stack); 
        res.status(500).json({ error: 'Erro interno do servidor ao salvar nome.' }); 
    }
});

// --- ENDPOINT PARA SALVAR IDADE DO PACIENTE (POST) ---
app.post('/api/paciente/idade', async (req, res) => {
    const { idade } = req.body; 

    if (!idade) {
        return res.status(400).json({ error: 'O campo "idade" é obrigatório no corpo da requisição.' });
    }
    
    const nomeTabela = 'pacientes'; 
    const nomeColuna = 'idade'; 

    try {
        // MUDANÇA: pool.query e placeholder $1
        const result = await pool.query(
            `INSERT INTO ${nomeTabela} (${nomeColuna}) VALUES ($1) RETURNING id`,
            [idade]
        );
        
        res.status(201).json({ 
            id: result.rows[0].id, 
            message: `Idade ${idade} registrada com sucesso.`,
            idade: idade
        });

    } catch (error) {
        console.error('Erro ao registrar idade do paciente:', error.stack);
        res.status(500).json({ error: 'Erro interno do servidor ao salvar idade. Verifique sua tabela PostgreSQL.' });
    }
});


app.post('/api/paciente/peso', async (req, res) => {
    const { peso } = req.body; 

    if (!peso) {
        return res.status(400).json({ error: 'O campo "peso" é obrigatório no corpo da requisição.' });
    }
    
    const nomeTabela = 'pacientes'; 
    const nomeColuna = 'peso'; 

    try {
        // MUDANÇA: pool.query e placeholder $1
        const result = await pool.query(
            `INSERT INTO ${nomeTabela} (${nomeColuna}) VALUES ($1) RETURNING id`,
            [peso]
        );
        
        res.status(201).json({ 
            id: result.rows[0].id,
            message: `Peso ${peso} kg registrado com sucesso.`,
            peso: peso
        });

    } catch (error) {
        console.error('Erro ao registrar peso do paciente:', error.stack);
        res.status(500).json({ error: 'Erro interno do servidor ao salvar peso. Verifique sua tabela PostgreSQL.' });
    }
});

app.post('/api/paciente/sanguineo', async (req, res) => {
    const { tipo_sanguineo } = req.body; 

    if (!tipo_sanguineo || typeof tipo_sanguineo !== 'string' || tipo_sanguineo.length < 2) {
        return res.status(400).json({ 
            error: 'O campo "tipo_sanguineo" é obrigatório e deve ser uma string válida (ex: A+, O-).' 
        });
    }
    
    const nomeTabela = 'pacientes'; 
    const nomeColuna = 'tipo_sanguineo'; 
    try {
        // MUDANÇA: pool.query e placeholder $1
        const result = await pool.query(
            `INSERT INTO ${nomeTabela} (${nomeColuna}) VALUES ($1) RETURNING id`,
            [tipo_sanguineo]
        );
        
        res.status(201).json({ 
            id: result.rows[0].id, 
            message: `Tipo sanguíneo ${tipo_sanguineo} registrado com sucesso.`,
            tipo_sanguineo: tipo_sanguineo
        });

    } catch (error) {
        console.error('Erro ao registrar tipo sanguíneo do paciente:', error.stack);
        res.status(500).json({ error: 'Erro interno do servidor ao salvar tipo sanguíneo. Verifique sua tabela PostgreSQL.' });
    }
});

app.post('/api/paciente/comorbidade', async (req, res) => {
    const { comorbidade } = req.body; 
    
    const valorParaSalvar = comorbidade || 'Nenhuma/Não Informado';

    const nomeTabela = 'pacientes'; 
    const nomeColuna = 'comorbidade'; 

    try {
        // MUDANÇA: pool.query e placeholder $1
        const result = await pool.query(
            `INSERT INTO ${nomeTabela} (${nomeColuna}) VALUES ($1) RETURNING id`,
            [valorParaSalvar]
        );
        
        res.status(201).json({ 
            id: result.rows[0].id, 
            message: `Comorbidade salva: ${valorParaSalvar}.`,
            comorbidade: valorParaSalvar
        });

    } catch (error) {
        console.error('Erro ao registrar comorbidade do paciente:', error.stack);
        res.status(500).json({ error: 'Erro interno do servidor ao salvar comorbidade. Verifique sua tabela PostgreSQL.' });
    }
});

// --- ROTA POST: /api/familiar/login ---
app.post('/api/familiar/login', async (req, res) => {
    const { identificador, senha } = req.body; 
    const nomeTabela = 'familiares'; 

    if (!identificador || !senha) {
        return res.status(400).json({ error: 'Email/Telefone e senha são obrigatórios.' });
    }

    try {
        // MUDANÇA: pool.query e placeholders $1 e $2
        const result = await pool.query(
            `SELECT id, nome, senha FROM ${nomeTabela} WHERE email = $1 OR telefone = $2`,
            [identificador, identificador]
        );

        const rows = result.rows; // O array de resultados está em .rows no PG

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        const familiar = rows[0];
        const senhaValida = senha === familiar.senha; 
        if (!senhaValida) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        res.status(200).json({
            message: 'Login bem-sucedido!',
            familiar_id: familiar.id,
            nome: familiar.nome,
        });

    } catch (error) {
        console.error('Erro no login do familiar:', error.stack);
        res.status(500).json({ error: 'Erro interno do servidor durante o login.' });
    }
});

app.post('/api/familiar/cadastro', async (req, res) => {
    const { nome, email, telefone, endereco, data_nascimento, genero, senha } = req.body; 

    if (!nome || !email || !senha) { 
        return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' }); 
    }

    const nomeTabela = 'familiares'; 

    try {
        // MUDANÇA: pool.query e placeholders $1, $2, etc.
        const result = await pool.query(
            `INSERT INTO ${nomeTabela} (nome, email, telefone, endereco, data_nascimento, genero, senha) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [nome, email, telefone, endereco, data_nascimento, genero, senha]
        );
        
        res.status(201).json({ 
            id: result.rows[0].id, 
            message: `Familiar ${nome} cadastrado com sucesso!`,
        });

    } catch (error) {
        console.error('Erro ao registrar cadastro do familiar:', error.stack);
        // Tratamento de erro de chave duplicada no PostgreSQL
        if (error.code === '23505') { // Código de erro 'unique_violation' no PG
             return res.status(409).json({ error: 'O email fornecido já está em uso.' });
        }
        res.status(500).json({ error: 'Erro interno do servidor ao salvar dados de familiar.' });
    }
});

app.post('/api/cuidador/cadastro', async (req, res) => {
    const { nome, email, telefone, endereco, data_nascimento, genero, senha } = req.body; 

    if (!nome || !email || !senha) { 
        return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' }); 
    }

    const nomeTabela = 'cuidador'; 

    try {
        // MUDANÇA: pool.query e placeholders $1, $2, etc.
        const result = await pool.query(
            `INSERT INTO ${nomeTabela} (nome, email, telefone, endereco, data_nascimento, genero, senha) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [nome, email, telefone, endereco, data_nascimento, genero, senha]
        );
        
        res.status(201).json({ 
            id: result.rows[0].id, 
            message: `Cuidador ${nome} cadastrado com sucesso!`, // Corrigi a mensagem aqui
        });

    } catch (error) {
        console.error('Erro ao registrar cadastro do cuidador:', error.stack);
        // Tratamento de erro de chave duplicada no PostgreSQL
        if (error.code === '23505') { 
             return res.status(409).json({ error: 'O email fornecido já está em uso.' });
        }
        res.status(500).json({ error: 'Erro interno do servidor ao salvar dados de cuidador.' });
    }
});


app.post('/api/cuidador/profissional', async (req, res) => {
    const { cuidador_id, formacao, registro_profissional, declaracao_apto } = req.body;

    if (!cuidador_id || !formacao || declaracao_apto !== true) {
        return res.status(400).json({ 
            error: 'ID do cuidador, Formação e a declaração de aptidão são campos obrigatórios.' 
        });
    }

    const nomeTabela = 'cuidador'; 

    try {
        // MUDANÇA: pool.query e placeholders $1, $2, $3
        const result = await pool.query(
            `UPDATE ${nomeTabela} SET 
                formacao = $1, 
                registro_profissional = $2, 
                status_validacao = 'Pendente' 
             WHERE id = $3`,
            [formacao, registro_profissional, cuidador_id]
        );
        
        const affectedRows = result.rowCount; // No PG, 'affectedRows' é 'rowCount'

        if (affectedRows === 0) {
             return res.status(404).json({ error: `Cuidador com ID ${cuidador_id} não encontrado ou já cadastrado.` });
        }

        res.status(200).json({ 
            message: 'Informações profissionais atualizadas com sucesso e enviadas para validação.',
            cuidador_id: cuidador_id,
        });

    } catch (error) {
        console.error('Erro ao atualizar dados profissionais:', error.stack);
        res.status(500).json({ error: 'Erro interno do servidor ao salvar dados profissionais.' });
    }
});

app.post('/api/cuidador/login', async (req, res) => {
    const { identificador, senha } = req.body; 
    const nomeTabela = 'cuidador'; 

    if (!identificador || !senha) {
        return res.status(400).json({ error: 'Email/Telefone e senha são obrigatórios.' });
    }

    try {
        // MUDANÇA: pool.query e placeholders $1 e $2
        const result = await pool.query(
            `SELECT id, nome, senha FROM ${nomeTabela} WHERE email = $1 OR telefone = $2`,
            [identificador, identificador]
        );
        
        const rows = result.rows; // O array de resultados está em .rows no PG

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        const cuidador = rows[0];
        const senhaValida = senha === cuidador.senha; 

        if (!senhaValida) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        res.status(200).json({
            message: 'Login bem-sucedido!',
            cuidador_id: cuidador.id,
            nome: cuidador.nome,
        });

    } catch (error) {
        console.error('Erro no login do cuidador:', error.stack);
        res.status(500).json({ error: 'Erro interno do servidor durante o login.' });
    }
});

app.get('/api/cuidador/perfil', async (req, res) => {
    const id = 1; 

    const query = `
        SELECT 
            nome, 
            email, 
            telefone, 
            endereco, 
            data_nascimento, 
            genero
        FROM 
            cuidador 
        WHERE 
            id = $1; 
    `;

    try {
        // MUDANÇA: pool.query e placeholder $1
        const result = await pool.query(query, [id]);
        const results = result.rows; // Os resultados estão em .rows

        if (results.length === 0) { 
            return res.status(404).json({ error: 'Cuidador de teste (ID 1) não encontrado no banco de dados.' });
        }

        const dadosCuidador = results[0];
        
        let dataNascimentoFormatada = null;
        if (dadosCuidador.data_nascimento) {
            // O Date do Node.js funciona da mesma forma, mas o tipo de dados é mais limpo no PG
            dataNascimentoFormatada = new Date(dadosCuidador.data_nascimento).toISOString().split('T')[0];
        }
        
        res.status(200).json({
            nome: dadosCuidador.nome,
            email: dadosCuidador.email,
            numero: dadosCuidador.telefone, 
            endereco: dadosCuidador.endereco,
            data_nascimento: dataNascimentoFormatada,
            genero: dadosCuidador.genero,
            info_fisicas: "Informações físicas não especificadas.", 
            foto_url: "assets/placeholder.png" 
        });

    } catch (error) {
        console.error('Erro ao buscar perfil no BD:', error.stack);
        res.status(500).json({ error: 'Erro interno do servidor ao carregar dados do perfil.' });
    }
});

app.get('/api/pacientes/perfil', async (req, res) => {
    const id = 1; 
    const query = `
        SELECT 
            nome, 
            email, 
            idade
        FROM 
         pacientes
        WHERE 
            id = $1; 
    `;

    try {
        // MUDANÇA: pool.query e placeholder $1
        const result = await pool.query(query, [id]);
        const results = result.rows; // Os resultados estão em .rows

        if (results.length === 0) { 
            return res.status(404).json({ error: 'Paciente de teste (ID 1) não encontrado no banco de dados.' });
        }

        const dadosPaciente = results[0];
        
        res.status(200).json({
            nome: dadosPaciente.nome,
            email: dadosPaciente.email,
            // Outros campos estão faltando na sua query SQL original, mas foram mantidos aqui para exemplo:
            // numero: dadosPaciente.telefone, 
        });

    } catch (error) {
        console.error('Erro ao buscar perfil no BD:', error.stack);
        res.status(500).json({ error: 'Erro interno do servidor ao carregar dados do perfil.' });
    }
});

// --- ROTA GET: /api/cuidador/SelecionarPaciente/:cuidadorId ---
app.get('/api/cuidador/SelecionarPaciente/:cuidadorId', async (req, res) => {
    const cuidadorId = req.params.cuidadorId; // Corrigi o nome da variável local
    
    const nomeTabelaPaciente = 'pacientes'; 

    try {
        // MUDANÇA: pool.query e placeholder $1
        const result = await pool.query(
            `SELECT 
                id, 
                nome, 
                peso
             FROM ${nomeTabelaPaciente} 
             WHERE cuidador_id = $1`,
            [cuidadorId]
        );

        const rows = result.rows; // Os resultados estão em .rows no PG

        res.status(200).json(rows);

    } catch (error) {
        console.error('Erro ao buscar pacientes do cuidador:', error.stack);
        res.status(500).json({ error: 'Erro interno ao carregar a lista de pacientes.' });
    }
});

app.post('/api/cuidador/MedicamentoPaciente', async (req, res) => {
    const { 
        cuidador_id, 
        paciente_id, 
        medicamento_nome, 
        dosagem, 
        data_hora 
    } = req.body;

    if (!cuidador_id || !paciente_id || !medicamento_nome || !dosagem || !data_hora) {
        return res.status(400).json({ 
            error: 'Todos os campos são obrigatórios: cuidador_id, paciente_id, medicamento_nome, dosagem, data_hora' 
        });
    }

    const dataHoraAgendamento = new Date(data_hora);
    if (isNaN(dataHoraAgendamento.getTime())) {
        return res.status(400).json({ 
            error: 'Data/hora inválida. Use o formato ISO: YYYY-MM-DDTHH:MM:SS' 
        });
    }

    if (dataHoraAgendamento < new Date()) {
        return res.status(400).json({ 
            error: 'Não é possível agendar medicamentos para datas/horas passadas' 
        });
    }

    const nomeTabela = 'agendamentos_medicamentos'; 

    try {
        // MUDANÇA: pool.query e placeholders $1, $2, $3, $4, $5
        const result = await pool.query(
            `INSERT INTO ${nomeTabela} 
             (cuidador_id, paciente_id, medicamento_nome, dosagem, data_hora, status) 
             VALUES ($1, $2, $3, $4, $5, 'pendente') RETURNING id`,
            [cuidador_id, paciente_id, medicamento_nome, dosagem, dataHoraAgendamento]
        );
        
        const insertId = result.rows[0].id; // ID inserido
        
        res.status(201).json({ 
            id: insertId,
            message: 'Medicamento agendado com sucesso!',
            agendamento: {
                id: insertId,
                cuidador_id: cuidador_id,
                paciente_id: paciente_id,
                medicamento_nome: medicamento_nome,
                dosagem: dosagem,
                data_hora: data_hora,
                status: 'pendente'
            }
        });

    } catch (error) {
        console.error('Erro ao agendar medicamento:', error.stack);
        
        // Tratamento de erro de FK no PostgreSQL
        if (error.code === '23503') { // Código de erro 'foreign_key_violation' no PG
             return res.status(400).json({ 
                 error: 'Cuidador ou paciente não encontrado. Verifique os IDs.' 
             });
        }
        
        res.status(500).json({ 
            error: 'Erro interno do servidor ao agendar medicamento.' 
        });
    }
});

// --- 5. INICIA O SERVIDOR ---
app.listen(port, () => {
    console.log(`Servidor Node.js rodando em http://localhost:${port}`);
    console.log(`Endpoints prontos para serem usados no Render!`);
});