1. Project Overview
Health Guardian AI is a comprehensive, full-stack web application designed to help users assess, track, and manage their health risks. It leverages traditional machine learning models for risk prediction (Heart Disease, Diabetes, Stroke, and Kidney Disease) and integrates modern Generative AI (via the GROQ API and LLaMA 3.1) to provide personalized diet plans, lifestyle recommendations, and interactive AI chat functionalities. The application also simplifies data entry by allowing users to upload medical reports and lab results, utilizing OCR (Optical Character Recognition) to automatically parse critical health metrics.

2. Technology Stack
Frontend (Client-Side)
The frontend is built for high performance, type safety, and a modern, responsive user experience.

Core Framework: React 18, Vite, TypeScript
Styling & UI Components: Tailwind CSS, shadcn-ui, Radix UI (for accessible primitive components)
Routing: React Router DOM
State Management & Data Fetching: TanStack React Query
Forms & Validation: React Hook Form, Zod
Data Visualization: Recharts (for health trends and analytics)
Maps Integration: Leaflet & React-Leaflet (for locating nearby hospitals)
Animations: Framer Motion
Mobile/Cross-Platform: Capacitor (configured for Android build capabilities)
Backend (Server-Side)
The backend is a robust Python-based REST API designed to handle machine learning inference, secure authentication, and external API integrations.

Core Framework: Flask (Python)
Database: MongoDB (via PyMongo)
Authentication: Flask-JWT-Extended, bcrypt (for password hashing)
Machine Learning: scikit-learn, joblib (for loading pre-trained risk assessment models)
AI Integration: GROQ API (LLaMA 3.1 8B) for generating dynamic text content (Diet, Lifestyle, Chat)
OCR Processing: pytesseract (Tesseract OCR), Pillow, pdf2image/pypdfium2 (for extracting data from PDFs and images)
3. Core Features & Functionalities
1. User Authentication & Security
Secure user registration and login using encrypted passwords (bcrypt).
Protected routes and API endpoints using JSON Web Tokens (JWT).
2. Predictive Health Risk Assessments
Users can input specific health metrics (e.g., blood pressure, glucose, BMI, age) to evaluate their risk for various diseases.
Supported assessments include:
Heart Disease
Diabetes
Stroke
Kidney Disease
Uses trained Machine Learning models in the backend to calculate risk levels based on the input data.
3. OCR Lab Report Parsing
Users can upload images or PDF documents of their lab results.
The backend uses Tesseract OCR to read the document and rule-based parsing to automatically extract key medical parameters (e.g., Glucose, HbA1c, Cholesterol, Creatinine).
This eliminates manual data entry errors and streamlines the assessment process.
4. AI-Powered Personalization (Powered by GROQ/LLaMA)
Diet Plans: Automatically generates a customized 1-day diet plan (Breakfast, Lunch, Dinner, Snacks, Tips) based on the user's specific risk level and assessment type.
Lifestyle Analysis: Provides tailored recommendations for exercise routines, sleep hygiene, stress management, and daily habits based on the user's health profile.
AI Health Assistant: An integrated chat interface allowing users to ask health-related questions and get AI-generated guidance.
5. Health Tracking & Trends
History: Users can view a complete log of all their past assessments and AI plans.
Trends Dashboard: Visualizes health data over time using Recharts, allowing users to track progress in metrics like blood pressure, BMI, and glucose levels.
6. Interactive Health Tools
Body Map: An interactive visual component mapping symptoms or health focus areas to the human body.
Nearby Hospitals: Integrates interactive maps (Leaflet) to help users find and navigate to nearby healthcare facilities and hospitals.
Reminders: A built-in system to help users keep track of medications, upcoming tests, or daily health habits.
4. Architecture & Workflow
Data Input: The user either manually enters data via responsive forms or uploads a lab report (which is parsed via the OCR backend).
Validation: Frontend (Zod) and backend validation ensure the medical metrics fall within realistic physiological bounds.
Processing: The Flask backend runs the data through pre-trained scikit-learn models to output a risk level.
Enrichment: Based on the risk level, the backend queries the GROQ API to generate a personalized diet and lifestyle regimen.
Storage: All data (assessments, plans, user profiles) is securely stored in MongoDB.
Visualization: The React frontend retrieves this data to render interactive dashboards, charts, and readable reports for the user.
