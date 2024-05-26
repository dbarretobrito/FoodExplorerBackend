// Importando o AppError, authConfig e JWT:
const { verify } = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const authConfig = require('../configs/auth');

function ensureAuthenticated(request, response, next) {
  const authHeader = request.headers.authorization;

  // Verificando se o token existe:
  if (!authHeader) {
    throw new AppError('JWT Token não informado', 401);
  }

  // Se existir, colocando o token na posição 1 do array:
  const [, token] = authHeader.split(' ');

  // Verificando se o token é válido:
  try {
    const { sub: user_id } = verify(token, authConfig.jwt.secret);

    request.user = {
      id: Number(user_id),
    };

    return next();
  } catch {
    throw new AppError('JWT Token inválido', 401);
  }
}

module.exports = ensureAuthenticated;
