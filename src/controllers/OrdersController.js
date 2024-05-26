// Importando o Knex:
const knex = require('../database/knex');

class OrdersController {
  async create(request, response) {
    // Pegando parâmetros do body e o ID:
    const { cart, orderStatus, totalPrice, paymentMethod } =
      request.body;
    const user_id = request.user.id;

    // Verificando se o user_id existe:
    const userExists = await knex('users')
      .where({ id: user_id })
      .first();
    if (!userExists) {
      return response.status(404).json({ error: 'User not found' });
    }

    // Inserindo dados do pedido na database:
    const [order_id] = await knex('orders').insert({
      orderStatus,
      totalPrice,
      paymentMethod,
      user_id,
    });

    // Inserindo dados dos Itens na database:
    const itemsInsert = cart.map(async cartItem => {
      // Verificando se o dish_id existe:
      const dishExists = await knex('dishes')
        .where({ id: cartItem.id })
        .first();
      if (!dishExists) {
        return response
          .status(404)
          .json({ error: `Dish with ID ${cartItem.id} not found` });
      }

      return {
        title: cartItem.title,
        quantity: cartItem.quantity,
        dish_id: cartItem.id,
        order_id,
      };
    });

    await Promise.all(itemsInsert)
      .then(async items => {
        // Filtrando itens não encontrados:
        const validItems = items.filter(item => item);

        // Inserindo itens válidos na tabela ordersItems:
        await knex('ordersItems').insert(validItems);

        return response.status(201).json(order_id);
      })
      .catch(error => {
        return response
          .status(500)
          .json({ error: 'Internal server error' });
      });
  }

  async index(request, response) {
    // Capturando o ID:
    const user_id = request.user.id;

    // Recebendo dados do usuário pelo ID informado:
    const user = await knex('users').where({ id: user_id }).first();

    // Listando pedidos e itens ao mesmo tempo (innerJoin) para o usuário:
    if (!user.isAdmin) {
      const orders = await knex('ordersItems')
        .where({ user_id })
        .select([
          'orders.id',
          'orders.user_id',
          'orders.orderStatus',
          'orders.totalPrice',
          'orders.paymentMethod',
          'orders.created_at',
        ])

        .innerJoin('orders', 'orders.id', 'ordersItems.order_id')
        .groupBy('orders.id');

      const ordersItems = await knex('ordersItems');
      const ordersWithItems = orders.map(order => {
        const orderItem = ordersItems.filter(
          item => item.order_id === order.id
        );

        return {
          ...order,
          items: orderItem,
        };
      });

      return response.status(200).json(ordersWithItems);

      // Listando Orders e OrdersItems ao mesmo tempo (innerJoin) para o Administrador:
    } else {
      const orders = await knex('ordersItems')
        .select([
          'orders.id',
          'orders.user_id',
          'orders.orderStatus',
          'orders.totalPrice',
          'orders.paymentMethod',
          'orders.created_at',
        ])

        .innerJoin('orders', 'orders.id', 'ordersItems.order_id')
        .groupBy('orders.id');

      const ordersItems = await knex('ordersItems');
      const ordersWithItems = orders.map(order => {
        const orderItem = ordersItems.filter(
          item => item.order_id === order.id
        );

        return {
          ...order,
          items: orderItem,
        };
      });

      return response.status(200).json(ordersWithItems);
    }
  }

  async update(request, response) {
    // Capturando parâmetros do Body:
    const { id, orderStatus } = request.body;

    // Atualizando dados do Order pelo ID informado:
    await knex('orders').update({ orderStatus }).where({ id });

    return response.status(201).json();
  }
}

module.exports = OrdersController;
