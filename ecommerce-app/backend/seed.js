const mongoose = require('mongoose');
const Product = require('./models/Product');

const mongoURI = 'mongodb+srv://portfolio:pass123@cluster0.llhw7bh.mongodb.net/ecommerce?retryWrites=true&w=majority&appName=Cluster0';

const sampleProducts = [
  {
    title: 'Wireless Noise-Canceling Headphones',
    price: 99.99,
    description: 'High-fidelity audio with active noise cancellation and 30-hour battery life.',
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
    stock: 15,
  },
  {
    title: 'Mechanical Gaming Keyboard',
    price: 79.50,
    description: 'RGB backlit mechanical keyboard with tactile switches.',
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=500&q=80',
    stock: 20,
  },
  {
    title: 'Minimalist Leather Backpack',
    price: 49.99,
    description: 'Durable, water-resistant daily pack suitable for laptops up to 15 inches.',
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80',
    stock: 10,
  },
];

const seedData = async () => {
  try {
    await mongoose.connect(mongoURI);
    await Product.deleteMany();
    await Product.insertMany(sampleProducts);
    console.log('Sample products seeded successfully');
    process.exit();
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();