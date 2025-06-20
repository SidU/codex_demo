import { App } from '@microsoft/teams.apps';
import { ChatPrompt, Message } from '@microsoft/teams.ai';
import { LocalStorage } from '@microsoft/teams.common/storage';
import { DevtoolsPlugin } from '@microsoft/teams.dev';
import { OpenAIChatModel } from '@microsoft/teams.openai';

const storage = new LocalStorage<Array<Message>>();
const app = new App({
  storage,
  plugins: [new DevtoolsPlugin()],
});

interface OrderState {
  stage: 'awaiting_size' | 'awaiting_toppings';
  size?: string;
  toppings?: string[];
}

const orders = new Map<string, OrderState>();

app.on('message', async ({ stream, activity }) => {
  const key = `${activity.conversation.id}/${activity.from.id}`;
  const text = (activity.text || '').trim().toLowerCase();
  const order = orders.get(key);

  if (!order && text.includes('pizza')) {
    orders.set(key, { stage: 'awaiting_size' });
    await stream.emit({
      type: 'message',
      text: 'What size pizza would you like? (small, medium, large)',
    });
    return;
  }

  if (order?.stage === 'awaiting_size') {
    order.size = text;
    order.stage = 'awaiting_toppings';
    await stream.emit({
      type: 'message',
      text: 'Great! What toppings would you like? (comma separated)',
    });
    return;
  }

  if (order?.stage === 'awaiting_toppings') {
    order.toppings = text.split(',').map((t) => t.trim()).filter(Boolean);
    const card = {
      $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
      type: 'AdaptiveCard',
      version: '1.6',
      body: [
        { type: 'TextBlock', size: 'Medium', weight: 'Bolder', text: 'Pizza Order' },
        { type: 'TextBlock', text: `Size: ${order.size}` },
        { type: 'TextBlock', text: `Toppings: ${order.toppings.join(', ')}` },
      ],
    };

    await stream.emit({
      type: 'message',
      attachments: [
        { contentType: 'application/vnd.microsoft.card.adaptive', content: card },
      ],
    });

    orders.delete(key);
    return;
  }

  const prompt = new ChatPrompt({
    messages: [
      {
        role: 'system',
        content: 'Speak like a pirate, yes, in the style of Master Yoda.',
      },
      ...(storage.get(key) || []),
    ],
    model: new OpenAIChatModel({
      model: 'gpt-4o',
      apiKey: process.env.OPENAI_API_KEY,
    }),
  });

  await prompt.send(activity.text, {
    onChunk: (chunk) => stream.emit(chunk),
  });
});

(async () => {
  await app.start(+(process.env.PORT || 3978));
})();
