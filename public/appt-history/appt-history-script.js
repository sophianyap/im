// appt-history-script.js

document.addEventListener('DOMContentLoaded', function() {
    const sessionId = localStorage.getItem('current_session_id');
    const patientId = localStorage.getItem('current_patient_id');
    
    // Update the date display
    updateDateDisplay();
    
    // Fetch session details if both IDs are available
    if (sessionId && patientId) {
        fetchSessionDetails(sessionId, patientId);
    } else {
        displayError('Missing session or patient information');
    }
    
    // Set up event listeners for any interactive elements
    setupEventListeners();
});

/**
 * Updates the date display on the page
 */
function updateDateDisplay() {
    const dateElement = document.querySelector('.date-today-ds');
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = now.toLocaleDateString('en-US', options);
}

/**
 * Fetches session details from the API
 * @param {string} sessionId - The session ID
 * @param {string} patientId - The patient ID
 */
function fetchSessionDetails(sessionId, patientId) {
    // Show loading state
    document.querySelector('.service-card').innerHTML = '<div class="loading">Loading session details...</div>';
    
    // Fetch session details from API
    fetch(`/api/patient-session?sessionId=${sessionId}&patientId=${patientId}`)
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.message || 'Failed to fetch session details'); });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                populateSessionDetails(data.data);
            } else {
                throw new Error(data.message || 'Unknown error occurred');
            }
        })
        .catch(error => {
            displayError(error.message);
        });
}

/**
 * Populates the UI with session details
 * @param {Object} session - The session data
 */
function populateSessionDetails(session) {
    // Update page title with patient name
    document.querySelector('#title-name').textContent = session.patientName;
    
    // Build the service card content
    let serviceContent = '';
    
    // Add services
    session.services.forEach(service => {
        serviceContent += `
            <div class="service-line">
                <input class="tooth-input" value="${service.toothNumber}" readonly> 
                <div class="service-title-container">
                    ${service.serviceName}
                </div>
                <span class="divider2">|</span>
                <select name="remark" id="remarks" disabled>
                    <option value="complete" ${service.status === 'Complete' ? 'selected' : ''}>Complete</option>
                    <option value="incomplete" ${service.status === 'Incomplete' ? 'selected' : ''}>Incomplete</option>
                </select>
            </div>
        `;
    });
    
    // Add tooth chart section
    serviceContent += `
        <div class="tooth-chart">
            <div class="service-title-container">
                <h3>TOOTH CHART</h3> 
            </div> 
            <div>
                <img src="${session.toothChart ? 'data:image/png;base64,' + arrayBufferToBase64(session.toothChart.chartData) : ''}" 
                     alt="tooth-chart" id="tooth-chart-img">
            </div>
        </div>
    `;
    
    // Add remarks section
    serviceContent += `
        <div class="service-title-container">
            <h3 id="service-title">FINAL REMARKS</h3>
        </div>
        <!-- Add the remarks image if available -->
        <div>
            <img src="${session.remarksImage ? 'data:image/png;base64,' + arrayBufferToBase64(session.remarksImage) : ''}" 
                 alt="session_remarks_image" id="session_remarks_image">
        </div>
        <div class="final-remarks-text">
            <h3 id="remark">REMARKS:</h3>
            <div class="remarks-text">
                "${session.remarks}"
            </div>
        </div>
    `;
    
    // Add billing and prescription button
    serviceContent += `
        <div class="bottom-line">
            <a id="check-out-container2" href="/old-billing/">
                <button id="check-out-btn2">
                    See Billing & Prescription
                </button>
            </a>
        </div>
    `;
    
    // Update the service card
    document.querySelector('.service-card').innerHTML = serviceContent;

    localStorage.setItem('current_session_id',session.sessionId);
    localStorage.setItem('current_patient_id',session.patientId);
    
    // Initialize any components that need JS after DOM update
    initializeComponents();
}

/**
 * Initializes any components that need JavaScript after DOM update
 */
function initializeComponents() {
    // Initialize canvas for final remarks if needed
    const canvas = document.getElementById('final-remarks');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        // Set canvas size to match its container
        const container = canvas.parentElement;
        canvas.width = container.offsetWidth * 0.9;
        canvas.height = 80;
        
        // Draw a border or background
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
    }
}

/**
 * Sets up event listeners for interactive elements
 */
function setupEventListeners() {
    // Example: Add click event to the back button
    const backButton = document.getElementById('home-button');
    if (backButton) {
        backButton.addEventListener('click', function(e) {
            // If you need to handle the back action in JavaScript
            // e.preventDefault();
            // window.history.back();
        });
    }
}

/**
 * Displays an error message on the page
 * @param {string} message - The error message to display
 */
function displayError(message) {
    document.querySelector('.service-card').innerHTML = `
        <div class="error-message">
            <p>${message}</p>
            <button onclick="window.history.back()">Go Back</button>
        </div>
    `;
}

/**
 * Converts an ArrayBuffer to a base64 string
 * @param {ArrayBuffer} buffer - The array buffer to convert
 * @returns {string} The base64 string
 */
function arrayBufferToBase64(buffer) {
    if (!buffer) return '';
    
    // Convert ArrayBuffer to Uint8Array
    const bytes = new Uint8Array(buffer.data || buffer);
    
    // Convert byte array to base64 string
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

setTimeout(() => {
    document.getElementById("loading-overlay").style.display = "none";
  }, 1000);