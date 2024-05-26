// Importando o Knex, App Error e Disk Storage:
const knex = require('../database/knex');
const AppError = require('../utils/AppError');
const DiskStorage = require('../providers/DiskStorage');

class UserAvatarController {
  async update(request, response) {
    // Capturando o ID e image filename:
    const user_id = request.user.id;
    const avatarFilename = request.file.filename;

    // Instanciando o Disk Storage:
    const diskStorage = new DiskStorage();

    // Pegando os dados do usuário pelo ID informado:
    const user = await knex('users').where({ id: user_id }).first();

    // Verificações:
    if (!user) {
      throw new AppError(
        'Somente usuários autenticados podem mudar o avatar',
        401
      );
    }

    // Deletando a imagem antiga se houver uma imagem nova e salvando essa imagem nova:
    if (user.avatar) {
      await diskStorage.deleteFile(user.avatar);
    }

    const filename = await diskStorage.saveFile(avatarFilename);
    user.avatar = filename;

    await knex('users').update(user).where({ id: user_id });

    return response.status(201).json(user);
  }
}

module.exports = UserAvatarController;
