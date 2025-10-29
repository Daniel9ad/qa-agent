/**
 * Configuración de PM2 para Servidores MCP
 * 
 * Uso:
 * - pm2 start ecosystem.config.js
 * - pm2 stop all
 * - pm2 restart all
 * - pm2 logs
 * - pm2 monit
 */

module.exports = {
  apps: [
    {
      name: 'playwright-mcp',
      script: 'npx',
      args: ['-y', '@playwright/mcp', '--port', '3001'],
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/playwright-mcp-error.log',
      out_file: './logs/playwright-mcp-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    // Descomenta para agregar más servidores MCP
    /*
    {
      name: 'context7-mcp',
      script: 'npx',
      args: ['-y', '@context7/mcp', '--port', '3002'],
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/context7-mcp-error.log',
      out_file: './logs/context7-mcp-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'custom-mcp',
      script: 'node',
      args: ['./path/to/your/mcp-server.js', '--port', '3003'],
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/custom-mcp-error.log',
      out_file: './logs/custom-mcp-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    */
  ],
};
