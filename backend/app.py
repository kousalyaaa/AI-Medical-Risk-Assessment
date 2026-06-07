from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime, timedelta
import os
import requests
import bcrypt
import joblib
from dotenv import load_dotenv
import tempfile
import re

# Optional OCR libs - import if available
OCR_AVAILABLE = False
try:
    import pytesseract
    # Explicit tesseract binary path for Windows
    pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    from PIL import Image
    # Try to import both PDF libraries
    try:
        from pdf2image import convert_from_path
        PDF2IMAGE_AVAILABLE = True
    except ImportError:
        PDF2IMAGE_AVAILABLE = False

    try:
        import pypdfium2 as pdfium
        PYPDIFIUM_AVAILABLE = True
    except ImportError:
        PYPDIFIUM_AVAILABLE = False

    if not PDF2IMAGE_AVAILABLE and not PYPDIFIUM_AVAILABLE:
        raise ImportError("Neither pdf2image nor pypdfium2 is available")

    OCR_AVAILABLE = True
except Exception:
    # OCR libraries not installed or Tesseract binary missing
    OCR_AVAILABLE = False

# Load environment variables
load_dotenv()
# Also load .env.poppler for POPPLER_PATH specifically
load_dotenv(dotenv_path='.env.poppler')

app = Flask(__name__)

# Configuration
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key')
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')

# Initialize CORS and JWT
CORS(app)
jwt = JWTManager(app)

# MongoDB connection
try:
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    db = client['health_risk_db']
except:
    db = None

