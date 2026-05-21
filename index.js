const express = require('express')
const dotenv = require('dotenv')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');
dotenv.config()
const uri = process.env.MONGODB_URI;

const JWKS = createRemoteJWKSet(
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

const logger = (req, res, next) => {
  console.log(`${req.method} | ${req.url}`);

  next();

};

const verifyToken = async (req, res, next) => {
  const { authorization } = req.headers;

  // console.log(req, headers, 'verify Token');

  const token = authorization?.split(" ")[1];

  // console.log(token);

  if (!token) {
    return res.status(401).json({ message: 'Unauthorize' })
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
    return res.status(401).json({ message: 'Unauthorize' })
  }

  next();
};



async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)

    const db = client.db("DriveFleet")
    const carsCollection = db.collection('Cars')
    const bookNowCollection = db.collection('bookNow')

    app.get("/cars", async (req, res) => {
      const { search } = req.query;

      // let cursor;
      // if(search){
      //   cursor = carsCollection.find({title: search});

      // }

      // console.log(cars);
      const result = await carsCollection.find().toArray()
      res.json(result)

    });

    app.get("/featuredCar", async (req, res) => {
      const result = await carsCollection.find().limit(6).toArray()
      res.send(result)
    })



    app.get("/cars/:carsId", async (req, res) => {
      const { carsId } = req.params;
      console.log(carsId);
      const query = { _id: new ObjectId(carsId) }
      const result = await carsCollection.findOne(query);

      res.send(result);
    });

    app.get("/bookNow/:carsId", verifyToken, async (req, res) => {
      // console.log("id", req.params);

      const { carsId } = req.params;
      const result = await bookNowCollection.find({ userId: carsId }).toArray()
      //  console.log("r",result);

      // verifyToken,

      res.send(result);

    })


    app.patch('/bookNow/:carsId', verifyToken, async (req, res) => {
      const { carsId } = req.params;
      const bookNowData = req.body;

      const car = await carsCollection.findOne({ _id: new ObjectId(carsId) })

      if (!car) {
        res.status(404).json({ message: 'Car not found' });
      }

      await carsCollection.updateOne({ _id: new ObjectId(carsId) }, {
        $inc: { bookNowCount: 1 },
        $set: {
          lastBookNow: new Date(),
        },
      });

      //  console.log(bookNowData);



      const result = await bookNowCollection.insertOne({
        ...bookNowData,
        bookNow: new Date()
      });

      res.send(result);

    });





    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send("Server is running fine!")
})



app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})