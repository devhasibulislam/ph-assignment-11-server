const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// just for avoid warning!
const avoidWarning = (req) => {
    console.log(req.route);
};


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.uumdg.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();

        const productCollection = client.db("warehouseManagement").collection("product");
        console.log('MongoDB connected!');

        app.get('/product', async (req, res) => {
            const query = {};
            const cursor = productCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })
    } finally {
        // await client.close()
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    avoidWarning(req);
    res.send('Warehouse Management at server side running!');
})

app.listen(port, () => {
    console.log('Warehouse is listening at port: ', port);
})