def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable format"""
    if doc is None:
        return None
    doc['id'] = str(doc.pop('_id', ''))
    return doc


def run_ocr_on_file(filepath: str):
    """Run OCR on an image or PDF and return extracted text."""
    if not OCR_AVAILABLE:
        return None, 'ocr_unavailable'

    texts = []
    try:
        if filepath.lower().endswith('.pdf'):
            # Prefer pdf2image (requires Poppler). If not available, try pypdfium2.
            if 'PDF2IMAGE_AVAILABLE' in globals() and PDF2IMAGE_AVAILABLE:
                try:
                    poppler_path = os.getenv('POPPLER_PATH') or None
                    # Debug prints for poppler troubleshooting
                    print(f"[OCR:pdf] using poppler_path={poppler_path}")
                    if poppler_path:
                        pp = os.path.join(poppler_path, 'pdftoppm.exe')
                        print(f"[OCR:pdf] pdftoppm exists: {os.path.exists(pp)} -> {pp}")
                    print(f"[OCR:pdf] input filepath exists: {os.path.exists(filepath)} -> {filepath}")
                    if poppler_path:
                        pages = convert_from_path(filepath, dpi=300, poppler_path=poppler_path)
                    else:
                        pages = convert_from_path(filepath, dpi=300)
                    for page in pages:
                        texts.append(pytesseract.image_to_string(page))
                except Exception as e:
                    import traceback
                    print('[OCR:pdf] convert_from_path exception:', str(e))
                    print(traceback.format_exc())
                    return None, f"poppler_error: {str(e)}"
            elif 'PYPDIFIUM_AVAILABLE' in globals() and PYPDIFIUM_AVAILABLE:
                try:
                    # Render PDF pages to images using pypdfium2
                    pdf = pdfium.PdfDocument(filepath)
                    for page_no in range(len(pdf)):
                        pil_image = pdf.get_page_image(page_no).as_pil()
                        texts.append(pytesseract.image_to_string(pil_image))
                except Exception as e:
                    return None, f"pdfium_error: {str(e)}"
            else:
                return None, 'pdf_not_supported'
        else:
            img = Image.open(filepath)
            texts.append(pytesseract.image_to_string(img))

        full_text = "\n".join(t for t in texts if t)
        return full_text, None
    except Exception as e:
        return None, str(e)


def parse_lab_results(text: str):
    """Basic rule-based parser to extract common lab values from OCR text.
    Returns dict of detected tests with numeric values and units where possible.
    """
    if not text:
        return {}

    # normalize
    t = text.lower()

    patterns = {
        'glucose': r'glucose[:\s]*([0-9]+\.?[0-9]*)\s*(mg/dl|mmol/l)?',
        'hba1c': r'hb[ -]?a1c[:\s]*([0-9]+\.?[0-9]*)\s*%?',
        'cholesterol': r'total cholesterol[:\s]*([0-9]+\.?[0-9]*)\s*(mg/dl)?',
        'hdl': r'hdl[:\s]*([0-9]+\.?[0-9]*)',
        'ldl': r'ldl[:\s]*([0-9]+\.?[0-9]*)',
        'triglycerides': r'triglycerid(?:es)?[:\s]*([0-9]+\.?[0-9]*)',
        'creatinine': r'creatinine[:\s]*([0-9]+\.?[0-9]*)',
        'urea': r'blood urea[:\s]*([0-9]+\.?[0-9]*)',
        'sodium': r'sodium[:\s]*([0-9]+\.?[0-9]*)',
        'potassium': r'potassium[:\s]*([0-9]+\.?[0-9]*)',
        'hemoglobin': r'hemoglobin[:\s]*([0-9]+\.?[0-9]*)',
        'wbc': r'white blood cell[:\s]*([0-9]+\.?[0-9]*)|wbc[:\s]*([0-9]+\.?[0-9]*)',
        'rbc': r'red blood cell[:\s]*([0-9]+\.?[0-9]*)|rbc[:\s]*([0-9]+\.?[0-9]*)',
        'bmi': r'bmi[:\s]*([0-9]+\.?[0-9]*)',
    }

    results = {}
    for key, pat in patterns.items():
        m = re.search(pat, t)
        if m:
            # find first numeric group
            for group in m.groups():
                if group is None:
                    continue
                # strip units if present
                num = re.search(r'([0-9]+\.?[0-9]*)', group)
                if num:
                    results[key] = num.group(1)
                    break

    # Fallback: try to find any number followed by mg/dl or %
    if not results:
        fallback = re.findall(r'([0-9]+\.?[0-9]*)\s*(mg/dl|mmol/l|%)', t)
        if fallback:
            results['fallback_samples'] = [f"{v[0]} {v[1]}" for v in fallback[:6]]

    return results


@app.route('/api/ocr/parse', methods=['POST'])
def ocr_parse():
    """Accepts a multipart file upload (field name 'file') and returns OCR text and parsed lab values."""
    print("[DEBUG] OCR request received")
    print(f"[DEBUG] Headers: {dict(request.headers)}")
    print(f"[DEBUG] Files: {list(request.files.keys())}")
    print(f"[DEBUG] Form data: {list(request.form.keys())}")
    print(f"[DEBUG] Method: {request.method}")
    print(f"[DEBUG] URL: {request.url}")
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    filename = file.filename or 'upload'
    suffix = os.path.splitext(filename)[1].lower() or '.png'

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp_path = tmp.name
        file.save(tmp_path)
    # Diagnostic logging to help debug frontend "OCR failed" issues
    print(f"[OCR] Received file: {filename}, saved to: {tmp_path}")
    print(f"[OCR] OCR_AVAILABLE={OCR_AVAILABLE}")

    try:
        ocr_text, err = run_ocr_on_file(tmp_path)
        if err == 'ocr_unavailable':
            print('[OCR] OCR unavailable: required libs or tesseract binary missing')
            return jsonify({'error': 'OCR not available on server. Install pytesseract, Pillow and pdf2image and ensure Tesseract binary is installed.'}), 503
        if err:
            # Log traceback if possible
            import traceback
            tb = traceback.format_exc()
            print(f"[OCR] OCR error: {err}\n{tb}")
            return jsonify({'error': 'OCR failed', 'detail': str(err)}), 500

        parsed = parse_lab_results(ocr_text)
        print(f"[OCR] Extracted text length: {len(ocr_text or '')}, parsed keys: {list(parsed.keys())}")

        return jsonify({'ocr_text': ocr_text, 'parsed': parsed}), 200
    finally:
        try:
            os.remove(tmp_path)
        except Exception:
            pass

# Validation config for assessment inputs
VALIDATION_RULES = {
    'heart': {
        'age': {'min': 10, 'max': 100},
        'trestbps': {'min': 80, 'max': 210},
        'chol': {'min': 100, 'max': 600},
        'thalach': {'min': 50, 'max': 220},
        'oldpeak': {'min': 0, 'max': 10},
        'ca': {'min': 0, 'max': 5},
    },
    'diabetes': {
        'pregnancies': {'min': 0, 'max': 20},
        'glucose': {'min': 0, 'max': 300},  # Allow 0 as it appears in dataset albeit likely missing
        'blood_pressure': {'min': 0, 'max': 150},
        'skin_thickness': {'min': 0, 'max': 110},
        'insulin': {'min': 0, 'max': 900},
        'bmi': {'min': 0, 'max': 80},
        'diabetes_pedigree': {'min': 0, 'max': 3.0},
        'age': {'min': 1, 'max': 120},
    },
    'stroke': {
        'age': {'min': 0, 'max': 120},
        'avg_glucose_level': {'min': 40, 'max': 300},
        'bmi': {'min': 10, 'max': 100},
    },
    'kidney': {
        'age': {'min': 1, 'max': 120},
        'blood_pressure': {'min': 40, 'max': 200},
        'specific_gravity': {'min': 1.000, 'max': 1.035},
        'albumin': {'min': 0, 'max': 5},
        'sugar': {'min': 0, 'max': 5},
        'blood_glucose_random': {'min': 20, 'max': 500},
        'blood_urea': {'min': 1, 'max': 400},
        'serum_creatinine': {'min': 0.1, 'max': 80},
        'sodium': {'min': 4, 'max': 170},
        'potassium': {'min': 1, 'max': 50},
        'haemoglobin': {'min': 3, 'max': 25},
        'packed_cell_volume': {'min': 5, 'max': 65},
        'white_blood_cell_count': {'min': 1000, 'max': 30000},
        'red_blood_cell_count': {'min': 1, 'max': 15},
    }
}

def validate_assessment_input(assessment_type, input_data):
    """Validate assessment input data against realistic medical ranges"""
    rules = VALIDATION_RULES.get(assessment_type, {})
    errors = []
    
    for field_name, field_value in input_data.items():
        if field_name not in rules:
            continue
            
        # Skip empty or non-numeric values
        if field_value == '' or field_value is None:
            continue
            
        try:
            num_value = float(field_value)
        except (ValueError, TypeError):
            continue
            
        min_val = rules[field_name].get('min')
        max_val = rules[field_name].get('max')
        
        if num_value < min_val or num_value > max_val:
            errors.append(f"{field_name}: value {num_value} is outside valid range ({min_val}-{max_val})")
    
    return errors

# ============================================================================
# AUTH ROUTES
# ============================================================================

@app.route('/api/auth/register', methods=['POST'])
def register():
    print("[REGISTER] Received registration request")
    try:
        data = request.get_json()
        print(f"[REGISTER] Data: {data}")
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400

        if db is None:
            return jsonify({'error': 'Database connection failed'}), 500

        # Check if user exists
        if db.users.find_one({'email': email}):
            return jsonify({'error': 'User already exists'}), 409

        # Hash password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        # Create user
        user_doc = {
            'email': email,
            'password': hashed_password,
            'created_at': datetime.utcnow()
        }
        result = db.users.insert_one(user_doc)
        user_id = str(result.inserted_id)

        # Generate token
        access_token = create_access_token(identity=user_id)

        return jsonify({'access_token': access_token, 'user_id': user_id}), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400

        if db is None:
            return jsonify({'error': 'Database connection failed'}), 500

        # Find user
        user = db.users.find_one({'email': email})
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401

        # Check password
        if not bcrypt.checkpw(password.encode('utf-8'), user['password']):
            return jsonify({'error': 'Invalid credentials'}), 401

        # Generate token
        user_id = str(user['_id'])
        access_token = create_access_token(identity=user_id)

        return jsonify({'access_token': access_token, 'user_id': user_id}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        user_id = get_jwt_identity()
        if db is None:
            return jsonify({'error': 'Database connection failed'}), 500

        user = db.users.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404

        return jsonify({'user': {'id': str(user['_id']), 'email': user['email']}}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# ASSESSMENT ROUTES
# ============================================================================

@app.route('/api/assessments', methods=['GET'])
@jwt_required()
def get_assessments():
    try:
        user_id = get_jwt_identity()
        if db is None:
            return jsonify({'error': 'Database connection failed'}), 500

        assessments = list(db.assessments.find({'user_id': user_id}).sort('created_at', -1))
        return jsonify([serialize_doc(a) for a in assessments]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/assessments', methods=['POST'])
@jwt_required()
def create_assessment():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        if db is None:
            return jsonify({'error': 'Database connection failed'}), 500

        assessment_type = data.get('assessment_type')
        # Check both assessment_data (new) and input_data (legacy/frontend)
        assessment_data = data.get('assessment_data') or data.get('input_data') or {}

        # Validate input data
        validation_errors = validate_assessment_input(assessment_type, assessment_data)
        if validation_errors:
            return jsonify({
                'error': 'Invalid input values',
                'details': validation_errors
            }), 400

        assessment_doc = {
            'user_id': user_id,
            'assessment_type': assessment_type,
            'risk_level': data.get('risk_level'),
            'assessment_data': assessment_data,
            'created_at': datetime.utcnow()
        }

        result = db.assessments.insert_one(assessment_doc)
        assessment_doc['id'] = str(result.inserted_id)
        del assessment_doc['_id']

        # Debug logging
        print(f"[CREATE_ASSESSMENT] Created assessment - user_id: {user_id}, type: {assessment_type}, risk_level: {data.get('risk_level')}, inserted_id: {result.inserted_id}")

        return jsonify(assessment_doc), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/assessments/recent', methods=['GET'])
@jwt_required()
def get_recent_assessments():
    try:
        user_id = get_jwt_identity()
        if db is None:
            return jsonify({'error': 'Database connection failed'}), 500

        limit = request.args.get('limit', 5, type=int)
        assessments = list(db.assessments.find({'user_id': user_id}).sort('created_at', -1).limit(limit))
        return jsonify([serialize_doc(a) for a in assessments]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/assessments/latest/<assessment_type>', methods=['GET'])
@jwt_required()
def get_latest_assessment_by_type(assessment_type):
    try:
        user_id = get_jwt_identity()
        if db is None:
            return jsonify({'error': 'Database connection failed'}), 500

        assessment = db.assessments.find_one(
            {'user_id': user_id, 'assessment_type': assessment_type},
            sort=[('created_at', -1)]
        )
        
        if not assessment:
            return jsonify({}), 200

        return jsonify(serialize_doc(assessment)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# DIET PLANS ROUTES (GROQ-ONLY)
# ============================================================================

@app.route('/api/diet-plans/generate', methods=['POST'])
@jwt_required()
def generate_diet_plan():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        if not GROQ_API_KEY:
            return jsonify({'error': 'GROQ_API_KEY is not configured. Set the GROQ_API_KEY environment variable.'}), 500

        if db is None:
            return jsonify({'error': 'Database connection failed'}), 500

        # Build prompt - either from explicit prompt or from assessment data
        assessment_id = data.get('assessmentId')
        prompt = data.get('prompt')
        
        if not prompt:
            # Build prompt from assessment if assessmentId provided
            if assessment_id:
                try:
                    assessment = db.assessments.find_one({'_id': ObjectId(assessment_id)})
                    if assessment:
                        risk_level = assessment.get('risk_level', 'unknown')
                        assessment_type = assessment.get('assessment_type', 'general')
                        prompt = f"""Generate a personalized 1-day diet plan for a person with {risk_level} risk level for {assessment_type} disease.
