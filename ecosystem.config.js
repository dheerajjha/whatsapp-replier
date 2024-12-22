module.exports = {
  apps: [
    {
      name: 'whatsapp-bot-backend',
      script: 'src/index.js',
      watch: true,
      env: {
        NODE_ENV: 'production',
        PORT: 3010
      },
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000
    },
    {
      name: 'whatsapp-bot-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: './',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000
    }
  ]
}; 