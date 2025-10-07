const express = require('express');
const cors = require('cors'); // <--- 1. Importação do CORS
const mysql = require('mysql2/promise');
const app = express();
const port = process.env.PORT || 3000;

// Adiciona o CORS para permitir requisições do Flutter Web (localhost:port)
// O { origin: '*' } permite qualquer origem, o que é ideal para desenvolvimento.
app.use(cors({ origin: '*' })); // <--- 2. Ativação do CORS (ANTES do express.json)

// Middleware para analisar requisições JSON
app.use(express.json());

// --- 1. CONFIGURAÇÃO DO BANCO DE DADOS ---
// ... (restante do seu código dbConfig e connectToDatabase)

const dbConfig = {
    // Estas variáveis devem ser configuradas no painel do Render!
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

let pool;

async function connectToDatabase() {
    // 3. Verifica se as credenciais foram carregadas antes de tentar conectar
    if (!dbConfig.host || !dbConfig.user || !dbConfig.database) {
        console.error('ERRO CRÍTICO: Variáveis de ambiente do banco de dados (DB_HOST, DB_USER, etc.) não foram definidas. A API NÃO irá se conectar ao MySQL.');
        return; // Sai da função se as credenciais estiverem faltando
    } 
     try {
        // Se você usar a variável DATABASE_URL completa, use:
        // pool = await mysql.createPool(process.env.DATABASE_URL);
        // Senão, use o objeto de configuração:
        pool = await mysql.createPool(dbConfig);
        console.log('Conexão com o MySQL estabelecida com sucesso usando Variáveis de Ambiente!');
    } catch (error) {
        console.error('Falha ao conectar ao MySQL:', error);
    }
}

connectToDatabase();

// --- 2. ENDPOINT PARA OBTER TODOS OS USUÁRIOS (READ) ---
// ... (seu app.get('/api/usuarios', ...))

// --- 3. ENDPOINT PARA CRIAR UM NOVO USUÁRIO (CREATE) ---
// ... (seu app.post('/api/usuarios', ...))
    
   
app.post('/api/paciente/nome', async (req, res) => {
    const { nome } = req.body;

    if (!nome) {
        return res.status(400).json({ error: 'O campo "nome" é obrigatório.' });
    }

    try {
        const [result] = await pool.execute(
            `INSERT INTO pacientes (nome) VALUES (?)`,
            [nome]
        );
        
        res.status(201).json({ 
            id: result.insertId, 
            message: `Nome ${nome} registrado com sucesso.`, 
            nome: nome
        });

    } catch (error) {
        console.error('Erro ao registrar nome do paciente:', error); 
        res.status(500).json({ error: 'Erro interno do servidor ao salvar nome.' }); 
    }
});

// --- 4. ENDPOINT PARA SALVAR IDADE DO PACIENTE (POST) ---
app.post('/api/paciente/idade', async (req, res) => {
    // ... (restante da sua rota /api/paciente/idade)

    const { idade } = req.body; 

    if (!idade) {
        return res.status(400).json({ error: 'O campo "idade" é obrigatório no corpo da requisição.' });
    }
    

    const nomeTabela = 'pacientes'; 
    const nomeColuna = 'idade'; 

    try {
        const [result] = await pool.execute(
            `INSERT INTO ${nomeTabela} (${nomeColuna}) VALUES (?)`,
            [idade]
        );
        
        res.status(201).json({ 
            id: result.insertId, 
            message: `Idade ${idade} registrada com sucesso.`,
            idade: idade
        });

    } catch (error) {
        console.error('Erro ao registrar idade do paciente:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao salvar idade. Verifique sua tabela MySQL.' });
    }
});


