import mongoose from 'mongoose';

import {config} from './src/config.js';

  mongoose.connect(config.db.URI);

const db = mongoose.connection;

db.once('open', () => {
  console.log('Database connected:');
});

db.on('error', err => {
  console.error('connection error:', err);
});

db.on('disconnected', () => {
  console.log('Database disconnected');
});