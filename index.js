const { createServer } = require('node:http');
const express = require('express');
const app = express();
const server = createServer(app);
const path = require('path');
const PORT = process.env.PORT || 3000;
const { networkInterfaces } = require('os');
const apiRouter = require('./api.js')

app.use(express.json({ limit: '50mb' })); // Add this to parse JSON bodies
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Add this for form data
app.use(`/`, express.static(path.join(__dirname, 'public/')));
app.use(`/api`, apiRouter);

// 404 handler: keep this at the end, so it only catches requests that don’t match any defined routes
app.use((req, res) => {
    res.status(404);
    res.send(`<h1>Error 404: Resource not found</h1>`);
});

// Start server
server.listen(PORT, () => {
    console.log("Server is running on these interfaces:");
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
            if (net.family === familyV4Value && !net.internal) {
                console.log(`${name}: http://${net.address}:${PORT}/`);
            }
        }
    }
    console.log("");
});