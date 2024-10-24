const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(cors());

const port = process.env.PORT || 5000;

// MongoDB connection URI
const uri = process.env.MONGODB_URI || "mongodb+srv://workmahmudulhasan:1hBnMAl8eszIVMwb@cluster0.lphgiaq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

let client;
let collection;

// Function to connect to the MongoDB database
async function connectToMongoDB() {
    client = new MongoClient(uri);
    try {
        await client.connect();
        console.log('MongoDB connected...');
        const db = client.db('Actual_db'); // Replace with your database name
        collection = db.collection('Fined_Laitu'); // Replace with your collection name

        // Create text index on tags field
        await collection.createIndex({ tags: "text" });

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

app.get("/", (req, res) => {
    res.send("Server is running");
});

// Define the route to handle the GET request
app.get('/search', async (req, res) => {
    const queryTag = req.query.tag;
    if (!queryTag) return res.status(400).send('Query parameter "tag" is required');

    try {
        // Create a regular expression for fuzzy matching
        const fuzzyQuery = new RegExp(queryTag.split('').join('.*'), 'i');
        const results = await collection.find({
            $or: [
                { laituText: { $regex: fuzzyQuery } },
                { engText: { $regex: fuzzyQuery } }
            ]
        }).toArray();
        res.json(results);
    } catch (error) {
        console.error('Error finding documents:', error);
        res.status(500).send('Error fetching data');
    }
});

// Define the route to handle the GET request for all documents
app.get('/getall', async (req, res) => {
    try {
        const results = await collection.find({}).toArray();
        res.json(results);
    } catch (error) {
        console.error('Error finding documents:', error);
        res.status(500).send('Error fetching data');
    }
});
// Start the server and connect to MongoDB
connectToMongoDB().then(() => {
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
        console.log(`http://localhost:${port}`);
        // console.log('MongoDB connection status:', client.isConnected()); // Corrected to client.isConnected()
    });
});

// Periodically check MongoDB connection status
setInterval(() => {
    // console.log('MongoDB connection status:', client.isConnected()); // Corrected to client.isConnected()
}, 60000); // Check every 60 seconds

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Closing MongoDB connection...');
    if (client) {
        await client.close();
    }
    process.exit(0);
});
