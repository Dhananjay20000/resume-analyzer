/**
 * Resume Analyzer - Frontend JavaScript
 * Handles file upload, API communication, and UI updates
 */

// ============================================
// Configuration
// ============================================

const CONFIG = {
    // Backend API URL
    API_URL: 'http://localhost:5000/api/analyze',
    
    // Health check URL
    HEALTH_URL: 'http://localhost:5000/api/health',
    
    // UI Settings
    MAX_FILE_SIZE: 16 * 1024 * 1024, // 16MB
    ALLOWED_FILE_TYPE: 'application/pdf',
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000, // ms
};

// ============================================
// DOM Elements
// ============================================

const elements = {
    // File upload
    resumeFile: document.getElementById('resumeFile'),
    fileName: document.getElementById('fileName'),
    
    // Job description
    jobDescription: document.getElementById('jobDescription'),
    
    // Button
    analyzeButton: document.getElementById('analyzeButton'),
    
    // Loading & Error
    loadingIndicator: document.getElementById('loadingIndicator'),
    errorMessage: document.getElementById('errorMessage'),
    
    // Results
    resultsSection: document.getElementById('resultsSection'),
    matchPercentage: document.getElementById('matchPercentage'),
    progressFill: document.getElementById('progressFill'),
    matchMessage: document.getElementById('matchMessage'),
    matchedSkills: document.getElementById('matchedSkills'),
    missingSkills: document.getElementById('missingSkills'),
    suggestionsList: document.getElementById('suggestionsList'),
};

// ============================================
// State
// ============================================

let state = {
    isProcessing: false,
    selectedFile: null,
};

// ============================================
// Utility Functions
// ============================================

/**
 * Show error message
 */
function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorMessage.classList.remove('hidden');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        elements.errorMessage.classList.add('hidden');
    }, 5000);
}

/**
 * Hide error message
 */
function hideError() {
    elements.errorMessage.classList.add('hidden');
}

/**
 * Show loading indicator
 */
function showLoading() {
    elements.loadingIndicator.classList.remove('hidden');
    elements.resultsSection.classList.add('hidden');
    elements.analyzeButton.disabled = true;
}

/**
 * Hide loading indicator
 */
function hideLoading() {
    elements.loadingIndicator.classList.add('hidden');
    elements.analyzeButton.disabled = false;
}

/**
 * Validate file
 */
function validateFile(file) {
    // Check if file exists
    if (!file) {
        showError('Please select a PDF file.');
        return false;
    }
    
    // Check file type
    if (file.type !== CONFIG.ALLOWED_FILE_TYPE && !file.name.toLowerCase().endsWith('.pdf')) {
        showError('Please upload a PDF file.');
        return false;
    }
    
    // Check file size
    if (file.size > CONFIG.MAX_FILE_SIZE) {
        showError('File is too large. Maximum size is 16MB.');
        return false;
    }
    
    return true;
}

/**
 * Validate job description
 */
function validateJobDescription(text) {
    if (!text || text.trim().length < 10) {
        showError('Please enter a job description (at least 10 characters).');
        return false;
    }
    
    return true;
}

/**
 * Format skill name for display
 */
function formatSkillName(skill) {
    // Capitalize first letter of each word
    return skill
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// ============================================
// Event Handlers
// ============================================

/**
 * Handle file selection
 */
function handleFileSelect(event) {
    const file = event.target.files[0];
    
    if (file) {
        state.selectedFile = file;
        
        // Update display
        elements.fileName.textContent = file.name;
        
        // Validate file
        if (!validateFile(file)) {
            elements.resumeFile.value = '';
            state.selectedFile = null;
            elements.fileName.textContent = 'Choose PDF file...';
        }
    }
}

/**
 * Handle analyze button click
 */
async function handleAnalyzeClick() {
    // Prevent multiple clicks
    if (state.isProcessing) return;
    
    // Hide previous results and errors
    hideError();
    elements.resultsSection.classList.add('hidden');
    
    // Validate inputs
    if (!validateFile(state.selectedFile)) {
        return;
    }
    
    const jobDescription = elements.jobDescription.value.trim();
    if (!validateJobDescription(jobDescription)) {
        return;
    }
    
    // Start processing
    state.isProcessing = true;
    showLoading();
    
    // Create form data
    const formData = new FormData();
    formData.append('file', state.selectedFile);
    formData.append('job_description', jobDescription);
    
// Send to API with retry logic
    let lastError;
    for (let attempt = 0; attempt < CONFIG.MAX_RETRIES; attempt++) {
        try {
            console.log(`Attempt ${attempt + 1}: Sending request to ${CONFIG.API_URL}`);
            
            const response = await fetch(CONFIG.API_URL, {
                method: 'POST',
                body: formData,
            });
            
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers.get('content-type'));
            
            // Check content type first
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                // Not JSON - likely an error page
                const text = await response.text();
                console.error('Non-JSON response:', text.substring(0, 200));
                throw new Error('Server returned an error. Make sure the backend is running on http://localhost:5000');
            }
            
            const data = await response.json();
            
            // Check for errors
            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Analysis failed. Please try again.');
            }
            
            // Display results
            displayResults(data);
            
            // Success - exit retry loop
            state.isProcessing = false;
            hideLoading();
            return;
            
        } catch (error) {
            console.error('Attempt error:', error);
            lastError = error;
            
            // Wait before retry
            if (attempt < CONFIG.MAX_RETRIES - 1) {
                await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
            }
        }
    }
    
    // All retries failed
    state.isProcessing = false;
    hideLoading();
    
    // Provide more helpful error message
    if (lastError.message.includes('Failed to fetch') || lastError.message.includes('NetworkError')) {
        showError('Cannot connect to backend. Make sure the Flask server is running: python backend/app.py');
    } else {
        showError(lastError.message || 'Failed to analyze resume. Please try again.');
    }
}

