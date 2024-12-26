require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const port = process.env.PORT || 5000;
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// middleware

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://car-rental-d77a7.web.app",
      "https://car-rental-d77a7.firebaseapp.com",
      "https://vercel.com/jyoti-prokashs-projects",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
// verify token
const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "unauthorized access token" });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access verify" });
    }
    req.user = decoded;
    next();
  });
};

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
    const carBookingCollection = client.db("carREntalDB").collection("booking");
    // all AvailableCars
    app.get("/cars", async (req, res) => {
      const query = req.body;
      const cursor = carRentalCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/myCar", verifyToken, async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) {
        query = { email: email };
      }
      const cursor = carRentalCollection.find(query);
      // verify token
      if (req.user.email !== req.query.email) {
        return res.status(403).send({ message: "forbidden access" });
      }
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
    // delete data from add car
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

    // booking collection .....................

    // creating post add car
    app.post("/booking", async (req, res) => {
      try {
        const bookingCar = req.body;

        // Insert booking into carBookingCollection
        const result = await carBookingCollection.insertOne(bookingCar);

        // bookingCount Update
        const filter = { _id: new ObjectId(bookingCar.bookingId) }; // Use `_id` field
        const update = {
          $inc: { bookingCount: 1 },
        };

        // Update bookingCount in carRentalCollection
        const updateBookingCount = await carRentalCollection.updateOne(
          filter,
          update
        );

        // Combine responses for debugging or confirmation
        const response = {
          bookingResult: result,
          bookingCountUpdate: updateBookingCount,
        };

        res.send(response);
      } catch (error) {
        console.error("Error processing booking:", error);
        res.status(500).send({ error: "Internal Server Error" });
      }
    });

    // get booking
    app.get("/booking", verifyToken, async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) {
        query = { bookingUser: email };
      }
      const cursor = carBookingCollection.find(query);

      if (req.user.email !== req.query.email) {
        return res.status(403).send({ message: "forbidden access" });
      }

      const result = await cursor.toArray();
      res.send(result);
    });

    // delete data from booking
    app.delete("/booking/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await carBookingCollection.deleteOne(query);
      res.send(result);
    });

    //   try {
    //     const id = req.params.id;
    //     const newDate = req.body;

    //     const query = { _id: new ObjectId(id) };
    //     const update = {
    //       $set: {
    //         startDate: booking.startDate,
    //         endDate: booking.endDate,
    //       },
    //     };

    //     const result = await carBookingCollection.updateOne(query, update);

    //     if (result.modifiedCount > 0) {
    //       res.send({ success: true, message: "Car updated successfully." });
    //     } else {
    //       res.send({ success: false, message: "Car update failed." });
    //     }
    //   } catch (error) {
    //     console.error("Error updating car:", error);
    //     res
    //       .status(500)
    //       .send({ success: false, message: "Internal server error." });
    //   }
    // });

    // json web token................
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "2h" });
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      });
      res.send({ success: true });
    });

    // logOut jwt
    app.post("/logout", (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
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
