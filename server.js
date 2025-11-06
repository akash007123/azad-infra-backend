const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Contact Schema
const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, default: '' },
  service: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['new', 'in-progress', 'resolved'], default: 'new' },
  createdAt: { type: Date, default: Date.now }
});

const Contact = mongoose.model('Contact', contactSchema);

// Middleware
app.use(bodyParser.json());

// CORS middleware (allowing specific origins for credentials)
app.use((req, res, next) => {
  const allowedOrigins = ['http://localhost:8080', 'http://localhost:3000']; // Add your frontend URLs
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Contact form submission endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, service, message } = req.body;

    // Basic validation
    if (!name || !email || !service || !message) {
      return res.status(400).json({ message: 'All required fields must be filled.' });
    }

    // Create new contact
    const newContact = new Contact({
      name,
      email,
      phone: phone || '',
      service,
      message,
      status: 'new'
    });

    await newContact.save();

    console.log('Contact form submission:', newContact);

    res.status(200).json({ message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Error saving contact:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all contacts
app.get('/api/contact', async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json({ data: contacts });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update contact
app.put('/api/contact/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, service, message } = req.body;

    const updatedContact = await Contact.findByIdAndUpdate(
      id,
      { name, email, phone, service, message },
      { new: true, runValidators: true }
    );

    if (!updatedContact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    res.json({ message: 'Contact updated successfully' });
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update contact status
app.patch('/api/contact/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['new', 'in-progress', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const updatedContact = await Contact.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedContact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    res.json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error updating contact status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete contact
app.delete('/api/contact/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedContact = await Contact.findByIdAndDelete(id);

    if (!deletedContact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});