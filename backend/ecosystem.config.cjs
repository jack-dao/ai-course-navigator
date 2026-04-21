module.exports = {
  apps: [
    {
      name: 'ai-slug-navigator',
      script: 'tsx',
      args: 'src/server.ts',
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
