const express = require('express')
const dotenv = require('dotenv')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');
dotenv.config()
const uri = process.env.MONGODB_URI;

const JWKS =  createRemoteJWKSet(
      new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
    )
    // console.log(JWKS);
    

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
      console.log(`${req.method} | $(req.url)`);

      next();
      
  };

const verifyToken = async (req, res, next) =>{
  const { authorization} = req.headers;

  // console.log(req, headers, 'verify Token');

  const token = authorization?.split(" ") [1];

  // console.log(token);

  if(!token){
    return res.status(401).json({massage: 'Unauthorize'})
  }

    try {
    const JWKS = createRemoteJWKSet(
      new URL('http://localhost:3000/api/auth/jwks')
    )
    const { payload } = await jwtVerify(token, JWKS,) 
    req.user = payload;
    // console.log(payload);


    
  } catch (error) {
    console.error('Token validation failed:', error)
    return res.status(401).json({massage: 'Unauthorize'})
  }



     next();
};



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



    app.get("/cars/:carsId",logger, verifyToken, async (req, res) => {
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