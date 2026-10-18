require('dotenv').config();
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const User = require('../models/User');
const Product = require('../models/Product');
const Feedback = require('../models/Feedback');
const BehaviorEvent = require('../models/BehaviorEvent');
const AIInsight = require('../models/AIInsight');
const { fallbackSentiment } = require('../services/aiService');

const NUM_CUSTOMERS = 40;
const NUM_PRODUCTS = 20;
const NUM_FEEDBACK = 150;
const NUM_BEHAVIOR = 300;

// Hardcoded realistic feedback phrases to trick the keyword analyzer easily
const positivePhrases = [
  "This is a great product, I love it!",
  "Excellent customer service and fast delivery.",
  "Amazing quality for the price.",
  "Perfect experience, highly recommend.",
  "Really good design and nice feel to it.",
  "Awesome, arrived early and works perfect."
];

const negativePhrases = [
  "Terrible customer service, very slow.",
  "Bad quality, broke after one use.",
  "Too expensive for what you get.",
  "Poor packaging, arrived damaged.",
  "Worst experience ever, I hate it.",
  "Awful, would not recommend this to anyone."
];

const neutralPhrases = [
  "It is okay, gets the job done.",
  "Standard product, nothing special.",
  "Arrived on time, works as expected.",
  "Average quality, could be better.",
  "Fine for the price point."
];

