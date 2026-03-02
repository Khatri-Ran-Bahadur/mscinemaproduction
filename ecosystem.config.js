module.exports = {
  apps: [
    {
      name: "stagemscinemas-nextjs",
      cwd: "/var/www/stagemscinema",
      script: "npm",
      args: "start -- -p 3005",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3005,
        NEXT_TELEMETRY_DISABLED: "1",
        // IMPORTANT: use your staging DB here (stage_db)
        DATABASE_URL: "postgresql://stage_user:stagepass12345!@127.0.0.1:5432/stage_db"
      },
      error_file: "/var/log/pm2/stagemscinemas-error.log",
      out_file: "/var/log/pm2/stagemscinemas-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true
    }
  ]
};
