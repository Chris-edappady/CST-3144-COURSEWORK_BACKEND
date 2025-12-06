const express = require('express');
const path = require('path');
const { MongoClient } = require('mongodb');

// Initialize Express app
const app = express();
app.use(express.json());

// Enable CORS for all requests
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Accept, X-Requested-With, Access-Control-Request-Method, Access-Control-Request-Headers'
  );
  next();
});

// Serve static images from the "images" folder
app.use('/images', express.static(path.join(__dirname, 'images')));

// MongoDB connection URI
const uri = 'mongodb+srv://ce509:zn60iIQGQCibasri@cluster0.zhq0t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';  
const client = new MongoClient(uri);

let db;

// Connect to MongoDB once at startup
client
  .connect()
  .then(() => {
    db = client.db('webstore');
    console.log('Connected to MongoDB');
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// Endpoint to get the lessons 
app.get('/api/lessons', async (req, res) => {
  try {  
    const lessons = await db.collection('lessons').find({}).toArray();
    res.json(lessons);
  } catch (err) {
    console.error('Error fetching lessons:', err);
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