/**
 * Display analysis results
 */
function displayResults(data) {
    // Display match percentage
    const percentage = data.match_percentage || 0;
    elements.matchPercentage.textContent = percentage + '%';
    elements.progressFill.style.width = percentage + '%';
    
    // Set progress bar color based on percentage
    let message = '';
    if (percentage >= 80) {
        message = 'Excellent match! You have most of the required skills.';
    } else if (percentage >= 60) {
        message = 'Good match! You have several key skills.';
    } else if (percentage >= 40) {
        message = 'Moderate match. Consider adding more skills.';
    } else {
        message = 'Low match. Focus on acquiring key skills.';
    }
    elements.matchMessage.textContent = message;
    
    // Display matched skills
    elements.matchedSkills.innerHTML = '';
    const matchedSkills = data.matched_skills || [];
    
    if (matchedSkills.length > 0) {
        matchedSkills.forEach(skill => {
            const tag = document.createElement('span');
            tag.className = 'skill-tag';
            tag.textContent = formatSkillName(skill);
            elements.matchedSkills.appendChild(tag);
        });
    } else {
        const noSkills = document.createElement('span');
        noSkills.className = 'skill-tag';
        noSkills.textContent = 'No matches';
        elements.matchedSkills.appendChild(noSkills);
    }
    
    // Display missing skills
    elements.missingSkills.innerHTML = '';
    const missingSkills = data.missing_skills || [];
    
    if (missingSkills.length > 0) {
        missingSkills.forEach(skill => {
            const tag = document.createElement('span');
            tag.className = 'skill-tag';
            tag.textContent = formatSkillName(skill);
            elements.missingSkills.appendChild(tag);
        });
    } else {
        const noMissing = document.createElement('span');
        noMissing.className = 'skill-tag';
        noMissing.textContent = 'None - Perfect match!';
        elements.missingSkills.appendChild(noMissing);
    }
    
    // Display suggestions
    elements.suggestionsList.innerHTML = '';
    const suggestions = data.suggestions || [];
    
    if (suggestions.length > 0) {
        suggestions.forEach(suggestion => {
            const li = document.createElement('li');
            li.textContent = suggestion;
            elements.suggestionsList.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.textContent = 'No suggestions at this time.';
        elements.suggestionsList.appendChild(li);
    }
    
    // Show results section
    elements.resultsSection.classList.remove('hidden');
    
    // Scroll to results
    elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================
// Initialization
// ============================================

/**
 * Initialize the application
 */
function init() {
    console.log('📄 Initializing Resume Analyzer...');
    
    // Set up event listeners
    elements.resumeFile.addEventListener('change', handleFileSelect);
    elements.analyzeButton.addEventListener('click', handleAnalyzeClick);
    
    // Check API health (optional)
    checkHealth();
    
    console.log('📄 Resume Analyzer initialized');
}

/**
 * Check API health
 */
async function checkHealth() {
    try {
        const response = await fetch(CONFIG.HEALTH_URL);
        if (response.ok) {
            console.log('✅ API server is healthy');
        }
    } catch (error) {
        console.warn('⚠️ Could not connect to API server. Make sure the backend is running.');
    }
}

// ============================================
// Start Application
// ============================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
