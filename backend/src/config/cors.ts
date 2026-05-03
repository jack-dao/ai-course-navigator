const isProduction = process.env.NODE_ENV === 'production';

export const allowedOrigins = [
  ...(isProduction ? [] : ['http://localhost:5173']),
  'https://aislugnavigator.com',
  'https://www.aislugnavigator.com',
];
