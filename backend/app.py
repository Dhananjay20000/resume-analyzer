"""
Resume Analyzer Backend - Python Flask REST API
Analyzes resumes against job descriptions using keyword matching

Features:
- PDF text extraction using PyPDF2
- Keyword matching algorithm
- Match percentage calculation
- Missing skills identification
- Improvement suggestions
"""

import os
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
from PyPDF2 import PdfReader

app = Flask(__name__)
# Enable CORS for frontend-backend communication
CORS(app)

# Configuration
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB
ALLOWED_EXTENSIONS = {'pdf'}


# ============================================
# Utility Functions
# ============================================

def allowed_file(filename):
    """Check if file has allowed extension"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def extract_text_from_pdf(pdf_file):
    """
    Extract text from PDF file using PyPDF2
    
    Args:
        pdf_file: File storage object from Flask
        
    Returns:
        str: Extracted text from PDF
    """
    try:
        # Create PDF reader
        pdf_reader = PdfReader(pdf_file)
        
        # Extract text from all pages
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        
        return text
    
    except Exception as e:
        raise Exception(f"Failed to extract text from PDF: {str(e)}")


def extract_skills_from_text(text):
    """
    Extract potential skills from text
    
    Args:
        text: Resume text
        
    Returns:
        list: Found skills
    """
    # Common technical skills to look for
    common_skills = [
        # Programming Languages
        'python', 'java', 'javascript', 'c++', 'c#', 'ruby', 'go', 'rust', 'typescript',
        'php', 'swift', 'kotlin', 'scala', 'r', 'matlab', 'perl',
        
        # Web Technologies
        'html', 'css', 'html5', 'css3', 'react', 'angular', 'vue', 'node.js',
        'nodejs', 'express', 'django', 'flask', 'spring', 'bootstrap',
        
        # Databases
        'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'oracle', 'sqlite',
        'firebase', 'dynamodb',
        
        # Tools & Platforms
        'git', 'github', 'gitlab', 'docker', 'kubernetes', 'aws', 'azure',
        'gcp', 'jenkins', 'jira', 'linux', 'unix', 'windows server',
        
        # Data & ML
        'machine learning', 'deep learning', 'data analysis', 'data science',
        'tensorflow', 'pytorch', 'pandas', 'numpy', 'tableau', 'power bi',
        
        # Soft Skills
        'leadership', 'communication', 'teamwork', 'problem-solving',
        'analytical', 'project management', 'agile', 'scrum',
        
        # Other Technologies
        'rest api', 'graphql', 'microservices', 'ci/cd', 'devops'
    ]
    
    text_lower = text.lower()
    found_skills = []
    
    for skill in common_skills:
        # Use word boundary matching for better accuracy
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_lower):
            found_skills.append(skill)
    
    return found_skills


def extract_skills_from_job_description(job_description):
    """
    Extract skills from job description
    
    Args:
        job_description: Job description text
        
    Returns:
        list: Required skills
    """
    # Similar to extract_skills_from_text but optimized for job descriptions
    return extract_skills_from_text(job_description)


def calculate_match_percentage(matched_skills, total_required_skills):
    """
    Calculate match percentage
    
    Args:
        matched_skills: List of matched skills
        total_required_skills: List of required skills
        
    Returns:
        int: Match percentage (0-100)
    """
    if not total_required_skills:
        return 0
    
    return int((len(matched_skills) / len(total_required_skills)) * 100)


def generate_suggestions(matched_skills, missing_skills, resume_text):
    """
    Generate improvement suggestions
    
    Args:
        matched_skills: List of matched skills
        missing_skills: List of missing skills
        resume_text: Full resume text
        
    Returns:
        list: Suggestions
    """
    suggestions = []
    
    # Suggestion for missing skills
    for skill in missing_skills[:5]:  # Limit to top 5
        suggestions.append(
            f"Consider adding '{skill.title()}' to your skills section"
        )
    
    # Suggestion for experience highlighting
    if missing_skills:
        suggestions.append(
            "Highlight any related experience that could apply to the missing skills"
        )
    
    # General suggestions
    if len(matched_skills) < 3:
        suggestions.append(
            "Make sure your skills section is clearly visible in your resume"
        )
    else:
        suggestions.append(
            "Great job highlighting your technical skills!"
        )
    
    # Check for action verbs
    action_verbs = ['led', 'developed', 'created', 'implemented', 'managed', 'designed']
    has_action_verbs = any(verb in resume_text.lower() for verb in action_verbs)
    
    if not has_action_verbs:
        suggestions.append(
            "Use action verbs (led, developed, implemented) to describe your achievements"
        )
    
    return suggestions


# ============================================
# API Routes
# ============================================

@app.route('/api/analyze', methods=['POST'])
def analyze_resume():
    """
    Analyze resume against job description
    
    Request:
        - file: PDF file (multipart/form-data)
        - job_description: Job description text
        
    Response:
        - success: boolean
        - match_percentage: int (0-100)
        - matched_skills: list
        - missing_skills: list
        - suggestions: list
    """
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({
                "success": False,
                "error": "No file uploaded. Please upload a PDF file."
            }), 400
        
        # Check if job description is present
        job_description = request.form.get('job_description', '').strip()
        if not job_description:
            return jsonify({
                "success": False,
                "error": "No job description provided. Please enter a job description."
            }), 400
        
        file = request.files['file']
        
        # Validate file
        if file.filename == '':
            return jsonify({
                "success": False,
                "error": "No file selected. Please select a PDF file."
            }), 400
        
        if not allowed_file(file.filename):
            return jsonify({
                "success": False,
                "error": "Invalid file type. Please upload a PDF file."
            }), 400
        
        # Extract text from PDF
        try:
            resume_text = extract_text_from_pdf(file)
        except Exception as e:
            return jsonify({
                "success": False,
                "error": f"Failed to extract text from PDF: {str(e)}"
            }), 400
        
        # Check if text was extracted
        if not resume_text or not resume_text.strip():
            return jsonify({
                "success": False,
                "error": "Could not extract text from PDF. The file may be empty or image-based."
            }), 400
        
        # Extract skills from resume
        resume_skills = extract_skills_from_text(resume_text)
        
        # Extract required skills from job description
        required_skills = extract_skills_from_job_description(job_description)
        
        if not required_skills:
            return jsonify({
                "success": False,
                "error": "No skills could be identified from the job description. Please provide a more detailed job description with specific skills."
            }), 400
        
        # Find matched and missing skills
        matched_skills = []
        missing_skills = []
        
        for skill in required_skills:
            skill_lower = skill.lower()
            if skill_lower in resume_skills:
                matched_skills.append(skill.title())
            else:
                missing_skills.append(skill.title())
        
        # Calculate match percentage
        match_percentage = calculate_match_percentage(
            matched_skills, 
            required_skills
        )
        
        # Generate suggestions
        suggestions = generate_suggestions(
            matched_skills, 
            missing_skills, 
            resume_text
        )
        
        return jsonify({
            "success": True,
            "match_percentage": match_percentage,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "suggestions": suggestions,
            "total_resume_skills": len(resume_skills),
            "total_job_skills": len(required_skills)
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Internal server error: {str(e)}"
        }), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "Resume Analyzer API",
        "version": "1.0.0"
    })


@app.route('/', methods=['GET'])
def index():
    """Root endpoint - returns basic info"""
    return jsonify({
        "message": "Welcome to Resume Analyzer API",
        "description": "Analyze your resume against job descriptions",
        "endpoints": {
            "analyze": "/api/analyze (POST) - Upload PDF and job description",
            "health": "/api/health (GET) - Health check"
        },
        "usage": {
            "1": "Upload a PDF resume using multipart/form-data",
            "2": "Provide job_description as form data",
            "3": "Get analysis results with match percentage"
        }
    })


# ============================================
# Main Entry Point
# ============================================

if __name__ == '__main__':
    print("=" * 50)
    print("📄 Resume Analyzer Backend Starting...")
    print("=" * 50)
    print("API available at: http://localhost:5000")
    print("Analyze endpoint: POST /api/analyze")
    print("Health check: GET /api/health")
    print("=" * 50)
    
    app.run(debug=True, host='0.0.0.0', port=5000)
