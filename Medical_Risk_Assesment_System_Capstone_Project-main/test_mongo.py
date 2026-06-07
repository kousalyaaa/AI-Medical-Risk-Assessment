from pymongo import MongoClient
import os

MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')

try:
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    print("MongoDB is running and connected!")
    db = client['health_risk_db']
    print(f"Database: {db.name}")
except Exception as e:
    print(f"MongoDB connection failed: {e}")
