module.exports = {
  apps: [
    {
      name: 'ai-slug-navigator',
      script: 'tsx',
      args: 'src/server.ts',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      kill_timeout: 5000,
      listen_timeout: 10000,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
