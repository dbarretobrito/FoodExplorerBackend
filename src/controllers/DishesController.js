// Knex, App Error e Disk Storage Import:
const knex = require('../database/knex');
const AppError = require('../utils/AppError');
const DiskStorage = require('../providers/DiskStorage');

class DishesController {
  async create(request, response) {
    // Parâmetros enviados pelo body:
    const { title, description, category, price, ingredients } =
      request.body;

    // Conferência se o prato já existe no banco de dados:
    const checkDishAlreadyExistInDatabase = await knex('dishes')
      .where({ title })
      .first();

    if (checkDishAlreadyExistInDatabase) {
      throw new AppError('Este prato já existe em nossa database');
    }

    // Upload de imagem:
    const dishFilename = request.file.filename;
    const diskStorage = new DiskStorage();
    const filename = await diskStorage.saveFile(dishFilename);

    // Inserindo o prato e todos os seus dados:
    const insertedDish = await knex('dishes').insert({
      image: filename,
      title,
      description,
      category,
      price,
    });

    // Obtendo o ID do prato inserido:
    const dish_id = insertedDish[0];

    // Tratando ingredientes: pode ser uma string ou um array:
    let ingredientsInsert = [];
    if (Array.isArray(ingredients)) {
      ingredientsInsert = ingredients.map(ingredient => ({
        name: ingredient,
        dish_id,
      }));
    } else if (typeof ingredients === 'string') {
      ingredientsInsert.push({
        name: ingredients,
        dish_id,
      });
    } else {
      throw new AppError(
        'Ingredients devem ser uma string ou um array de strings'
      );
    }

    await knex('ingredients').insert(ingredientsInsert);

    return response.status(201).json();
  }

  async update(request, response) {
    // Pegando parâmetros do body e o ID:
    const {
      title,
      description,
      category,
      price,
      ingredients,
      image,
    } = request.body;
    const { id } = request.params;

    // Request do image filename:
    const imageFileName = request.file ? request.file.filename : null;

    // Instanciando o Disk Storage:
    const diskStorage = new DiskStorage();

    // Recebendo os dados do prato pelo id informado:
    const dish = await knex('dishes').where({ id }).first();
    if (!dish) {
      return response
        .status(404)
        .json({ message: 'Prato não encontrado!' });
    }

    // Deletando a imagem antiga se houver uma imagem nova e salvando essa imagem nova:
    if (imageFileName) {
      if (dish.image) {
        await diskStorage.deleteFile(dish.image);
      }
      const filename = await diskStorage.saveFile(imageFileName);
      dish.image = filename;
    }

    // Verificações:
    //dish.image = image ?? filename;
    dish.title = title ?? dish.title;
    dish.description = description ?? dish.description;
    dish.category = category ?? dish.category;
    dish.price = price ?? dish.price;

    // Atualizando os dados do prato pelo ID informado:
    await knex('dishes').where({ id }).update(dish);

    // Conferindo se o prato tem um ingredientes apenas e atualizando no database:
    const hasOnlyOneIngredient = typeof ingredients === 'string';

    let ingredientsInsert;

    if (hasOnlyOneIngredient) {
      ingredientsInsert = {
        name: ingredients,
        dish_id: dish.id,
      };
    } else if (Array.isArray(ingredients) && ingredients.length > 1) {
      ingredientsInsert = ingredients.map(ingredient => {
        return {
          dish_id: dish.id,
          name: ingredient,
        };
      });
    }

    await knex('ingredients').where({ dish_id: id }).delete();
    if (ingredientsInsert) {
      await knex('ingredients')
        .where({ dish_id: id })
        .insert(ingredientsInsert);
    }
    return response.status(201).json('Prato atualizado com sucesso');
  }

  async show(request, response) {
    // Capturando o ID:
    const { id } = request.params;

    // Recebendo os dados do prato pelo id informado:
    const dish = await knex('dishes').where({ id }).first();
    const ingredients = await knex('ingredients')
      .where({ dish_id: id })
      .orderBy('name');

    return response.status(201).json({
      ...dish,
      ingredients,
    });
  }

  async delete(request, response) {
    // Capturando o ID:
    const { id } = request.params;

    // Deletando o prato pelo ID informado:
    await knex('dishes').where({ id }).delete();

    return response.status(202).json();
  }

  async index(request, response) {
    // Capturando os Parâmetros de Query:
    const { title, ingredients } = request.query;

    // Listando pratos e ingredientes ao mesmo tempo (innerJoin):
    let dishes;

    if (ingredients) {
      const filterIngredients = ingredients
        .split(',')
        .map(ingredient => ingredient.trim());

      dishes = await knex('ingredients')
        .select([
          'dishes.id',
          'dishes.title',
          'dishes.description',
          'dishes.category',
          'dishes.price',
          'dishes.image',
        ])
        .whereLike('dishes.title', `%${title}%`)
        .whereIn('name', filterIngredients)
        .innerJoin('dishes', 'dishes.id', 'ingredients.dish_id')
        .groupBy('dishes.id')
        .orderBy('dishes.title');
    } else {
      dishes = await knex('dishes')
        .whereLike('title', `%${title}%`)
        .orderBy('title');
    }

    const dishesIngredients = await knex('ingredients');
    const dishesWithIngredients = dishes.map(dish => {
      const dishIngredient = dishesIngredients.filter(
        ingredient => ingredient.dish_id === dish.id
      );

      return {
        ...dish,
        ingredients: dishIngredient,
      };
    });

    return response.status(200).json(dishesWithIngredients);
  }
}

module.exports = DishesController;
