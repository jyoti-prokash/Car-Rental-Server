require("dotenv").config();
const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// middleware

app.use(cors());
app.use(express.json());

// mongodb

const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ti2zy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const carRentalCollection = client.db("carREntalDB").collection("cars");
    // all AvailableCars
    app.get("/cars", async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) {
        query = { adder_email: email };
      }
      const cursor = carRentalCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    // get cars details by id
    app.get("/cars/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await carRentalCollection.findOne(query);
      res.send(result);
    });
    // creating post add car
    app.post("/cars", async (req, res) => {
      const newCar = req.body;
      const result = await carRentalCollection.insertOne(newCar);
      res.send(result);
    });
    // delete data
    app.delete("/cars/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await carRentalCollection.deleteOne(query);
      res.send(result);
    });

    // recent posted car
    app.get("/recent-cars", async (req, res) => {
      const cars = carRentalCollection.find().sort({ Date: "-1" }).limit(6);
      const result = await cars.toArray();
      res.send(result);
    });

    // update data
    app.patch("/update/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const newCar = req.body;

        const query = { _id: new ObjectId(id) };
        const update = {
          $set: {
            photo: newCar.photo,
            carModel: newCar.carModel,
            dailyRentalPrice: newCar.dailyRentalPrice,
            description: newCar.description,
            availability: newCar.availability,
            registrationNumber: newCar.registrationNumber,
            features: newCar.features,
            location: newCar.location,
          },
        };

        const result = await carRentalCollection.updateOne(query, update);

        if (result.modifiedCount > 0) {
          res.send({ success: true, message: "Car updated successfully." });
        } else {
          res.send({ success: false, message: "Car update failed." });
        }
      } catch (error) {
        console.error("Error updating car:", error);
        res
          .status(500)
          .send({ success: false, message: "Internal server error." });
      }
    });
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);











app.get("/", (req, res) => {
  res.send("car rental server is running");
});
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
