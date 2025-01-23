const express = require('express');
const app = express();
const PORT = process.env.PORT || 5001;

app.get('/', (req, res) => {
    res.send('Hello, Podcast Generator!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});  