You MUST follow this exact format with no markdown (no asterisks or hashes):

[Breakfast]
(Content here)

[Lunch]
(Content here)

[Dinner]
(Content here)

[Snacks]
(Content here)

[Important Tips]
(Content here)

Do not use **bold** or ## headers. Just plain text under the bracketed headers."""
                    else:
                        prompt = """Generate a 1-day nutritious diet plan.
You MUST follow this exact format with no markdown (no asterisks or hashes):

[Breakfast]
(Content here)

[Lunch]
(Content here)

[Dinner]
(Content here)

[Snacks]
(Content here)

[Important Tips]
(Content here)"""
                except Exception as e:
                    prompt = """Generate a nutritious 1-day diet plan.
You MUST follow this exact format with no markdown (no asterisks or hashes):

[Breakfast]
(Content here)

[Lunch]
(Content here)

[Dinner]
(Content here)

[Snacks]
(Content here)

[Important Tips]
(Content here)"""
            else:
                 prompt = """Generate a nutritious 1-day diet plan.
You MUST follow this exact format with no markdown (no asterisks or hashes):

[Breakfast]
(Content here)

[Lunch]
(Content here)

[Dinner]
(Content here)

[Snacks]
(Content here)

[Important Tips]
(Content here)"""

        print(f'Diet Plan Generation - Prompt: {prompt[:100]}...')

        try:
            response = requests.post(
                GROQ_API_URL,
                headers={
                    'Authorization': f'Bearer {GROQ_API_KEY}',
                    'Content-Type': 'application/json'
                },
                json={
                    'model': 'llama-3.1-8b-instant',
                    'messages': [
                        {'role': 'user', 'content': prompt}
                    ],
                    'temperature': 0.7,
                    'max_tokens': 1200,
                    'stream': False
                },
                timeout=30
            )
            response.raise_for_status()
            result = response.json()
            plan_content = result['choices'][0]['message']['content'].strip()
        except Exception as e:
            print(f'GROQ API Error: {str(e)}')
            return jsonify({'error': 'GROQ API request failed', 'details': str(e)}), 502

        # Save diet plan
        plan_doc = {
            'user_id': user_id,
            'assessment_id': assessment_id,
            'plan_content': plan_content,
            'risk_type': data.get('risk_type', 'general'),
            'created_at': datetime.utcnow()
        }

        result = db.diet_plans.insert_one(plan_doc)
        plan_doc['id'] = str(result.inserted_id)
        del plan_doc['_id']

        return jsonify(plan_doc), 201

    except Exception as e:
        print(f'Unexpected error in diet plan generation: {str(e)}')
        return jsonify({'error': str(e)}), 500

