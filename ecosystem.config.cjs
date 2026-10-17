/**
 * J.A.R.V.I.S. MARK-V Sovereign 24/7 Revenue Engine Daemon Configuration
 * Configured for PM2 auto-restart and zero-crash background operation on Windows & Linux.
 */

module.exports = {
  apps: [
    {
      name: 'jarvis-revenue-engine',
      script: 'npx',
      args: 'tsx src/server.tsx',
      cwd: __dirname,
      interpreter: 'none',
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      min_uptime: '10s',
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3005,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3005,
      },
      error_file: './logs/revenue-engine-err.log',
      out_file: './logs/revenue-engine-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
