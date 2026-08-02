module.exports = {
  apps: [
    {
      name: "commit-city",
      script: "server.js",
      cwd: "/home/ubuntu/projects/commit-city",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
    },
  ],
};