# ============================================================================
# LIFESTYLE ANALYSES ROUTES (GROQ-ONLY)
# ============================================================================

@app.route('/api/lifestyle-analyses/generate', methods=['POST'])
@jwt_required()
def generate_lifestyle_analysis():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        if not GROQ_API_KEY:
            return jsonify({'error': 'GROQ_API_KEY is not configured. Set the GROQ_API_KEY environment variable.'}), 500

        if db is None:
            return jsonify({'error': 'Database connection failed'}), 500

        # Build prompt - either from explicit prompt or from assessment data
        assessment_id = data.get('assessmentId')
        prompt = data.get('prompt')
        
        if not prompt:
            # Build prompt from assessment if assessmentId provided
            if assessment_id:
                try:
                    assessment = db.assessments.find_one({'_id': ObjectId(assessment_id)})
                    if assessment:
                        risk_level = assessment.get('risk_level', 'unknown')
                        assessment_type = assessment.get('assessment_type', 'general')
                        prompt = f"""Generate a comprehensive lifestyle analysis for a person with {risk_level} risk level for {assessment_type} disease.
You MUST follow this exact format with no markdown (no asterisks or hashes):

[Exercise Routine]
(Content here)

[Sleep Hygiene]
(Content here)

[Stress Management]
(Content here)

[Daily Habits to Adopt]
(Content here)

[Habits to Avoid]
(Content here)

Keep recommendations practical and concise. Do not use **bold** or ## headers."""
                    else:
                        prompt = """Generate a comprehensive lifestyle analysis.
You MUST follow this exact format with no markdown (no asterisks or hashes):

[Exercise Routine]
(Content here)

[Sleep Hygiene]
(Content here)

[Stress Management]
(Content here)

[Daily Habits to Adopt]
(Content here)

[Habits to Avoid]
(Content here)"""
                except Exception as e:
                    prompt = """Generate a comprehensive lifestyle analysis.
You MUST follow this exact format with no markdown (no asterisks or hashes):

[Exercise Routine]
(Content here)

[Sleep Hygiene]
(Content here)

[Stress Management]
(Content here)

[Daily Habits to Adopt]
(Content here)

[Habits to Avoid]
(Content here)"""
            else:
                prompt = """Generate a comprehensive lifestyle analysis.
You MUST follow this exact format with no markdown (no asterisks or hashes):

[Exercise Routine]
(Content here)

[Sleep Hygiene]
(Content here)

[Stress Management]
(Content here)

[Daily Habits to Adopt]
(Content here)

[Habits to Avoid]
(Content here)"""

        print(f'Lifestyle Analysis Generation - Prompt: {prompt[:100]}...')

        try:
            response = requests.post(
                GROQ_API_URL,
                headers={
                    'Authorization': f'Bearer {GROQ_API_KEY}',
                    'Content-Type': 'application/json'
                },
                json={
                    'model': 'llama-3.1-8b-instant',
                    'messages': [
                        {'role': 'user', 'content': prompt}
                    ],
                    'temperature': 0.7,
                    'max_tokens': 800,
                    'stream': False
                },
                timeout=30
            )
            response.raise_for_status()
            result = response.json()
            analysis_content = result['choices'][0]['message']['content'].strip()
        except Exception as e:
            print(f'GROQ API Error: {str(e)}')
            return jsonify({'error': 'GROQ API request failed', 'details': str(e)}), 502

        # Save lifestyle analysis
        analysis_doc = {
            'user_id': user_id,
            'assessment_id': assessment_id,
            'analysis_content': analysis_content,
            'created_at': datetime.utcnow()
        }

        result = db.lifestyle_analyses.insert_one(analysis_doc)
        analysis_doc['id'] = str(result.inserted_id)
        del analysis_doc['_id']

        return jsonify(analysis_doc), 201

    except Exception as e:
        print(f'Unexpected error in lifestyle analysis generation: {str(e)}')
        return jsonify({'error': str(e)}), 500


# ============================================================================
# GROQ CHAT ENDPOINT
# ============================================================================

@app.route('/api/chat/groq', methods=['POST'])
@jwt_required()
def groq_chat():
    try:
        user_id = get_jwt_identity()
        data = request.get_json() or {}

        if not GROQ_API_KEY:
            return jsonify({'error': 'GROQ_API_KEY is not configured.'}), 500

        messages = data.get('messages')
        user_prompt = data.get('prompt')

        if not messages:
            if not user_prompt:
                return jsonify({'error': 'No prompt or messages provided'}), 400
            messages = [{'role': 'user', 'content': user_prompt}]

        try:
            response = requests.post(
                GROQ_API_URL,
                headers={
                    'Authorization': f'Bearer {GROQ_API_KEY}',
                    'Content-Type': 'application/json'
                },
                json={
                    'model': 'llama-3.1-8b-instant',
                    'messages': messages,
                    'temperature': 0.7,
                    'max_tokens': 800,
                    'stream': False
                },
                timeout=30
            )
            response.raise_for_status()
            result = response.json()
            content = result['choices'][0]['message']['content'].strip()
            return jsonify({'reply': content}), 200
        except Exception as e:
            print(f'GROQ Chat Error: {str(e)}')
            return jsonify({'error': 'GROQ API request failed', 'details': str(e)}), 502

    except Exception as e:
        print(f'Unexpected error in groq_chat: {str(e)}')
        return jsonify({'error': str(e)}), 500

