module.exports = {
  apps: [{
    name: 'mscinemas-staging',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/staging',
    instances: 1, // Single instance to prevent CPU spikes
    exec_mode: 'fork', // Use fork mode instead of cluster for better resource control
    autorestart: true,
    watch: false,
    max_memory_restart: '1G', // Increased memory limit for better performance
    min_uptime: '10s', // Minimum uptime before considering stable
    max_restarts: 10, // Limit restarts to prevent restart loops
    restart_delay: 4000, // Delay between restarts
    kill_timeout: 5000, // Timeout for graceful shutdown
    listen_timeout: 10000, // Timeout for app to listen
    // CPU and performance optimization
    node_args: '--max-old-space-size=1024', // Optimize Node.js memory
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NODE_OPTIONS: '--max-old-space-size=1024',
      TZ: 'Asia/Kuala_Lumpur',
      // Next.js optimization
      NEXT_TELEMETRY_DISABLED: '1' // Disable telemetry to reduce CPU usage
    },
    error_file: '/var/log/pm2/mscinemas-staging-error.log',
    out_file: '/var/log/pm2/mscinemas-staging-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    // CPU throttling to prevent spikes
    cron_restart: '0 3 * * *', // Daily restart at 3 AM to clear memory leaks
    exp_backoff_restart_delay: 100 // Exponential backoff for restarts
  }]
};

