// Importando o Knex, App Error, Compare, Token e AuthConfig:
const knex = require('../database/knex');

const authConfig = require('../configs/auth');
const { sign } = require('jsonwebtoken');

const AppError = require('../utils/AppError');
const { compare } = require('bcryptjs');

class SessionsController {
  async create(request, response) {
    // Capturando parâmetros do Body:
    const { email, password } = request.body;

    // Pegando os dados do usuário pelo email informamdo:
    const user = await knex('users').where({ email }).first();

    // Verificações:
    if (!user) {
      throw new AppError('E-mail e/ou senha incorretos', 401);
    }

    const passwordMatched = await compare(password, user.password);

    if (!passwordMatched) {
      throw new AppError('E-mail e/ou senha incorretos', 401);
    }

    const { secret, expiresIn } = authConfig.jwt;
    const token = sign({}, secret, {
      subject: String(user.id),
      expiresIn,
    });

    return response.status(201).json({ user, token });
  }
}

module.exports = SessionsController;