# ============================================================================
# DIET PLANS - GET ROUTE
# ============================================================================

@app.route('/api/diet-plans', methods=['GET'])
@jwt_required()
def get_diet_plans():
    try:
        user_id = get_jwt_identity()

        if db is None:
            return jsonify({'error': 'Database connection failed'}), 500

        # Get all diet plans for the user, sorted by creation date (newest first)
        plans = list(db.diet_plans.find(
            {'user_id': user_id}
        ).sort('created_at', -1))

        # Serialize documents
        plans = [serialize_doc(plan) for plan in plans]

        return jsonify(plans), 200

    except Exception as e:
        print(f'Error fetching diet plans: {str(e)}')
        return jsonify({'error': str(e)}), 500

# ============================================================================
# LIFESTYLE ANALYSES - GET ROUTE
# ============================================================================

@app.route('/api/lifestyle-analyses', methods=['GET'])
@jwt_required()
def get_lifestyle_analyses():
    try:
        user_id = get_jwt_identity()

        if db is None:
            return jsonify({'error': 'Database connection failed'}), 500

        # Get all lifestyle analyses for the user, sorted by creation date (newest first)
        analyses = list(db.lifestyle_analyses.find(
            {'user_id': user_id}
        ).sort('created_at', -1))

        # Serialize documents
        analyses = [serialize_doc(analysis) for analysis in analyses]

        return jsonify(analyses), 200

    except Exception as e:
        print(f'Error fetching lifestyle analyses: {str(e)}')
        return jsonify({'error': str(e)}), 500

# ============================================================================
# REMINDER ROUTES
# ============================================================================

