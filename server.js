const express = require('express');
const path = require('path');
const { MongoClient } = require('mongodb');

//Initialize Express app
const app = express();
app.use(express.json());

// --- Middleware: log date & time for every request ---
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.url}`);
  next();
});

//Enable CORS for all requests
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
client.connect()
  .then(() => {
    db = client.db('webstore');
    console.log('Connected to MongoDB');
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// Endpoint to get the lessons 
app.get('/lessons', async (req, res) => {
  try {  
    const lessons = await db.collection('lessons').find({}).toArray();
    res.json(lessons);
  } catch (err) {
    console.error('Error fetching lessons:', err);
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

//Accepts order object and saves it to 'orders' collection
app.post('/orders', async (req, res) => {
  try {
    const { name, phone, cart } = req.body || {};
    if (!name || !phone || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: 'Invalid order data' });
    }

    // Count quantity per lesson ID
    const quantities = {};
    cart.forEach(id => {
      quantities[id] = (quantities[id] || 0) + 1;
    });

    const items = [];
    let totalPrice = 0;
    
    // For each lesson in cart
    for (const lessonId of Object.keys(quantities)) {
      const lesson = await db.collection('lessons').findOne({ id: Number(lessonId) });
      if (!lesson) continue;

      const qty = quantities[lessonId];

      // Deduct spaces in MongoDB
      const remaining = Math.max(0, lesson.spaces - qty);
      await db.collection('lessons').updateOne(
        { id: Number(lessonId) },
        { $set: { spaces: remaining } }
      );

      // Prepare order item
      items.push({
        lessonId: lessonId,
        name: lesson.subject,
        price: lesson.price,
        quantity: qty
      });
      totalPrice += lesson.price * qty;
    }
    // Save order
    const orderDoc = {
      name,
      phone,
      items,
      totalPrice,
      date: new Date()
    };

    const result = await db.collection('orders').insertOne(orderDoc);

    res.status(201).json({ success: true, orderId: result.insertedId });
  } catch (err) {
    console.error('Error saving order:', err);
    res.status(500).json({ error: 'Failed to save order' });
  }
});

//Updates the lesson attributes
app.put('/lessons/:id', async (req, res) => {
  try {
    const lessonId = Number(req.params.id);
    if (Number.isNaN(lessonId)) return res.status(400).json({ error: 'Invalid lesson id' });

    const update = req.body || {};
    const result = await db.collection('lessons').updateOne(
      { id: lessonId },        
      { $set: update }
    );

    res.json({ success: result.matchedCount > 0 });
  } catch (err) {
    console.error('Error updating lesson:', err);
    res.status(500).json({ error: 'Failed to update lesson' });
  }
});

//Does a server-side search across subject/location/price/spaces.
app.get('/search', async (req, res) => {
  try {
    const q = (req.query.query || '').trim();
    if (!q) return res.json([]);  
    const re = new RegExp(q, 'i');
    const results = await db.collection('lessons').find({
      $or: [
        { subject: re },
        { location: re },
        { price: re },   
        { spaces: re }
      ]
    }).toArray();
    res.json(results);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

//Confirms whether the server is running
app.get('/', (req, res) => res.send('Server running. Use /lessons, /orders, /search'));

//Starts the server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));