app.post('/api/paciente/peso', async (req, res) => {
    // 1. Desestrutura o campo 'peso' do corpo da requisição
    const { peso } = req.body; 

    // 2. Validação básica
    if (!peso) {
        return res.status(400).json({ error: 'O campo "peso" é obrigatório no corpo da requisição.' });
    }
    
    // ATENÇÃO: Verifique o nome da sua tabela e coluna no MySQL!
    // Assegure-se de que a tabela 'pacientes' tem uma coluna chamada 'peso'.
    const nomeTabela = 'pacientes'; 
    const nomeColuna = 'peso'; 

    try {
        // 3. Executa a inserção no banco de dados
        const [result] = await pool.execute(
            // ATENÇÃO: A sua rota de idade está INSERINDO (INSERT).
            // Se você quiser ATUALIZAR (UPDATE) um registro existente,
            // você precisará do ID do paciente, por exemplo:
            // `UPDATE ${nomeTabela} SET ${nomeColuna} = ? WHERE id = ?`
            // O código abaixo realiza um INSERT simples (cria um novo registro só com o peso).

            `INSERT INTO ${nomeTabela} (${nomeColuna}) VALUES (?)`,
            [peso]
        );
        
        // 4. Responde com sucesso
        res.status(201).json({ 
            message: `Peso ${peso} kg registrado com sucesso.`,
            peso: peso
        });

    } catch (error) {
        // 5. Captura e registra o erro
        console.error('Erro ao registrar peso do paciente:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao salvar peso. Verifique sua tabela MySQL.' });
    }
});

app.post('/api/paciente/sanguineo', async (req, res) => {
    // O Dart enviará o campo 'tipo_sanguineo'
    const { tipo_sanguineo } = req.body; 

    // 1. Validação
    if (!tipo_sanguineo || typeof tipo_sanguineo !== 'string' || tipo_sanguineo.length < 2) {
        return res.status(400).json({ 
            error: 'O campo "tipo_sanguineo" é obrigatório e deve ser uma string válida (ex: A+, O-).' 
        });
    }
    
    const nomeTabela = 'pacientes'; 
    const nomeColuna = 'tipo_sanguineo'; 
    try {
        // 2. Executa a inserção no banco de dados
        // Nota: Assim como as outras rotas, esta também está fazendo INSERT.
        const [result] = await pool.execute(
            `INSERT INTO ${nomeTabela} (${nomeColuna}) VALUES (?)`,
            [tipo_sanguineo]
        );
        
        // 3. Responde com sucesso
        res.status(201).json({ 
            id: result.insertId, 
            message: `Tipo sanguíneo ${tipo_sanguineo} registrado com sucesso.`,
            tipo_sanguineo: tipo_sanguineo
        });

    } catch (error) {

        console.error('Erro ao registrar tipo sanguíneo do paciente:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao salvar tipo sanguíneo. Verifique sua tabela MySQL.' });
    }
});

app.post('/api/paciente/comorbidade', async (req, res) => {
    // A chave que o Flutter enviará é 'comorbidade'
    const { comorbidade } = req.body; 
    
    // NOTA: Se o campo vier vazio do Flutter (o usuário pulou), o backend aceita e salva.
    const valorParaSalvar = comorbidade || 'Nenhuma/Não Informado';

    const nomeTabela = 'pacientes'; 
    const nomeColuna = 'comorbidade'; 

    try {
        // Assume que você tem uma coluna 'comorbidade' na sua tabela 'pacientes'
        const [result] = await pool.execute(
            `INSERT INTO ${nomeTabela} (${nomeColuna}) VALUES (?)`,
            [valorParaSalvar]
        );
        
        res.status(201).json({ 
            id: result.insertId, 
            message: `Comorbidade salva: ${valorParaSalvar}.`,
            comorbidade: valorParaSalvar
        });

    } catch (error) {
        console.error('Erro ao registrar comorbidade do paciente:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao salvar comorbidade. Verifique sua tabela MySQL.' });
    }
});

// --- ROTA POST: /api/familiar/login ---
// ==========================================================
app.post('/api/familiar/login', async (req, res) => {
    const { identificador, senha } = req.body; 
    const nomeTabela = 'familiares'; 

    if (!identificador || !senha) {
        return res.status(400).json({ error: 'Email/Telefone e senha são obrigatórios.' });
    }

    try {
        // 1. Busca o usuário por email OU telefone, selecionando a senha de TEXTO PURO
        const [rows] = await pool.execute(
            `SELECT id, nome, senha FROM ${nomeTabela} WHERE email = ? OR telefone = ?`,
            [identificador, identificador]
        );

        // 2. Verifica se o usuário foi encontrado
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
        console.error('Erro no login do familiar:', error);
        res.status(500).json({ error: 'Erro interno do servidor durante o login.' });
    }
});

