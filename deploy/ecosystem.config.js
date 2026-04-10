// PM2 配置：管理 NestJS 后端进程
// 使用：pm2 start deploy/ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'villa-server',
      cwd: './server',
      script: 'dist/src/main.js',
      instances: 1, // 2G 内存建议 1；4G+ 可改 'max' 使用所有核心
      exec_mode: 'fork', // 需要多实例改 'cluster'
      autorestart: true,
      watch: false,
      max_memory_restart: '800M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '../logs/server-error.log',
      out_file: '../logs/server-out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
