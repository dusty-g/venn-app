module.exports = {
  apps: [{
    name: 'venn-app',
    script: 'npx',
    args: 'tsx server/index.ts',
    cwd: '/opt/venn-app',
    env: {
      NODE_ENV: 'production',
      VENN_PORT: '3001',
      VENN_PASSPHRASE: process.env.VENN_PASSPHRASE || 'change-me-before-deploying'
    },
    instances: 1,
    autorestart: true,
    max_restarts: 10,
  }]
}