app.post('/api/familiar/cadastro', async (req, res) => {
    // 1. Extração dos dados enviados pelo Flutter
    const { 
        nome, email, telefone, endereco, 
        data_nascimento, genero, senha 
    } = req.body; 

    // 2. Validação de campos obrigatórios
    if (!nome || !email || !senha) { 
        return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' }); 
    }

    const nomeTabela = 'familiares'; 

    try {
     
        
        // 4. Executa a inserção no banco de dados
        // ATENÇÃO: A ordem das colunas e dos valores deve ser a mesma!
        const [result] = await pool.execute(
            `INSERT INTO ${nomeTabela} (nome, email, telefone, endereco, data_nascimento, genero, senha) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [nome, email, telefone, endereco, data_nascimento, genero, senha]
        );
        
        // 5. Resposta de sucesso
        res.status(201).json({ 
            id: result.insertId, 
            message: `Familiar ${nome} cadastrado com sucesso!`,
        });

    } catch (error) {
        // 6. Tratamento de erro (ex: email duplicado)
        if (error.code === 'ER_DUP_ENTRY') {
             return res.status(409).json({ error: 'O email fornecido já está em uso.' });
        }
        console.error('Erro ao registrar cadastro do familiar:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao salvar dados de familiar.' });
    }
});

app.post('/api/cuidador/cadastro', async (req, res) => {
    // 1. Extração dos dados enviados pelo Flutter
    const { 
        nome, email, telefone, endereco, 
        data_nascimento, genero, senha 
    } = req.body; 

    // 2. Validação de campos obrigatórios
    if (!nome || !email || !senha) { 
        return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' }); 
    }

    const nomeTabela = 'cuidador'; 

    try {
     
        
        // 4. Executa a inserção no banco de dados
        // ATENÇÃO: A ordem das colunas e dos valores deve ser a mesma!
        const [result] = await pool.execute(
            `INSERT INTO ${nomeTabela} (nome, email, telefone, endereco, data_nascimento, genero, senha) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [nome, email, telefone, endereco, data_nascimento, genero, senha]
        );
        
        // 5. Resposta de sucesso
        res.status(201).json({ 
            id: result.insertId, 
            message: `Familiar ${nome} cadastrado com sucesso!`,
        });

    } catch (error) {
        // 6. Tratamento de erro (ex: email duplicado)
        if (error.code === 'ER_DUP_ENTRY') {
             return res.status(409).json({ error: 'O email fornecido já está em uso.' });
        }
        console.error('Erro ao registrar cadastro do cuidador:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao salvar dados de cuidador.' });
    }
});


// IMPORTANTE: Este código assume que você tem o Express e o pool de conexão do MySQL configurados.
// Certifique-se de que a middleware 'express.json()' está ativa no seu servidor:
// app.use(express.json());

