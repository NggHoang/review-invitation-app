module.exports = {
  apps: [{
    name: "invitation-app",
    script: "server.js",
    instances: "max",
    exec_mode: "cluster",
    env: {
      NODE_ENV: "production",
      PORT: 3000
    },
    env_production: {
      NODE_ENV: "production",
      PORT: 3000,
      MONGODB_URI: "mongodb://localhost:27017/invitation_db"
    }
  }]
}; 