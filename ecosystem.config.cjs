module.exports = {
    apps: [
        {
            name: 'thevoiceofhope-backend',
            script: 'server/src/index.js',
            env: {
                NODE_ENV: 'production',
                PORT: 5000,
            },
        },
    ],
};