app.post('/api/cuidador/profissional', async (req, res) => {
    // 1. Dados de texto vêm do corpo da requisição JSON (req.body)
    const { cuidador_id, formacao, registro_profissional, declaracao_apto } = req.body;

    // 2. Validação dos campos obrigatórios
    // O Flutter envia 'declaracao_apto' como booleano (true/false)
    if (!cuidador_id || !formacao || declaracao_apto !== true) {
        return res.status(400).json({ 
            error: 'ID do cuidador, Formação e a declaração de aptidão são campos obrigatórios.' 
        });
    }

    // Usando a tabela que você mencionou
    const nomeTabela = 'cuidador'; 

    try {
        // 3. Execução da query de ATUALIZAÇÃO no MySQL
        // Atualizamos os campos 'formacao', 'registro_profissional' e definimos o 'status_validacao' como 'Pendente'.
        // Assumimos que 'cuidador_id' corresponde à coluna 'id' da tabela 'cuidador'.
        const [result] = await pool.execute(
            `UPDATE ${nomeTabela} SET 
                formacao = ?, 
                registro_profissional = ?, 
                status_validacao = 'Pendente' 
            WHERE id = ?`,
            [formacao, registro_profissional, cuidador_id]
        );
        
        // Verifica se o registro foi realmente atualizado
        if (result.affectedRows === 0) {
             return res.status(404).json({ error: `Cuidador com ID ${cuidador_id} não encontrado ou já cadastrado.` });
        }

        // Resposta de sucesso (200 OK para atualização)
        res.status(200).json({ 
            message: 'Informações profissionais atualizadas com sucesso e enviadas para validação.',
            cuidador_id: cuidador_id,
        });

    } catch (error) {
        console.error('Erro ao atualizar dados profissionais:', error);
        // Em caso de erro de banco de dados ou outro erro interno
        res.status(500).json({ error: 'Erro interno do servidor ao salvar dados profissionais.' });
    }
});

app.post('/api/cuidador/login', async (req, res) => {
    const { identificador, senha } = req.body; 
    const nomeTabela = 'cuidador'; // Usando a sua tabela 'cuidador'

    if (!identificador || !senha) {
        return res.status(400).json({ error: 'Email/Telefone e senha são obrigatórios.' });
    }

    try {
        // 1. Busca o usuário por email OU telefone
        // Note que o campo no SQL é 'senha', conforme seu schema de texto puro
        const [rows] = await pool.execute(
            `SELECT id, nome, senha FROM ${nomeTabela} WHERE email = ? OR telefone = ?`,
            [identificador, identificador]
        );

        // 2. Verifica se o usuário foi encontrado
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        const cuidador = rows[0];

        // 3. Compara a senha fornecida com a senha salva (Texto Puro - INSEGURO)
        const senhaValida = senha === cuidador.senha; 

        if (!senhaValida) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        // 4. Sucesso
        res.status(200).json({
            message: 'Login bem-sucedido!',
            cuidador_id: cuidador.id,
            nome: cuidador.nome,
        });

    } catch (error) {
        console.error('Erro no login do cuidador:', error);
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
            id = 1; 
    `;

    const nomeTabela = 'cuidador'; 

    try {
        const [results] = await pool.execute(query, [id]);

        if (results.length === 0) { 
            // Não encontrou o ID 1
            return res.status(404).json({ error: 'Cuidador de teste (ID 1) não encontrado no banco de dados.' });
        }

        const dadosCuidador = results[0];
        

        let dataNascimentoFormatada = null;
        if (dadosCuidador.data_nascimento) {
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
        console.error('Erro ao buscar perfil no BD:', error);
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
            id = 1; 
    `;

    const nomeTabela = 'pacientes'; 

    try {
        const [results] = await pool.execute(query, [id]);

        if (results.length === 0) { 
            // Não encontrou o ID 1
            return res.status(404).json({ error: 'Cuidador de teste (ID 1) não encontrado no banco de dados.' });
        }

        const dadosPaciente = results[0];
        

        let dataNascimentoFormatada = null;
        if (dadosPaciente.data_nascimento) {
            dataNascimentoFormatada = new Date(dadosPaciente.data_nascimento).toISOString().split('T')[0];
        }
        
        res.status(200).json({

            nome: dadosPaciente.nome,
            email: dadosPaciente.email,
            numero: dadosPaciente.telefone, 

        });

    } catch (error) {
        console.error('Erro ao buscar perfil no BD:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao carregar dados do perfil.' });
    }
});

// --- ROTA GET: /api/cuidador/SelecionarPaciente/:cuidadorId ---
app.get('/api/cuidador/SelecionarPaciente/:cuidadorId', async (req, res) => {
    const SelecionarPaciente = req.params.cuidadorId; 
    
    // Suas tabelas
    const nomeTabelaPaciente = 'pacientes'; 

    try {
        // Consulta SQL para buscar pacientes onde o ID do cuidador coincide.
        const [rows] = await pool.execute(
            `SELECT 
                id, 
                nome, 
                peso
             FROM ${nomeTabelaPaciente} 
             WHERE cuidador_id = ?`,
            [SelecionarPaciente]
        );

        // Retorna a lista de pacientes como JSON
        res.status(200).json(rows);

    } catch (error) {
        console.error('Erro ao buscar pacientes do cuidador:', error);
        res.status(500).json({ error: 'Erro interno ao carregar a lista de pacientes.' });
    }
});

