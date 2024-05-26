// Importando o FS, Path e UploadConfig:
const fs = require('fs');
const path = require('path');
const uploadConfig = require('../configs/upload');

class DiskStorage {
  async saveFile(file) {
    await fs.promises.rename(
      // Posição inicial do arquivo:
      path.resolve(uploadConfig.TMP_FOLDER, file),
      // Posição final:
      path.resolve(uploadConfig.UPLOADS_FOLDER, file)
    );

    return file;
  }

  async deleteFile(file) {
    // Pegando a localização do arquivo:
    const filePath = path.resolve(uploadConfig.UPLOADS_FOLDER, file);

    try {
      // Se existir:
      await fs.promises.stat(filePath);
    } catch {
      return;
    }

    // Deletando:
    await fs.promises.unlink(filePath);
  }
}

module.exports = DiskStorage;
