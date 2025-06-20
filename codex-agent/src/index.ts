import { App } from '@microsoft/teams.apps';
import { ChatPrompt, LocalMemory, Message } from '@microsoft/teams.ai';
import { LocalStorage } from '@microsoft/teams.common/storage';
import { DevtoolsPlugin } from '@microsoft/teams.dev';
import { OpenAIChatModel } from '@microsoft/teams.openai';
import { AdaptiveCard } from '@microsoft/teams.cards';

interface Pizza {
  type: string;
  size: string;
  crust?: string;
  toppings?: string[];
}

interface Order {
  pizzas: Pizza[];
  name?: string;
  address?: string;
  payment?: string;
  status?: string;
}

const storage = new LocalStorage<Array<Message>>();
const orders = new LocalStorage<Order>();

const app = new App({
  storage,
  plugins: [new DevtoolsPlugin()],
});

function buildCard(order: Order): AdaptiveCard {
  const pizzaSummary = order.pizzas
    .map(
      (p, i) => `${i + 1}. ${p.size} ${p.type} ${p.crust ? `(${p.crust})` : ''}${
        p.toppings && p.toppings.length
          ? ` with ${p.toppings.join(', ')}`
          : ''
      }`
    )
    .join('\n');
  const card = new AdaptiveCard(
    {
      type: 'TextBlock',
      text: 'Order Summary',
      weight: 'Bolder',
      size: 'Large',
    },
    {
      type: 'TextBlock',
      text: pizzaSummary || 'No pizzas added yet.',
      wrap: true,
    },
    {
      type: 'TextBlock',
      text: order.name ? `Name: ${order.name}` : '',
      wrap: true,
    },
    {
      type: 'TextBlock',
      text: order.address ? `Address: ${order.address}` : '',
      wrap: true,
    },
    {
      type: 'TextBlock',
      text: order.payment ? `Payment: ${order.payment}` : '',
      wrap: true,
    }
  )
    .with$schema('http://adaptivecards.io/schemas/adaptive-card.json')
    .withVersion('1.4')
    .withActions(
      { type: 'Action.Submit', title: 'Confirm', data: { action: 'confirm' } },
      { type: 'Action.Submit', title: 'Edit', data: { action: 'edit' } },
      { type: 'Action.Submit', title: 'Cancel', data: { action: 'cancel' } }
    );
  return card;
}

app.on('message', async ({ stream, activity }) => {
  const key = `${activity.conversation.id}/${activity.from.id}`;
  const memory = new LocalMemory({ messages: storage.get(key) || [] });
  const order = orders.get(key) || { pizzas: [] };

  const prompt = new ChatPrompt({
    messages: memory,
    instructions:
      'You are a pizza ordering assistant. Use the provided functions to manage the order and keep responses short.',
    model: new OpenAIChatModel({
      model: 'gpt-4o',
      apiKey: process.env.OPENAI_API_KEY,
    }),
  });

  prompt.function(
    'addPizza',
    'Add a pizza to the order',
    {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'pizza type' },
        size: { type: 'string', description: 'pizza size' },
        crust: { type: 'string', description: 'crust type' },
        toppings: {
          type: 'array',
          items: { type: 'string' },
          description: 'toppings',
        },
      },
      required: ['type', 'size'],
    },
    async (args) => {
      order.pizzas.push({
        type: args.type,
        size: args.size,
        crust: args.crust,
        toppings: args.toppings || [],
      });
      return { ok: true };
    }
  );

  prompt.function('viewOrder', 'View the order', {}, async () => order);

  prompt.function(
    'checkout',
    'Provide checkout information',
    {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'customer name' },
        address: { type: 'string', description: 'delivery address' },
        payment: { type: 'string', description: 'payment method' },
      },
      required: ['name'],
    },
    async (args) => {
      order.name = args.name;
      order.address = args.address;
      order.payment = args.payment;
      order.status = 'preparing';
      const card = buildCard(order);
      stream.emit({
        attachments: [
          {
            contentType: 'application/vnd.microsoft.card.adaptive',
            content: card,
          },
        ],
      });
      return { ok: true };
    }
  );

  prompt.function('trackOrder', 'Get order status', {}, async () => {
    return order.status || 'no order';
  });

  await prompt.send(activity.text, {
    onChunk: (chunk) => stream.emit(chunk),
  });

  storage.set(key, await memory.values());
  orders.set(key, order);
});

app.on('card.action', async ({ stream, activity }) => {
  const key = `${activity.conversation.id}/${activity.from.id}`;
  const order = orders.get(key);
  if (!order) {
    await stream.emit('No active order.');
    return { statusCode: 200, type: 'application/vnd.microsoft.activity.message', value: 'No active order.' };
  }
  const action = (activity.value as any)?.action;
  if (action === 'confirm') {
    order.status = 'baking';
    await stream.emit('Your order has been placed!');
    orders.set(key, order);
    return { statusCode: 200, type: 'application/vnd.microsoft.activity.message', value: 'Order confirmed' };
  } else if (action === 'cancel') {
    orders.delete(key);
    await stream.emit('Your order was cancelled.');
    return { statusCode: 200, type: 'application/vnd.microsoft.activity.message', value: 'Order cancelled' };
  } else {
    await stream.emit('You can continue editing your order.');
    orders.set(key, order);
    return { statusCode: 200, type: 'application/vnd.microsoft.activity.message', value: 'Edit order' };
  }
});

(async () => {
  await app.start(+(process.env.PORT || 3978));
})();
