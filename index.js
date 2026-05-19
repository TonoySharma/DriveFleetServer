const express = require('express')
const dotenv = require('dotenv')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors')
dotenv.config()
const uri = process.env.MONGODB_URI;

const app = express()
app.use(cors())
app.use(express.json())
const PORT = process.env.PORT;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

   const logger =  (req, res, next)=>{
      console.log(req.params);

      next();
      
  }

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect("DriveFleet");
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });

    const db = client.db("DriveFleet")
    const carsCollection = db.collection('Cars')

    app.get("/cars", async (req, res) => {
        // const cars = await req.body
        // console.log(cars);
        const result = await carsCollection.find().toArray()
        res.json(result)
        
});

  app.get("/featuredCar", async (req, res) => {
    const result = await carsCollection.find().limit(6).toArray()
        res.send(result)
  })



    app.get("/cars/:carsId",
      
      (req, res, next)=>{
      console.log(req.params);

      next();
      
  }, async (req, res) => {
    const {carsId} = req.params;
    console.log(carsId);
    const query = {_id: new ObjectId (carsId)}
    const result = await  carsCollection.findOne(query);

    res.json(result);
});


    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) =>{
    res.send("Server is running fine!")
})



app.listen(PORT, ()=>{
    console.log(`Server running on port ${PORT}`)
})