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
        const myItemsCollection = client.db("warehouseManagement").collection("myItems");
        console.log('MongoDB connected!');

        // get all products
        app.get('/product', async (req, res) => {
            const pageNumber = parseInt(req.query.pageNumber);
            const viewItems = parseInt(req.query.viewItems);

            const query = {};
            const cursor = productCollection.find(query);
            let products;

            if (pageNumber || viewItems) {
                products = await cursor.skip(pageNumber * viewItems).limit(viewItems).toArray();
            } else {
                products = await cursor.toArray();
            }

            res.send(products);
        });

        // get my added product
        app.get('/myItems', async (req, res) => {
            avoidWarning(req);
            
            const query = {};
            const cursor = myItemsCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        })

        // count all products
        app.get('/productCount', async (req, res) => {
            avoidWarning(req);

            const query = {};
            const cursor = productCollection.find(query);
            const productCount = await cursor.count();
            res.send({ count: productCount }); // 1. same as 2 but form as object:, output => 'count': 50
            // res.json(count); // 2. same as 1 but form as json, output => 50
        });

        // add a product
        app.post('/addProduct', async (req, res) => {
            const doc = req.body;
            const result = await myItemsCollection.insertOne(doc);
            res.send(result);
        });

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
