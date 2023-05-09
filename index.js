const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');
app.use(cors());
app.use(express.json());
require('dotenv').config();
const ObjectId = require('mongodb').ObjectId;
const stripe = require('stripe')(process.env.SECRET_KEY)

//connect mongodb
const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://jute-hand-craft:6exytIxu3ESBx2RS@cluster0.ppycm.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        const database = client.db("jute-hand-crafts");
        const productsCollection = database.collection("products");
        const reviewsCollection = database.collection("reviews");
        const ordersCollection = database.collection("orders");
        const usersCollection = database.collection("users")
        console.log('db connected');

        //get products
        app.get('/products', async (req, res) => {
            const result = await productsCollection.find({}).toArray();
            res.send(result)
        })
        //post products
        app.post('/product', async (req, res) => {
            const data = req.body;
            console.log(data)
            const result = await productsCollection.insertOne(data)
            res.send(result)
        })
        //get reviews
        app.get('/reviews', async (req, res) => {
            const result = await reviewsCollection.find({}).toArray();
            res.send(result)
        })
        //add review
        app.post('/review', async (req, res) => {
            const data = req.body;
            console.log(data)
            const result = await reviewsCollection.insertOne(data)
            res.json(result)
        })
        //get single products
        app.get('/products/:id', async (req, res) => {
            const id = req.params;
            console.log(id);
            const query = { _id: ObjectId(id) };
            const result = await productsCollection.findOne(query);
            res.send(result)
        })
        //post order
        app.post('/addtoCart', async (req, res) => {
            const data = req.body;
            console.log(data);
            const result = await ordersCollection.insertOne(data);
            res.json(result);

        })
        //get orders
        app.get('/orders', async (req, res) => {
            const result = await ordersCollection.find({}).toArray();
            res.send(result);
        })
        //get orders by email
        app.get('/order', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            console.log(email)
            const result = await ordersCollection.find(query).toArray();
            res.send(result);
        })
        //delete single order
        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: ObjectId(id) };
            const result = await ordersCollection.deleteOne(query); console.log(result)
            res.send(result);
        });
        //delete single product
        app.delete('/product/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(query); console.log(result)
            res.send(result);
        });
        //update status
        app.put('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const data = req.body;
            console.log(id);

            const query = { _id: ObjectId(id) };
            const doc = { $set: { status: "approved" } }
            console.log(doc)
            const result = await ordersCollection.updateOne(query, doc);
            console.log(result)
            res.send(result);
        })
        //find admin
        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role == "admin") {
                isAdmin = true;
            }
            console.log('admin', isAdmin)
            res.json({ admin: isAdmin })
        });
        //insert users
        app.put('/user', async (req, res) => {
            const data = req.body;
            const filter = { email: data.email }
            const option = { upsert: true };
            const doc = {
                $set: data
            }
            const result = await usersCollection.updateOne(filter, doc, option)
            res.json(result);
        })
        // app.post('/user', async (req, res) => {
        //     const data = req.body;
        //     const doc = {
        //         $set: data
        //     }
        //     const result = await usersCollection.updateOne(filter, doc, option)
        //     res.json(result);
        //     const result = await usersCollection.insertOne(data);
        //     res.send(result);
        // })
        //make admin
        app.put('/user/admin', async (req, res) => {
            const email = req.body.email;

            const filter = { email: email }
            const doc = { $set: { role: 'admin' } }
            console.log(doc);
            const option = { upsert: true };
            const result = await usersCollection.updateOne(filter, doc, option);
            res.json(result)
        })

        // get orders by id fo payment
        app.get('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await ordersCollection.findOne(query);
            res.send(result)
        })
        app.post('/create-payment-intent', async (req, res) => {
            const paymentInfo = req.body;
            console.log(paymentInfo)
            const amount = paymentInfo.price * 100
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount, currency: 'usd', payment_method_types: ['card']
            })
            res.json({ clientSecret: paymentIntent.client_secret })
        })
        //update orders by id
        app.put('/order/:id', async (req, res) => {

            const query = { _id: ObjectId(id) };
            const payment = req.body;
            const doc = {
                $set: {
                    payment: payment
                }

            }
            const result = await ordersCollection.updateOne(query, doc);
            res.send(result)
        }


        )
    } finally {
        //   await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    console.log('hello')
    res.send('hello there')
})
app.listen(port, () => {
    console.log('listening port', port);
})