// MongoDB initialization script
db = db.getSiblingDB('compliance_db');

// Create collections if they don't exist
db.createCollection('users');
db.createCollection('questions');
db.createCollection('companies');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.questions.createIndex({ "category": 1 });
db.questions.createIndex({ "difficulty": 1 });

print('Database initialized successfully!');
