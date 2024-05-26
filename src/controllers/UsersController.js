// Importando o Hash, App Error e SQLite Connection:;
const { hash, compare } = require('bcryptjs');

const AppError = require('../utils/AppError');

const sqliteConnection = require('../database/sqlite');

class UsersController {
  async create(request, response) {
    // Capturando parâmetros do body:
    const { name, email, password, isAdmin } = request.body;

    // Conectando com a database:
    const database = await sqliteConnection();
    const checkUserExists = await database.get(
      'SELECT * FROM users WHERE email = (?)',
      [email]
    );

    // Verificações:
    if (checkUserExists) {
      throw new AppError('Erro: Este e-mail já está em uso!');
    }

    if (name.length < 3) {
      throw new AppError('Erro: Digite um nome válido!');
    }

    if (!email.includes('@', '.') || !email.includes('.')) {
      throw new AppError('Erro: Digite um email válido!');
    }

    if (password.length < 6) {
      throw new AppError(
        'Erro: A senha deve ter pelo menos 6 dígitos!'
      );
    }

    // Criptografando a senha:
    const hashedPassword = await hash(password, 8);

    // Inserindo os dados na database:
    await database.run(
      'INSERT INTO users (name, email, password, isAdmin ) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, isAdmin]
    );

    return response.status(201).json();
  }

  async update(request, response) {
    // Capturando os parâmetros do body e o ID:
    const { name, email, password, old_password } = request.body;
    const user_id = request.user.id;

    // Conectando com a database:
    const database = await sqliteConnection();
    const user = await database.get(
      'SELECT * FROM users WHERE id = (?)',
      [user_id]
    );

    // Verificações:
    if (!user) {
      throw new AppError('Usuário não encontrado');
    }

    const userWithUpdatedEmail = await database.get(
      'SELECT * FROM users WHERE email = (?)',
      [email]
    );

    if (userWithUpdatedEmail && userWithUpdatedEmail.id !== user.id) {
      throw new AppError('Este e-mail já está em uso.');
    }

    user.name = name;
    user.email = email;

    if (password && !old_password) {
      throw new AppError(
        'Você precisa informar a senha antiga para definir a nova senha'
      );
    }

    if (password && old_password) {
      const checkOldPassword = await compare(
        old_password,
        user.password
      );

      if (!checkOldPassword) {
        throw new AppError('A senha antiga não confere.');
      }

      user.password = await hash(password, 8);
    }

    // Inserindo os dados na database:
    await database.run(
      `
            UPDATE users SET
            name = ?,
            email = ?,
            password = ?,
            updated_at = DATETIME("now")
            WHERE id = ?`,
      [user.name, user.email, user.password, user_id]
    );

    return response.status(201).json();
  }
}

module.exports = UsersController;
