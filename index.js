const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// just for avoid warning!
const avoidWarning = (req) => {
    console.log(req.route);
};

app.get('/', (req, res) => {
    avoidWarning(req);
    res.send('Warehouse Management at server side running!');
})

app.listen(port, () => {
    console.log('Warehouse is listening at port: ', port);
})
