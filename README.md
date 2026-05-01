# Resume Analyzer

A beginner-friendly full-stack application that analyzes resumes against job descriptions using keyword matching. Upload your resume (PDF), provide a job description, and get instant feedback on how well your skills match the job requirements.

## Features

- 📄 **PDF Upload**: Easily upload your resume in PDF format
- 🔍 **Text Extraction**: Extract text from PDF using PyPDF2
- 🎯 **Keyword Matching**: Compare resume skills with job requirements
- 📊 **Match Percentage**: Visual representation of how well you match
- ❌ **Missing Skills**: Identify skills you might be missing
- 💡 **Improvement Suggestions**: Get actionable advice to improve

## Folder Structure

```
ResumeAnalyzer/
├── README.md                   # This file
├── backend/
│   ├── app.py                  # Flask REST API
│   └── requirements.txt        # Python dependencies
├── frontend/
│   ├── index.html             # Main UI
│   ├── styles.css             # Styling
│   └── script.js              # Frontend logic
└── example/
    └── sample_resume.pdf      # Example resume for testing
```

## Prerequisites

- Python 3.7 or higher
- Web browser (Chrome, Firefox, Edge, etc.)
- A PDF resume to analyze

## Installation

### 1. Clone or Download the Project

Extract the project to your desired location.

### 2. Install Backend Dependencies

Open a terminal/command prompt and navigate to the backend folder:

```bash
cd ResumeAnalyzer/backend
```

Install the required packages:

```bash
pip install -r requirements.txt
```

## How to Run

### Option 1: Run Backend and Open Frontend Manually

#### Step 1: Start the Backend

```bash
python app.py
```

You should see output like:
```
===========================================
📄 Resume Analyzer Backend Starting...
===========================================
API available at: http://localhost:5000
Analyze endpoint: POST /api/analyze
Health check: GET /api/health
===========================================
```

The backend will run on `http://localhost:5000`

#### Step 2: Open the Frontend

- Navigate to `ResumeAnalyzer/frontend/`
- Double-click `index.html` to open it in your browser

**Or** use a simple HTTP server:

```bash
# From the frontend directory
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

### Option 2: Use VS Code Live Server

1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

## How to Use

1. **Upload Resume**: Click "Choose File" and select your PDF resume
2. **Enter Job Description**: Paste or type the job description in the text area
   - A sample job description is pre-filled for testing
3. **Click "Analyze Resume"**: Wait for the analysis to complete
4. **View Results**:
   - 📊 **Match Percentage**: Shows how well your resume matches
   - ✅ **Matched Skills**: Skills you have that the job requires
   - ❌ **Missing Skills**: Skills in the job description but not in your resume
   - 💡 **Suggestions**: Tips to improve your resume

## API Endpoints

### POST /api/analyze

Analyzes a resume against a job description.

**Request:**
- Content-Type: `multipart/form-data`
- Parameters:
  - `file`: PDF file (required)
  - `job_description`: Text string (required)

**Response:**
```json
{
  "success": true,
  "match_percentage": 75,
  "matched_skills": ["Python", "JavaScript", "HTML"],
  "missing_skills": ["CSS", "React"],
  "suggestions": [
    "Consider adding CSS to your skills list",
    "Learn React for frontend development",
    "Highlight your web development experience"
  ]
}
```

### GET /api/health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "Resume Analyzer API",
  "version": "1.0.0"
}
```

## Example Job Description

Here's a sample job description you can use for testing:

```
Software Developer

Requirements:
- Python programming
- JavaScript
- HTML and CSS
- React.js
- Node.js
- SQL databases

Nice to have:
- Docker
- AWS
- Git
```

## Troubleshooting

### "PDF file could not be extracted"
- Make sure the uploaded file is a valid PDF
- Check that the PDF is not password-protected
- Try with a different PDF file

### "Cannot connect to server"
- Ensure the backend is running
- Check if port 5000 is available
- Try restarting the backend

### "No skills found in resume"
- Make sure the resume contains a skills section
- Check that the job description has clear skill requirements

## Contributing

Feel free to improve this project!Here are some ideas:

- Add support for Word documents (.docx)
- Improve matching algorithm with fuzzy matching
- Add more detailed suggestions
- Include skill categories (soft skills, technical skills)
- Add export to PDF feature

## License

MIT License - Feel free to use this project for learning and development.

## Acknowledgments

- PyPDF2 for PDF text extraction
- Flask for the backend API
- Built with ❤️ for beginners
