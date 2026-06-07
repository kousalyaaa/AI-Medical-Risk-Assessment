# Health Guardian AI

## Overview

Health Guardian AI is a full-stack healthcare web application that helps users assess, track, and manage potential health risks using Machine Learning and Generative AI. The platform predicts the risk of Heart Disease, Diabetes, Stroke, and Kidney Disease, provides personalized health recommendations, and simplifies medical data entry through OCR-based report analysis.

## Key Features

### Health Risk Prediction

* Heart Disease Risk Assessment
* Diabetes Risk Assessment
* Stroke Risk Assessment
* Kidney Disease Risk Assessment
* Machine Learning-based prediction models

### OCR-Based Report Analysis

* Upload medical reports in image or PDF format
* Automatic extraction of health parameters such as:

  * Glucose
  * HbA1c
  * Cholesterol
  * Creatinine
* Reduces manual data entry effort

### AI-Powered Health Assistant

* Personalized diet plans
* Lifestyle recommendations
* Health-focused chatbot powered by LLaMA 3.1 via GROQ API

### Health Monitoring

* Assessment history tracking
* Interactive health analytics dashboard
* Progress visualization using charts and graphs

### Additional Features

* Secure JWT Authentication
* Nearby Hospital Locator
* Medication and Health Reminders
* Interactive Body Map

## Technology Stack

### Frontend

* React 18
* TypeScript
* Vite
* Tailwind CSS
* shadcn/ui
* React Router DOM
* TanStack React Query
* React Hook Form
* Zod
* Recharts
* Leaflet
* Framer Motion

### Backend

* Flask (Python)
* MongoDB
* PyMongo
* JWT Authentication
* bcrypt

### AI & Machine Learning

* Scikit-Learn
* Joblib
* GROQ API
* LLaMA 3.1

### OCR Technologies

* Tesseract OCR
* Pillow
* PDF2Image
* PyPDFium2

## System Workflow

1. User enters health data or uploads a medical report.
2. OCR extracts medical parameters from uploaded documents.
3. Machine Learning models analyze health metrics.
4. Risk predictions are generated.
5. AI provides personalized diet and lifestyle recommendations.
6. Results are stored securely in MongoDB.
7. Users can track their health through dashboards and reports.

## Future Enhancements

* Integration with wearable devices
* Multi-day personalized diet planning
* Appointment booking with healthcare providers
* Advanced predictive analytics