const categories = ["Product Quality", "Price", "Delivery", "Customer Service", "Website Experience", "Other"];

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for Seeding...');

    // 1. Clear existing data (Keep Admins if any, but let's just clear all customers)
    console.log('Clearing old data...');
    await User.deleteMany({ role: 'customer' });
    await Product.deleteMany();
    await Feedback.deleteMany();
    await BehaviorEvent.deleteMany();
    await AIInsight.deleteMany();

    // 2. Create Users
    console.log(`Generating ${NUM_CUSTOMERS} customers...`);
    const users = [];
    for (let i = 0; i < NUM_CUSTOMERS; i++) {
      users.push({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'password123', // Will be hashed by pre-save hook
        role: 'customer'
      });
    }
    const createdUsers = await User.create(users);

    // Curated high quality product catalog with exact matching names, categories, and images
    const curatedProductsList = [
      {
        name: "Samsung Galaxy S24 Ultra",
        category: "Mobile",
        description: "Flagship smartphone with a vivid AMOLED display, advanced cameras, and fast performance.",
        price: 389999,
        image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
        rating: 4.3
      },
      {
        name: "iPhone 15 Pro Max",
        category: "Mobile",
        description: "Premium Apple smartphone with a large display, powerful processor, and pro camera system.",
        price: 449999,
        image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=800&q=80",
        rating: 4.4
      },
      {
        name: "iPhone 15",
        category: "Mobile",
        description: "A sleek Apple smartphone with a bright display, excellent cameras, and all-day performance.",
        price: 329999,
        image: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80",
        rating: 4.5
      },
      {
        name: "Samsung Galaxy A55",
        category: "Mobile",
        description: "Reliable mid-range phone with a Super AMOLED screen and long-lasting battery.",
        price: 139999,
        image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80",
        rating: 4.6
      },
      {
        name: "Google Pixel 8 Pro",
        category: "Mobile",
        description: "Smartphone with intelligent photography tools, clean software, and a premium display.",
        price: 279999,
        image: "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?auto=format&fit=crop&w=800&q=80",
        rating: 4.7
      },
      {
        name: "Xiaomi Redmi Note 13 Pro",
        category: "Mobile",
        description: "Feature-packed phone with a high-resolution camera and fast-charging battery.",
        price: 89999,
        image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80",
        rating: 4.8
      },
      {
        name: "OnePlus 12",
        category: "Mobile",
        description: "High-performance smartphone with a smooth display and rapid charging.",
        price: 259999,
        image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80",
        rating: 4.9
      },
      {
        name: "Oppo Reno 11 F",
        category: "Mobile",
        description: "Slim smartphone with a vibrant screen, stylish finish, and capable camera.",
        price: 99999,
        image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
        rating: 4.3
      },
      {
        name: "Vivo V30",
        category: "Mobile",
        description: "Modern smartphone with portrait photography features and a bright AMOLED display.",
        price: 129999,
        image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=800&q=80",
        rating: 4.4
      },
      {
        name: "Infinix Note 40 Pro",
        category: "Mobile",
        description: "Affordable performance phone with a large screen and fast charging.",
        price: 74999,
        image: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80",
        rating: 4.5
      },
      {
        name: "Tecno Camon 30",
        category: "Mobile",
        description: "Camera-focused smartphone with a crisp display and generous storage.",
        price: 69999,
        image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80",
        rating: 4.6
      },
      {
        name: "Realme 12 Pro+",
        category: "Mobile",
        description: "Versatile smartphone with zoom camera capabilities and a premium design.",
        price: 124999,
        image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
        rating: 4.7
      },
      {
        name: "Samsung Galaxy Z Flip5",
        category: "Mobile",
        description: "Compact foldable smartphone with a flexible main display and cover screen.",
        price: 299999,
        image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=800&q=80",
        rating: 4.8
      },
      {
        name: "iPhone 13",
        category: "Mobile",
        description: "Popular Apple smartphone with dependable performance and dual-camera system.",
        price: 179999,
        image: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80",
        rating: 4.9
      },
      {
        name: "Poco X6 Pro",
        category: "Mobile",
        description: "Performance-oriented smartphone for gaming, multitasking, and everyday use.",
        price: 109999,
        image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80",
        rating: 4.3
      },
      {
        name: "Dell Inspiron 15",
        category: "Laptop",
        description: "Everyday laptop for study, office tasks, video calls, and multitasking.",
        price: 169999,
        image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
        rating: 4.4
      },
      {
        name: "HP Pavilion 15",
        category: "Laptop",
        description: "Versatile laptop with a comfortable keyboard, clear display, and capable performance.",
        price: 189999,
        image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
        rating: 4.5
      },
      {
        name: "Lenovo IdeaPad Slim 3",
        category: "Laptop",
        description: "Lightweight laptop for students, productivity, browsing, and entertainment.",
        price: 139999,
        image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
        rating: 4.6
      },
      {
        name: "Apple MacBook Air M2",
        category: "Laptop",
        description: "Thin and light laptop with Apple silicon, silent operation, and long battery life.",
        price: 289999,
        image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
        rating: 4.7
      },
      {
        name: "ASUS TUF Gaming F15",
        category: "Laptop",
        description: "Gaming laptop designed for demanding games, creative work, and multitasking.",
        price: 259999,
        image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
        rating: 4.8
      }
    ];

    // 3. Create Products
    console.log(`Creating ${curatedProductsList.length} realistic curated products...`);
    const createdProducts = await Product.create(curatedProductsList);

    // 4. Create Feedback
    console.log(`Generating ${NUM_FEEDBACK} feedback records using fallback sentiment...`);
    const feedbacks = [];
    for (let i = 0; i < NUM_FEEDBACK; i++) {
      const isPos = Math.random() > 0.4; // 60% positive
      const isNeg = !isPos && Math.random() > 0.5; // 20% negative, 20% neutral
      
      let commentPool = neutralPhrases;
      let rating = 3;
      if (isPos) {
        commentPool = positivePhrases;
        rating = faker.number.int({ min: 4, max: 5 });
      } else if (isNeg) {
        commentPool = negativePhrases;
        rating = faker.number.int({ min: 1, max: 2 });
      }

      const comment = faker.helpers.arrayElement(commentPool);
      const analysis = fallbackSentiment(comment); // Bypass AI API to save limits

      const pastDate = faker.date.recent({ days: 30 }); // Past 30 days

      feedbacks.push({
        userId: faker.helpers.arrayElement(createdUsers)._id,
        productId: faker.helpers.arrayElement(createdProducts)._id,
        rating,
        comment,
        category: faker.helpers.arrayElement(categories),
        sentiment: analysis.sentiment,
        sentimentScore: analysis.sentimentScore,
        confidence: analysis.confidence,
        createdAt: pastDate
      });
    }
    await Feedback.insertMany(feedbacks);

    // 5. Create Behavior Events
    console.log(`Generating ${NUM_BEHAVIOR} behavior tracking events...`);
    const events = [];
    const eventTypes = ['page_view', 'product_view', 'add_to_cart'];
    
    for (let i = 0; i < NUM_BEHAVIOR; i++) {
      const type = faker.helpers.arrayElement(eventTypes);
      const user = faker.helpers.arrayElement(createdUsers);
      const product = faker.helpers.arrayElement(createdProducts);
      const pastDate = faker.date.recent({ days: 15 });

      let metadata = {};
      let page = '/';
      let productId = null;

      if (type === 'page_view') {
        page = faker.helpers.arrayElement(['/', '/products', '/about', '/contact']);
        metadata = { path: page, referrer: 'Google' };
      } else if (type === 'product_view') {
        page = `/products/${product._id}`;
        productId = product._id;
        metadata = { path: page, productName: product.name };
      } else if (type === 'add_to_cart') {
        page = `/products/${product._id}`;
        productId = product._id;
        metadata = { productId: product._id };
      } else if (type === 'search') {
        page = '/products';
        metadata = { query: faker.commerce.productAdjective() };
      }

      events.push({
        userId: user._id,
        sessionId: faker.string.uuid(),
        eventType: type,
        page,
        productId,
        duration: faker.number.int({ min: 5, max: 120 }),
        metadata,
        timestamp: pastDate
      });
    }
    await BehaviorEvent.insertMany(events);

    console.log('🎉 Data Seeding Complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

seedData();
