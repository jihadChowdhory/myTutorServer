const express = require("express");
const MongoClient = require("mongodb").MongoClient;
const bodyParser = require("body-parser");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const fs = require("fs-extra");
var ObjectId = require("mongodb").ObjectID;
require("dotenv").config;
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("reviewProfiles"));
app.use(fileUpload());
const port = 5000;

const uri =
  "mongodb+srv://jihadchowdhory:W9aKBjRENWOLYwG5@cluster0.8fqqs.mongodb.net/myTutor?retryWrites=true&w=majority";

/////////////////////////////////// Creating a Get API /////////////////////////////////////
app.get("/", (req, res) => {
  res.send("I'm Working :D");
});

////////////////////// Connecting to the Database /////////////////////////
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const orderCollection = client.db("myTutor").collection("order");
  const reviewCollection = client.db("myTutor").collection("review");
  const adminCollection = client.db("myTutor").collection("admin");
  const courseCollection = client.db("myTutor").collection("course");

  ///////////////////// Saving Order in Database ////////////////////////
  app.post("/addOrder", (req, res) => {
    const orderDetails = req.body;
    orderDetails.status = "Pending";
    orderCollection.insertOne(orderDetails).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

  /////////////////////////// Finding Orders by email ///////////////////////////////
  app.post("/enrolledCourses", (req, res) => {
    const userEmail = req.body.email;
    orderCollection.find({ email: userEmail }).toArray((err, docs) => {
      res.send(docs);
    });
  });

  ///////////////////////////////// Saving Review in Database ///////////////
  app.post("/addReview", (req, res) => {
    const file = req.files.file;
    const name = req.body.name;
    const jobTitle = req.body.jobTitle;
    const company = req.body.company;
    const message = req.body.message;
    const filePath = `${__dirname}/reviewProfiles/${file.name}`;
    file.mv(filePath, (err) => {
      if (err) {
        res.send(err);
      }
      const newImg = fs.readFileSync(filePath);
      const encImg = newImg.toString("base64");
      const img = {
        contentType: req.files.file.mimetype,
        size: req.files.file.size,
        img: Buffer.from(encImg, "base64"),
      };
      reviewCollection
        .insertOne({ name, jobTitle, company, message, img })
        .then((result) => {
          fs.remove(filePath, (error) => console.log(error));
          res.send(result.insertedCount > 0);
        });
    });
  });

  /////////////////////////// Load Review /////////////////////////////
  app.get("/reviews", (req, res) => {
    reviewCollection.find({}).toArray((err, docs) => {
      res.send(docs);
    });
  });

  /////////////////////// Load Orders /////////////////////////
  app.get("/orders", (req, res) => {
    orderCollection.find({}).toArray((err, docs) => {
      res.send(docs);
    });
  });

  ////////////////////// Updating Status or Order /////////////////////////
  app.patch("/updateStatus", (req, res) => {
    const id = req.body.orderId;
    const courseStatus = req.body.orderStatus;
    orderCollection
      .updateOne(
        { _id: ObjectId(id) },
        {
          $set: { status: courseStatus },
        }
      )
      .then((result) => res.send(result));
  });

  /////////////////////////////////// Adding New Admin ///////////////////////////////////
  app.post("/addAdmin", (req, res) => {
    const email = req.body.email;
    adminCollection.insertOne({ email }).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

  //////////////////////////// Checking Email to differtiate /////////////////////////////
  app.post("/checkEmail", (req, res) => {
    const userEmail = req.body.email;
    adminCollection.find({ email: userEmail }).toArray((err, docs) => {
      res.send(docs);
    });
  });
  ///////////////////////////////// Saving Course in Database ///////////////
  app.post("/addCourse", (req, res) => {
    const file = req.files.file;
    const courseName = req.body.courseName;
    const instructor = req.body.courseInstructor;
    const price = req.body.coursePrice;
    const filePath = `${__dirname}/courseImages/${file.name}`;
    file.mv(filePath, (err) => {
      if (err) {
        res.send(err);
      }
      const newImg = fs.readFileSync(filePath);
      const encImg = newImg.toString("base64");
      const img = {
        contentType: req.files.file.mimetype,
        size: req.files.file.size,
        img: Buffer.from(encImg, "base64"),
      };
      courseCollection
        .insertOne({ courseName, instructor, price, img })
        .then((result) => {
          fs.remove(filePath, (error) => console.log(error));
          res.send(result.insertedCount > 0);
        });
    });
  });

  /////////////////////// Load Courses /////////////////////////
  app.get("/courses", (req, res) => {
    courseCollection.find({}).toArray((err, docs) => {
      res.send(docs);
    });
  });

  /////////////////////// Load Courses /////////////////////////
  app.get("/allCourses", (req, res) => {
    courseCollection.find({}).toArray((err, docs) => {
      res.send(docs);
    });
  });

  /////////////////////// Delete Course ///////////////////////
  app.delete("/deleteCourse", (req, res) => {
    const id = req.body.courseId;
    courseCollection.deleteOne({ _id: ObjectId(id) }).then((result) => {
      res.send(result.deletedCount > 0);
    });
  });
});

/////////////////////////////// Running the server on a Port ///////////////////////////////////
app.listen(process.env.PORT || port);