app.post('/api/cuidador/MedicamentoPaciente', async (req, res) => {
    // 1. Dados vêm do corpo da requisição JSON
    const { 
        cuidador_id, 
        paciente_id, 
        medicamento_nome, 
        dosagem, 
        data_hora 
    } = req.body;

    // 2. Validação dos campos obrigatórios
    if (!cuidador_id || !paciente_id || !medicamento_nome || !dosagem || !data_hora) {
        return res.status(400).json({ 
            error: 'Todos os campos são obrigatórios: cuidador_id, paciente_id, medicamento_nome, dosagem, data_hora' 
        });
    }

    // 3. Validação da data/hora
    const dataHoraAgendamento = new Date(data_hora);
    if (isNaN(dataHoraAgendamento.getTime())) {
        return res.status(400).json({ 
            error: 'Data/hora inválida. Use o formato ISO: YYYY-MM-DDTHH:MM:SS' 
        });
    }

    // 4. Verifica se não é uma data passada
    if (dataHoraAgendamento < new Date()) {
        return res.status(400).json({ 
            error: 'Não é possível agendar medicamentos para datas/horas passadas' 
        });
    }

    const nomeTabela = 'agendamentos_medicamentos'; 

    try {
        // 5. Executa a inserção no banco de dados
        const [result] = await pool.execute(
            `INSERT INTO ${nomeTabela} 
            (cuidador_id, paciente_id, medicamento_nome, dosagem, data_hora, status) 
            VALUES (?, ?, ?, ?, ?, 'pendente')`,
            [cuidador_id, paciente_id, medicamento_nome, dosagem, dataHoraAgendamento]
        );
        
        // 6. Resposta de sucesso
        res.status(201).json({ 
            id: result.insertId,
            message: 'Medicamento agendado com sucesso!',
            agendamento: {
                id: result.insertId,
                cuidador_id: cuidador_id,
                paciente_id: paciente_id,
                medicamento_nome: medicamento_nome,
                dosagem: dosagem,
                data_hora: data_hora,
                status: 'pendente'
            }
        });

    } catch (error) {
        console.error('Erro ao agendar medicamento:', error);
        
        // 7. Tratamento de erros específicos
        if (error.code === 'ER_NO_REFERENCED_ROW') {
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
console.log(`Endpoint POST Idade: http://localhost:${port}/api/paciente/idade`);
console.log(`Endpoint POST peso: http://localhost:${port}/api/paciente/peso`);
console.log(`Endpoint POST sanguineo: http://localhost:${port}/api/paciente/sanguineo`);
console.log(`Endpoint POST comorbidade: http://localhost:${port}/api/paciente/comorbidade`);
console.log(`Endpoint POST acesso: http://localhost:${port}/api/paciente/nome`);
console.log(`Endpoint POST famiiliar: http://localhost:${port}/api/familiar/login`);
console.log(`Endpoint POST login: http://localhost:${port}/api/familiar/cadastro`);
console.log(`Endpoint POST login: http://localhost:${port}/api/cuidador/cadastro`);
console.log(`Endpoint POST login: http://localhost:${port}/api/cuidador/profissional`);
console.log(`Endpoint POST login: http://localhost:${port}/api/cuidador/login`);
console.log(`Endpoint POST login: http://localhost:${port}/api/cuidador/perfil`);
console.log(`Endpoint POST login: http://localhost:${port}/api/pacientes/perfil`);
console.log(`Endpoint POST login: http://localhost:${port}/api/cuidador/SelecionarPaciente/:cuidadorId'`);
console.log(`Endpoint POST login: http://localhost:${port}/api/cuidador/MedicamentoPaciente`);
});
