const express = require('express');

const app = express();

const port = 3000; // You can use any available port

app.get('/', (req, res) => {
    res.send('Hello This is Vending Machine!');});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
