const express = require('express')
const app = express()
require('dotenv').config()
const jwt = require('jsonwebtoken')
const cors = require('cors')
const stripe = require('stripe')(process.env.STRIPE)
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5000

// middleware
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.PASSWORD_DB}@cluster0.l4anbhy.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const userCollection = client.db("EmployeeMangement").collection("user")
    const PaymentCollection = client.db("EmployeeMangement").collection("payment")
    const workCollection = client.db("EmployeeMangement").collection("Worksheet")

    app.post('/users',async(req,res)=>{
      const body = req.body
      console.log(body)
      const result = await userCollection.insertOne(body)
      res.send(result)
    })
    app.get('/users/:email',async(req,res)=>{
      const email = req.params.email
      const query = {email:email}
      const result = await userCollection.findOne(query)
      res.send(result)
    })
    app.get('/users',async(req,res)=>{
      const result = await userCollection.find().toArray()
      res.send(result)
    })
    app.patch('/users/:id',async(req,res)=>{
      const id = req.params.id
      const query = {_id : new ObjectId(id)}
      console.log(query)
      const doc = {
        $set:{
          verify : 'true'
        }
      }
      const result = await userCollection.updateOne(query,doc)
      console.log(result)
      res.send(result)
    })
    app.get('/employeelist/details/:id',async(req,res)=>{
      const id = req.params.id
      const query = {_id : new ObjectId(id)}
      const result = await userCollection.findOne(query)
      res.send(result)
    })
    app.get('/worksheet',async(req,res)=>{
      const result = await workCollection.find().toArray()
      res.send(result)
    })
    app.post("/create-payment-intent",async(req,res)=>{
      const {price} = req.body
      const amount = parseInt(price*100)
      console.log(price)
      const paymentIntent = await stripe.paymentIntents.create({
        amount:amount,
        currency: "usd",
        payment_method_types: ["card"]
      })
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    })
    app.post('/payment',async(req,res)=>{
      const payments = req.body
      const result = await PaymentCollection.insertOne(payments)
      // caryfully delete it item form the card;
      res.send(result)
    })
    // employee
    app.get('/PaymentHistory/:email',async(req,res)=>{
      const email = req.params.email
      const query = {email:email}
      const result = await PaymentCollection.find(query).toArray()
      res.send(result)
    })
    app.get('/compare/:email',async(req,res)=>{
      const email = req.params.email
      const query = {email:email}
      console.log(email)
      const result = await PaymentCollection.find(query).toArray()
      console.log(result)
      res.send(result)
    })
    app.post('/works',async(req,res)=>{
      const body = req.body
      console.log(body)
      const result = await workCollection.insertOne(body)
      res.send(result)
    })
    // admin
    app.patch('/admin/:id',async(req,res)=>{
      const id = req.params.id
      const query = {_id : new ObjectId(id)}
      console.log(query)
      const doc = {
        $set:{
          role : 'HR'
        }
      }
      const result = await userCollection.updateOne(query,doc)
      console.log(result)
      res.send(result)
    })
    app.patch('/fire/:id',async(req,res)=>{
      const id = req.params.id
      const query = {_id : new ObjectId(id)}
      console.log(query)
      const doc = {
        $set:{
          role : 'user'
        }
      }
      const result = await userCollection.updateOne(query,doc)
      console.log(result)
      res.send(result)
    })
    // token
    const verifyToken = (req,res,next)=>{
      
      if(!req.headers.authorization)
      {
        return res.status(403).send({message : 'unauthorization'})
      }
      const token = req.headers.authorization.split(' ')[1];
      
      console.log(token);
      jwt.verify(token, process.env.ACCES_TOKEN, function(err, decoded) {
        if(err)
        {
          return res.status(403).send({message : 'unauthorization'})
        }
        req.decoded = decoded
        next()
      });
     
    }
    const verifyAdmin = async(req,res,next)=>{
      const email = req.decoded.email;
      const query = {email:email}
      const users = await userCollection.findOne(query)
      const isAdmin = users?.role=="Admin";
      if(!isAdmin)
      {
        return res.status(403).send({message:"forbiden email"})
      }
      next()
    }

    const verifyHR = async(req,res,next)=>{
      const email = req.decoded.email;
      const query = {email:email}
      const users = await userCollection.findOne(query)
      const isAdmin = users?.role=="HR";
      if(!isAdmin)
      {
        return res.status(403).send({message:"forbiden email"})
      }
      next()
    }
    const verifyEmployee = async(req,res,next)=>{
      const email = req.decoded.email;
      const query = {email:email}
      const users = await userCollection.findOne(query)
      const isAdmin = users?.role=="Employee";
      if(!isAdmin)
      {
        return res.status(403).send({message:"forbiden email"})
      }
      next()
    }
    app.post('/jwt',async(req,res)=>{
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCES_TOKEN,
        { expiresIn: '1h' })
        res.send(token)
    })




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})