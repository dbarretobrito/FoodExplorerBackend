// Impoortando o AppError e o Knex:
const knex = require('../database/knex');
const AppError = require('../utils/AppError');

async function ensureUserIsAdmin(request, response, next) {
  // Capturando o ID:
  const user_id = request.user.id;

  // Recebendo os daados do usuário pelo ID informado:
  const user = await knex('users').where({ id: user_id }).first();

  // Verificando se o usuário é administrador:
  if (!user.isAdmin) {
    throw new AppError('Access Denied: Unauthorized User', 401);
  }

  next();
}

module.exports = ensureUserIsAdmin;
