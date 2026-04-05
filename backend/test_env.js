console.log('Test logic execution');
try {
  require('dotenv').config();
  console.log('Dotenv loaded');
  const express = require('express');
  console.log('Express found');
  const mongoose = require('mongoose');
  console.log('Mongoose found');
  // test mongodb-memory-server
  require('mongodb-memory-server');
  console.log('MongoMemoryServer found');
} catch (e) {
  console.error('Error in test:', e.message);
}
