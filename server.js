const express = require('express');
const path = require('path');
const { MongoClient } = require('mongodb');

// Initialize Express app
const app = express();

// Serve static images from the "images" folder
app.use('/images', express.static(path.join(__dirname, 'images')));

// MongoDB connection URI
const uri = 'mongodb+srv://ce509:zn60iIQGQCibasri@cluster0.zhq0t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';  
const client = new MongoClient(uri);

// Function to connect to MongoDB
async function connectDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
}
