module.exports = {
  apps: [{
    name:             'fleet-backend',
    script:           'dist/index.js',
    cwd:              '/home/vyva/fleet-backend',
    instances:        1,
    exec_mode:        'fork',
    watch:            false,
    max_memory_restart: '256M',
    restart_delay:    3000,
    max_restarts:     10,
    env_production: {
      NODE_ENV: 'production'
    }
  }]
}
