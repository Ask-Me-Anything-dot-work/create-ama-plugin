import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { env } from './config/env';
import { CreateUserSchema } from './lib/validation/example';

export const app = new Hono();

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

// Example typed route
app.post('/users', zValidator('json', CreateUserSchema), (c) => {
  const user = c.req.valid('json');
  
  // In a real app, you would save this to a database
  const newUser = {
    id: crypto.randomUUID(),
    ...user,
  };

  return c.json({
    message: 'User created successfully',
    user: newUser,
  }, 201);
});

console.log(`🚀 Server is running on port ${env.PORT}`);

export default {
  port: env.PORT,
  fetch: app.fetch,
};
