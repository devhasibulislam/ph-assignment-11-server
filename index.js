const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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

// adding next level security to db api conduct with ui
function verifyJWY(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.PRIVATE_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' });
        }
        // console.log(decoded);
        req.decoded = decoded;
        next();
    })

    // console.log("inside verifyJWT", authHeader);
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.uumdg.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();

        // own following database
        const productCollection = client.db("warehouseManagement").collection("product");
        const myItemsCollection = client.db("warehouseManagement").collection("myItems");
        const qnaCollection = client.db("warehouseManagement").collection("qna");
        console.log('MongoDB connected!');

        // use AUTH for extra security for login
        app.post('/login', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.PRIVATE_KEY, {
                expiresIn: "7d"
            });

            res.send({ token });
        });

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
        });

        // get my added product as myItems product's view
        // user secured by email and password
        app.get('/order', verifyJWY, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            if (email === decodedEmail) {
                const query = { email };
                const cursor = myItemsCollection.find(query);
                const orders = await cursor.toArray();

                res.send(orders);
            } else {
                res.status(403).send({ message: 'forbidden access' });
            }
        });

        // get my added product as myItems product's view
        // only profiled by google.com
        app.get('/item', async (req, res) => {
            const email = req.query.email;
            const query = { email };
            const cursor = myItemsCollection.find(query);
            const orders = await cursor.toArray();

            res.send(orders);
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

        // count all custom product
        app.get('/itemsCount', async (req, res) => {
            avoidWarning(req);

            const query = {};
            const cursor = myItemsCollection.find(query);
            const itemsCount = await cursor.count();

            res.send({ count: itemsCount });
        });

        // add a custom product
        app.post('/addProduct', async (req, res) => {
            const doc = req.body;
            const result = await myItemsCollection.insertOne(doc);

            res.send(result);
        });

        // delete a custom product
        app.delete('/myItems/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await myItemsCollection.deleteOne(query);

            res.send(result);
        });

        // update a product's segment
        app.put('/product/:id', async (req, res) => {
            const updateProduct = req.body;
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const option = { upsert: true };
            const updateDoc = {
                $set: updateProduct
            };

            const result = await productCollection.updateOne(filter, updateDoc, option);

            res.send(result);
        });

        // update a custom product's segment
        app.put('/myItems/:id', async (req, res) => {
            const updateProduct = req.body;
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const option = { upsert: true };
            const updateDoc = {
                $set: updateProduct
            };

            const result = await myItemsCollection.updateOne(filter, updateDoc, option);

            res.send(result);
        });

        // get qna
        app.get('/qna', async (req, res) => {
            const query = {};
            const cursor = qnaCollection.find(query);
            const blog = await cursor.toArray();

            res.send(blog);
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