@app.route('/api/reminders', methods=['GET'])
@jwt_required()
def get_reminders():
    try:
        user_id = get_jwt_identity()
        if db is None:
            return jsonify({'error': 'Database connection failed'}), 500

        reminders = list(db.reminders.find({'user_id': user_id}).sort('created_at', 1))
        return jsonify([serialize_doc(r) for r in reminders]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reminders', methods=['POST'])
@jwt_required()
def create_reminder():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        if db is None:
            return jsonify({'error': 'Database connection failed'}), 500

        reminder_doc = {
            'user_id': user_id,
            'reminder_type': data.get('reminder_type'),
            'interval_minutes': data.get('interval_minutes'),
            'is_active': data.get('is_active', True),
            'last_triggered_at': None,
            'created_at': datetime.utcnow()
        }

        # Add optional custom name for custom reminders
        if data.get('custom_name'):
            reminder_doc['custom_name'] = data.get('custom_name')
        
        # Add optional scheduled_at for one-time or scheduled reminders
        if data.get('scheduled_at'):
            reminder_doc['scheduled_at'] = data.get('scheduled_at')

        result = db.reminders.insert_one(reminder_doc)
        reminder_doc['id'] = str(result.inserted_id)
        del reminder_doc['_id']

        return jsonify(reminder_doc), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reminders/<reminder_id>', methods=['PUT'])
@jwt_required()
def update_reminder(reminder_id):
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        if db is None:
            return jsonify({'error': 'Database connection failed'}), 500

        update_data = {}
        if 'is_active' in data:
            update_data['is_active'] = data['is_active']
        if 'interval_minutes' in data:
            update_data['interval_minutes'] = data['interval_minutes']
        if 'last_triggered_at' in data:
            update_data['last_triggered_at'] = data['last_triggered_at']
        if 'custom_name' in data:
            update_data['custom_name'] = data['custom_name']
        if 'scheduled_at' in data:
            update_data['scheduled_at'] = data['scheduled_at']

        result = db.reminders.update_one(
            {'_id': ObjectId(reminder_id), 'user_id': user_id},
            {'$set': update_data}
        )

        if result.matched_count == 0:
            return jsonify({'error': 'Reminder not found'}), 404

        reminder = db.reminders.find_one({'_id': ObjectId(reminder_id)})
        return jsonify(serialize_doc(reminder)), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reminders/<reminder_id>', methods=['DELETE'])
@jwt_required()
def delete_reminder(reminder_id):
    try:
        user_id = get_jwt_identity()

        if db is None:
            return jsonify({'error': 'Database connection failed'}), 500

        result = db.reminders.delete_one({'_id': ObjectId(reminder_id), 'user_id': user_id})

        if result.deleted_count == 0:
            return jsonify({'error': 'Reminder not found'}), 404

        return jsonify({'message': 'Reminder deleted'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# PROFILE ROUTES
# ============================================================================

@app.route('/api/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        user_id = get_jwt_identity()
        if db is None:
            return jsonify({'error': 'Database connection failed'}), 500

        profile = db.profiles.find_one({'user_id': user_id})
        
        if not profile:
            # Create default profile if doesn't exist
            profile_doc = {
                'user_id': user_id,
                'full_name': None,
                'age': None,
                'gender': None,
                'medical_notes': None,
                'reminders_enabled': True,
                'dark_mode': False,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            db.profiles.insert_one(profile_doc)
            profile = profile_doc

        return jsonify(serialize_doc(profile)), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        if db is None:
            return jsonify({'error': 'Database connection failed'}), 500

        update_data = {
            'updated_at': datetime.utcnow()
        }
        
        if 'full_name' in data:
            update_data['full_name'] = data['full_name']
        if 'age' in data:
            update_data['age'] = data['age']
        if 'gender' in data:
            update_data['gender'] = data['gender']
        if 'medical_notes' in data:
            update_data['medical_notes'] = data['medical_notes']
        if 'reminders_enabled' in data:
            update_data['reminders_enabled'] = data['reminders_enabled']
        if 'dark_mode' in data:
            update_data['dark_mode'] = data['dark_mode']

        result = db.profiles.update_one(
            {'user_id': user_id},
            {'$set': update_data},
            upsert=True
        )

        profile = db.profiles.find_one({'user_id': user_id})
        return jsonify(serialize_doc(profile)), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# ML PREDICTION ROUTES
# ============================================================================

@app.route('/api/predict/heart', methods=['POST'])
@jwt_required()
def predict_heart_risk():
    try:
        data = request.get_json()
        features = [
            data.get('age', 0),
            data.get('sex', 0),
            data.get('cp', 0),
            data.get('trestbps', 120),
            data.get('chol', 200),
            data.get('fbs', 0),
            data.get('restecg', 0),
            data.get('thalach', 150),
            data.get('exang', 0),
            data.get('oldpeak', 0.0),
            data.get('slope', 1),
            data.get('ca', 0),
            data.get('thal', 2)
        ]

        # Load model and scaler
        model_path = os.path.join(os.path.dirname(__file__), 'models', 'heart_model.pkl')
        scaler_path = os.path.join(os.path.dirname(__file__), 'models', 'heart_scaler.pkl')
        model = joblib.load(model_path)
        scaler = joblib.load(scaler_path)
        
        # Try to load imputer, but continue without it if not available
        try:
            imputer = joblib.load('backend/models/heart_imputer.pkl')
            features_array = imputer.transform([features])
        except:
            features_array = [features]

        # Preprocess
        features_scaled = scaler.transform(features_array)

        # Predict
        prediction = model.predict(features_scaled)[0]
        probability = model.predict_proba(features_scaled)[0][1]

        risk_level = 'high' if probability > 0.7 else 'medium' if probability > 0.4 else 'low'

        return jsonify({
            'prediction': int(prediction),
            'probability': float(probability),
            'risk_level': risk_level
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/predict/diabetes', methods=['POST'])
@jwt_required()
def predict_diabetes_risk():
    try:
        data = request.get_json()
        features = [
            data.get('pregnancies', 0),
            data.get('glucose', 120),
            data.get('blood_pressure', 70),
            data.get('skin_thickness', 20),
            data.get('insulin', 80),
            data.get('bmi', 25.0),
            data.get('diabetes_pedigree', 0.5),
            data.get('age', 30)
        ]

        # Load model and scaler
        model_path = os.path.join(os.path.dirname(__file__), 'models', 'diabetes_model.pkl')
        scaler_path = os.path.join(os.path.dirname(__file__), 'models', 'diabetes_scaler.pkl')
        model = joblib.load(model_path)
        scaler = joblib.load(scaler_path)
        
        # Try to load imputer, but continue without it if not available
        try:
            imputer = joblib.load('backend/models/diabetes_imputer.pkl')
            features_array = imputer.transform([features])
        except:
            features_array = [features]

        # Preprocess
        features_scaled = scaler.transform(features_array)

        # Predict
        prediction = model.predict(features_scaled)[0]
        probability = model.predict_proba(features_scaled)[0][1]

        risk_level = 'high' if probability > 0.7 else 'medium' if probability > 0.4 else 'low'

        return jsonify({
            'prediction': int(prediction),
            'probability': float(probability),
            'risk_level': risk_level
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/predict/stroke', methods=['POST'])
@jwt_required()
def predict_stroke_risk():
    try:
        data = request.get_json()
        features = [
            data.get('gender', 0),
            data.get('age', 50),
            data.get('hypertension', 0),
            data.get('heart_disease', 0),
            data.get('ever_married', 0),
            data.get('work_type', 2),
            data.get('avg_glucose_level', 100.0),
            data.get('bmi', 25.0),
            data.get('smoking_status', 0)
        ]

        # Load model and scaler
        model_path = os.path.join(os.path.dirname(__file__), 'models', 'stroke_model.pkl')
        scaler_path = os.path.join(os.path.dirname(__file__), 'models', 'stroke_scaler.pkl')
        model = joblib.load(model_path)
        scaler = joblib.load(scaler_path)
        
        # Try to load imputer, but continue without it if not available
        try:
            imputer = joblib.load('backend/models/stroke_imputer.pkl')
            features_array = imputer.transform([features])
        except:
            features_array = [features]

        # Preprocess
        features_scaled = scaler.transform(features_array)

        # Predict
        prediction = model.predict(features_scaled)[0]
        probability = model.predict_proba(features_scaled)[0][1]

        risk_level = 'high' if probability > 0.7 else 'medium' if probability > 0.4 else 'low'

        return jsonify({
            'prediction': int(prediction),
            'probability': float(probability),
            'risk_level': risk_level
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/predict/kidney', methods=['POST'])
@jwt_required()
def predict_kidney_risk():
    try:
        data = request.get_json()
        features = [
            data.get('age', 50),
            data.get('blood_pressure', 80),
            data.get('specific_gravity', 1.020),
            data.get('albumin', 0),
            data.get('sugar', 0),
            data.get('red_blood_cells', 1),
            data.get('pus_cell', 1),
            data.get('pus_cell_clumps', 0),
            data.get('bacteria', 0),
            data.get('blood_glucose_random', 120),
            data.get('blood_urea', 40),
            data.get('serum_creatinine', 1.2),
            data.get('sodium', 140),
            data.get('potassium', 4.5),
            data.get('haemoglobin', 13.0),
            data.get('packed_cell_volume', 40),
            data.get('white_blood_cell_count', 8000),
            data.get('red_blood_cell_count', 5.0),
            data.get('hypertension', 0),
            data.get('diabetes_mellitus', 0),
            data.get('coronary_artery_disease', 0),
            data.get('appetite', 1),
            data.get('peda_edema', 0),
            data.get('aanemia', 0)
        ]

        # Load model and scaler
        model = joblib.load('backend/models/kidney_model.pkl')
        scaler = joblib.load('backend/models/kidney_scaler.pkl')
        
        # Try to load imputer, but continue without it if not available
        try:
            imputer = joblib.load('backend/models/kidney_imputer.pkl')
            features_array = imputer.transform([features])
        except:
            features_array = [features]

        # Preprocess
        features_scaled = scaler.transform(features_array)

        # Predict
        prediction = model.predict(features_scaled)[0]
        probability = model.predict_proba(features_scaled)[0][1]

        risk_level = 'high' if probability > 0.7 else 'medium' if probability > 0.4 else 'low'

        return jsonify({
            'prediction': int(prediction),
            'probability': float(probability),
            'risk_level': risk_level
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
# ============================================================================
# TRENDS & MONITORING ROUTES
# ============================================================================

@app.route('/api/trends', methods=['GET'])
@jwt_required()
def get_trends():
    """Get health risk trends/timeline for the user"""
    try:
        user_id = get_jwt_identity()
        if db is None:
            return jsonify({'error': 'Database connection failed'}), 500

        # Get all assessments for the user, grouped by type
        assessments = list(db.assessments.find({'user_id': user_id}).sort('created_at', 1))
        
        # Debug logging
        print(f"[GET_TRENDS] user_id: {user_id}, assessments_found: {len(assessments)}")
        
        if not assessments:
            print(f"[GET_TRENDS] No assessments found for user {user_id}")
            return jsonify({
                'timeline': [],
                'riskProgression': None,
                'metabolicRiskIndex': 0,
                'majorFactors': [],
                'contributingFactors': []
            }), 200

        print(f"[GET_TRENDS] Found {len(assessments)} assessments for user {user_id}")

        # Build timeline from assessments
        timeline = []
        risk_scores_by_type = {}
        
        for assessment in assessments:
            # Convert risk_level to numeric score
            risk_score_map = {'low': 30, 'medium': 60, 'high': 85}
            risk_score = risk_score_map.get(assessment.get('risk_level'), 50)
            
            assessment_type = assessment.get('assessment_type')
            
            # Track by type
            if assessment_type not in risk_scores_by_type:
                risk_scores_by_type[assessment_type] = []
            risk_scores_by_type[assessment_type].append(risk_score)
            
            # Add to timeline
            timeline.append({
                'date': assessment['created_at'].strftime('%b %Y'),
                'assessment_type': assessment_type,
                'risk_score': risk_score,
                'risk_level': assessment.get('risk_level'),
                'timestamp': assessment['created_at'].isoformat()
            })

        # Calculate overall risk progression
        all_scores = [item['risk_score'] for item in timeline]
        if len(all_scores) >= 2:
            first_score = all_scores[0]
            last_score = all_scores[-1]
            progression = {
                'from': first_score,
                'to': last_score,
                'change': last_score - first_score,
                'percentage_change': ((last_score - first_score) / first_score * 100) if first_score > 0 else 0
            }
        else:
            progression = None

        # Calculate Metabolic Risk Index (combined diseases)
        metabolic_risk = 0
        if 'heart' in risk_scores_by_type:
            metabolic_risk += risk_scores_by_type['heart'][-1] * 0.35
        if 'diabetes' in risk_scores_by_type:
            metabolic_risk += risk_scores_by_type['diabetes'][-1] * 0.35
        if 'kidney' in risk_scores_by_type:
            metabolic_risk += risk_scores_by_type['kidney'][-1] * 0.20
        if 'stroke' in risk_scores_by_type:
            metabolic_risk += risk_scores_by_type['stroke'][-1] * 0.10
        
        # Identify major contributing factors
        major_factors = []
        for disease_type, scores in risk_scores_by_type.items():
            latest_score = scores[-1]
            if latest_score >= 60:  # High risk
                trend = 'increasing' if len(scores) > 1 and scores[-1] > scores[-2] else 'stable'
                major_factors.append({
                    'factor': disease_type.capitalize(),
                    'score': latest_score,
                    'trend': trend
                })

        # Extract specific contributing factors from latest assessment
        contributing_factors = []
        if assessments:
            latest = assessments[-1]
            assessment_data = latest.get('assessment_data')
            if not isinstance(assessment_data, dict):
                assessment_data = {}
            
            # Analyze specific health metrics
            factors_analysis = []
            
            # Age factor
            age_val = assessment_data.get('age')
            try:
                age_str = str(age_val).strip() if age_val is not None else ''
                age = float(age_str) if age_str and age_str not in ('None', 'null', 'NoneType') else 0
            except (ValueError, TypeError):
                age = 0
            if age > 0:
                age_impact = 0
                if age >= 45:
                    age_impact = 10 if age < 55 else 15 if age < 65 else 20
                if age_impact > 0:
                    factors_analysis.append({
                        'name': 'Age above 45',
                        'value': f"{age} years",
                        'impact': age_impact,
                        'category': 'age'
                    })

            # Blood Glucose factor
            glucose_val = assessment_data.get('blood_glucose_random') or assessment_data.get('glucose')
            try:
                glucose = float(glucose_val) if glucose_val is not None and str(glucose_val).strip() != '' else 0
            except (ValueError, TypeError):
                glucose = 0
            if glucose > 0:
                glucose_impact = 0
                if glucose >= 200:
                    glucose_impact = 35
                elif glucose >= 150:
                    glucose_impact = 25
                elif glucose >= 125:
                    glucose_impact = 15
                if glucose_impact > 0:
                    factors_analysis.append({
                        'name': 'High glucose level',
                        'value': f"{glucose} mg/dL",
                        'impact': glucose_impact,
                        'category': 'glucose'
                    })

            # BMI factor
            bmi_val = assessment_data.get('bmi')
            try:
                bmi = float(bmi_val) if bmi_val is not None and str(bmi_val).strip() != '' else 0
            except (ValueError, TypeError):
                bmi = 0
            if bmi > 0:
                bmi_impact = 0
                if bmi >= 30:
                    bmi_impact = 20 if bmi < 35 else 25
                elif bmi >= 25:
                    bmi_impact = 10
                if bmi_impact > 0:
                    factors_analysis.append({
                        'name': 'BMI above normal',
                        'value': f"BMI {bmi}",
                        'impact': bmi_impact,
                        'category': 'bmi'
                    })

            # Blood Pressure factor
            bp_val = assessment_data.get('blood_pressure')
            try:
                bp = float(bp_val) if bp_val is not None and str(bp_val).strip() != '' else 0
            except (ValueError, TypeError):
                bp = 0
            if bp > 0:
                bp_impact = 0
                if bp >= 160:
                    bp_impact = 20
                elif bp >= 140:
                    bp_impact = 15
                elif bp >= 130:
                    bp_impact = 10
                if bp_impact > 0:
                    factors_analysis.append({
                        'name': 'High blood pressure',
                        'value': f"{bp} mmHg",
                        'impact': bp_impact,
                        'category': 'bp'
                    })

            # Cholesterol factor
            cholesterol_val = assessment_data.get('cholesterol') or assessment_data.get('total_cholesterol')
            try:
                cholesterol = float(cholesterol_val) if cholesterol_val is not None and str(cholesterol_val).strip() != '' else 0
            except (ValueError, TypeError):
                cholesterol = 0
            if cholesterol > 0:
                chol_impact = 0
                if cholesterol >= 240:
                    chol_impact = 18
                elif cholesterol >= 200:
                    chol_impact = 12
                if chol_impact > 0:
                    factors_analysis.append({
                        'name': 'High cholesterol',
                        'value': f"{cholesterol} mg/dL",
                        'impact': chol_impact,
                        'category': 'cholesterol'
                    })
            
            # Smoking status
            smoking = assessment_data.get('smoking', False)
            if smoking:
                factors_analysis.append({
                    'name': 'Smoking history',
                    'value': 'Yes',
                    'impact': 15,
                    'category': 'lifestyle'
                })
            
            # Family history
            family_history = assessment_data.get('family_history', False)
            if family_history:
                factors_analysis.append({
                    'name': 'Family history',
                    'value': 'Yes',
                    'impact': 12,
                    'category': 'genetics'
                })
            
            # Sort by impact and take top 3
            contributing_factors = sorted(factors_analysis, key=lambda x: x['impact'], reverse=True)[:3]

        return jsonify({
            'timeline': timeline,
            'riskProgression': progression,
            'metabolicRiskIndex': round(metabolic_risk, 2),
            'majorFactors': major_factors,
            'contributingFactors': contributing_factors
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/trends/simulation', methods=['POST'])
@jwt_required()
def simulate_improvement():
    """Simulate health improvement based on parameter changes"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if db is None:
            return jsonify({'error': 'Database connection failed'}), 500

        # Get latest assessment
        latest_assessment = db.assessments.find_one(
            {'user_id': user_id},
            sort=[('created_at', -1)]
        )
        
        if not latest_assessment:
            return jsonify({'error': 'No assessments found'}), 404

        current_risk = latest_assessment.get('risk_level', 'medium')
        current_score_map = {'low': 30, 'medium': 60, 'high': 85}
        current_score = current_score_map.get(current_risk, 60)

        # Get the parameters to simulate
        params = data.get('parameters', {})
        current_bmi = params.get('current_bmi', 28)
        target_bmi = params.get('target_bmi', 24)
        
        current_glucose = params.get('current_glucose', 120)
        target_glucose = params.get('target_glucose', 100)
        
        current_blood_pressure = params.get('current_blood_pressure', 140)
        target_blood_pressure = params.get('target_blood_pressure', 120)

        # Calculate improvements (rough estimation)
        bmi_improvement = max(0, ((current_bmi - target_bmi) / current_bmi) * 20)  # Up to 20% reduction
        glucose_improvement = max(0, ((current_glucose - target_glucose) / current_glucose) * 15)  # Up to 15%
        bp_improvement = max(0, ((current_blood_pressure - target_blood_pressure) / current_blood_pressure) * 15)  # Up to 15%
        
        total_improvement = min(bmi_improvement + glucose_improvement + bp_improvement, 50)  # Cap at 50%
        projected_score = max(0, current_score - total_improvement)
        
        return jsonify({
            'current_score': current_score,
            'projected_score': projected_score,
            'improvement': total_improvement,
            'breakdown': {
                'bmi_improvement': round(bmi_improvement, 2),
                'glucose_improvement': round(glucose_improvement, 2),
                'bp_improvement': round(bp_improvement, 2)
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# DEBUG ENDPOINTS
# ============================================================================

@app.route('/api/debug/assessments-count', methods=['GET'])
@jwt_required()
def debug_assessment_count():
    """Debug endpoint to check assessment count in database"""
    try:
        user_id = get_jwt_identity()
        
        if db is None:
            return jsonify({'error': 'Database connection failed'}), 500
        
        # Count total assessments for this user
        total_count = db.assessments.count_documents({'user_id': user_id})
        
        # Get all assessments for this user
        user_assessments = list(db.assessments.find({'user_id': user_id}).sort('created_at', -1))
        
        # Count in database (all assessments regardless of user)
        all_count = db.assessments.count_documents({})
        
        assessments_data = []
        for a in user_assessments:
            assessments_data.append({
                'id': str(a.get('_id')),
                'user_id': a.get('user_id'),
                'type': a.get('assessment_type'),
                'risk_level': a.get('risk_level'),
                'created_at': a.get('created_at').isoformat() if a.get('created_at') else None
            })
        
        return jsonify({
            'current_user_id': user_id,
            'assessments_for_user': total_count,
            'total_assessments_in_db': all_count,
            'user_assessments': assessments_data
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
