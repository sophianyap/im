const canvas = document.getElementById("final-remarks");
const ctx = canvas.getContext("2d");
resize();

// last known position
var pos = { x: 0, y: 0 };

window.addEventListener('resize', resize);
document.addEventListener('mousemove', draw);
document.addEventListener('mousedown', setPosition);
document.addEventListener('mouseenter', setPosition);

// Add touch event listeners
document.addEventListener('touchmove', draw);
document.addEventListener('touchstart', setPosition);

// new position from mouse or touch event
function setPosition(e) {
    if (e.touches) {
        // Handle touch event
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        pos.x = touch.clientX - rect.left;
        pos.y = touch.clientY - rect.top;
    } else {
        // Handle mouse event
        pos.x = e.offsetX;
        pos.y = e.offsetY;
    }
}

// resize canvas
function resize() {
    //
    const bounding = canvas.getBoundingClientRect();

    ctx.canvas.width = bounding.width;
    ctx.canvas.height = bounding.height;
}

function draw(e) {
    const bounding = canvas.getBoundingClientRect();
    var canvasStartX = bounding.x;
    var canvasStartY = bounding.y;

    var canvasEndX = bounding.x + bounding.width;
    var canvasEndY = bounding.y + bounding.height;

    // Check if it's a touch event or mouse event
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    // Check if the event is within the canvas bounds
    if ((clientX < canvasStartX || clientX > canvasEndX)) return;
    if ((clientY < canvasStartY || clientY > canvasEndY)) return;

    // Check if the mouse button is pressed or if it's a touch event
    if (e.buttons !== 1 && !e.touches) return;

    ctx.beginPath(); // begin

    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#c0392b';

    ctx.moveTo(pos.x, pos.y); // from
    setPosition(e);
    ctx.lineTo(pos.x, pos.y); // to

    ctx.stroke(); // draw it!
}

// Prevent scrolling when touching the canvas
document.body.addEventListener('touchstart', function (e) {
    if (e.target === canvas) {
        e.preventDefault();
    }
}, { passive: false });
document.body.addEventListener('touchend', function (e) {
    if (e.target === canvas) {
        e.preventDefault();
    }
}, { passive: false });
document.body.addEventListener('touchmove', function (e) {
    if (e.target === canvas) {
        e.preventDefault();
    }
}, { passive: false });

// Function to add a new medical condition input field
function addMedicalCondition() {
    const medicalConditionsContainer = document.querySelector('.medical-hstry1 .info-title1');
    const newCondition = document.createElement('div');
    newCondition.classList.add('medical-condition-card');
    newCondition.innerHTML = `
        <button class="remove-condition">x</button>
        <input type="text" class="med-input">
    `;
    medicalConditionsContainer.appendChild(newCondition);

    // Add event listener to the new remove button
    newCondition.querySelector('.remove-condition').addEventListener('click', function() {
        medicalConditionsContainer.removeChild(newCondition);
    });
}

// Modified to return a promise that resolves with the service data
function getServices() {
    return fetch(`/api/get-services-offered`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .catch(error => {
        console.error('Error:', error);
        alert(`Error: ${error}`);
        return []; // Return empty array in case of error
    });
}

async function addNewServiceLine() {
    const newServiceLineDiv = document.createElement('div');
    newServiceLineDiv.className = 'service-line';

    const delServiceButton = document.createElement('button');
    delServiceButton.id = 'delete-service';
    delServiceButton.innerHTML = 'x';

    const toothInput = document.createElement('input');
    toothInput.className = 'tooth-input';
    toothInput.id = 'toothInput'
    toothInput.placeholder = 'Tooth';

    const serviceDropdown = document.createElement('select');
    serviceDropdown.name = 'service';
    serviceDropdown.id = 'service';
    serviceDropdown.ariaPlaceholder = 'SERVICE';
    serviceDropdown.innerHTML = `<option value="" disabled selected>SERVICE</option>`;
    
    try {
        // Wait for the services data to be fetched
        const services = await getServices();
        
        if (services && services.length > 0) {
            services.forEach((element) => {
                const optionElement = document.createElement('option');
                optionElement.value = element.service_offered_id;
                optionElement.innerHTML = element.service_offered_name;
                serviceDropdown.appendChild(optionElement);
            });
        }
    } catch (error) {
        console.error('Failed to load services:', error);
    }

    const divider = document.createElement('span');
    divider.className = 'divider2';
    divider.innerHTML=`|`;

    const remarkDropdown = document.createElement('select');
    remarkDropdown.name = 'remark';
    remarkDropdown.id = 'remarks';
    remarkDropdown.innerHTML = `<option value="Complete">Complete</option>
                            <option value="Incomplete">Incomplete</option>`;

    delServiceButton.onclick = () => {
        newServiceLineDiv.parentElement.removeChild(newServiceLineDiv);
    }
    // Add all
    newServiceLineDiv.appendChild(delServiceButton);
    newServiceLineDiv.appendChild(toothInput);
    newServiceLineDiv.appendChild(serviceDropdown);
    newServiceLineDiv.appendChild(divider);
    newServiceLineDiv.appendChild(remarkDropdown);

    document.getElementById('service-line-container').appendChild(newServiceLineDiv);
}

document.getElementById('check-out-btn').addEventListener("click", () => {
    const patientId = localStorage.getItem("current_patient_id");
    if (!patientId) return;

    const serviceValues = [];

    document.querySelectorAll('#service-line-container .service-line').forEach((element) => {
        const toothInput = element.querySelector('#toothInput').value;
        const serviceDropdown = element.querySelector('#service').value;
        const remarkDropdown = element.querySelector('#remarks').value;

        serviceValues.push({
            serviceId: serviceDropdown,
            tooth: toothInput,
            remarkId: remarkDropdown
        });
    });

    // Get tooth chart image if available
    const toothChartImg = document.getElementById('tooth-chart-img');
    const toothChartImageData = toothChartImg ? toothChartImg.src : null;

    const currentServiceInfo = {
        patient_id: patientId,
        service_values: serviceValues,
        session_remarks_image: canvas.toDataURL("image/png"),
        session_remarks: document.getElementById('remarks-text-input').value,
        tooth_chart_image: toothChartImageData
    }

    localStorage.setItem('current_service_info', JSON.stringify(currentServiceInfo));
});

function loadCurrentServiceInfo() {
    const storedData = localStorage.getItem('current_service_info');
    const patientId = localStorage.getItem("current_patient_id");
    
    if (!storedData) {
        console.warn('No service information found in localStorage.');
        return;
    }

    try {
        const parsedData = JSON.parse(storedData);

        if (parsedData.patient_id != patientId) {
            console.log(parsedData.patient_id);
            console.log(patientId);
            console.warn('Mismatch between patient_id and stored patient id.');
            addNewServiceLine();
            return;
        }

        console.log(parsedData);

        // Repopulate service lines
        if (parsedData.service_values && parsedData.service_values.length) {
            const container = document.getElementById('service-line-container');
            container.innerHTML = ''; // Clear existing entries

            // Load services dynamically and populate each service entry
            getServices().then(services => {
                parsedData.service_values.forEach(service => {
                    const newServiceLineDiv = document.createElement('div');
                    newServiceLineDiv.className = 'service-line';
            
                    const delServiceButton = document.createElement('button');
                    delServiceButton.id = 'delete-service';
                    delServiceButton.innerHTML = 'x';
            
                    const toothInput = document.createElement('input');
                    toothInput.className = 'tooth-input';
                    toothInput.id = 'toothInput';
                    toothInput.value = service.tooth;
            
                    const serviceDropdown = document.createElement('select');
                    serviceDropdown.name = 'service';
                    serviceDropdown.id = 'service';
                    serviceDropdown.innerHTML = `<option value="" disabled>SERVICE</option>`;
            
                    if (services && services.length > 0) {
                        services.forEach(element => {
                            const optionElement = document.createElement('option');
                            optionElement.value = String(element.service_offered_id); // Ensuring string consistency
                            optionElement.innerHTML = element.service_offered_name;
                            serviceDropdown.appendChild(optionElement);
            
                            // Ensure correct selection
                            if (String(element.service_offered_id) === String(service.serviceId)) {
                                optionElement.selected = true;
                            }
                        });
                    }
            
                    const divider = document.createElement('span');
                    divider.className = 'divider2';
                    divider.innerHTML = '|';
            
                    const remarkDropdown = document.createElement('select');
                    remarkDropdown.name = 'remark';
                    remarkDropdown.id = 'remarks';
                    remarkDropdown.innerHTML = `<option value="complete">Complete</option>
                                                <option value="incomplete">Incomplete</option>`;
                    remarkDropdown.value = service.remarkId;
            
                    delServiceButton.onclick = () => {
                        newServiceLineDiv.parentElement.removeChild(newServiceLineDiv);
                    };
            
                    newServiceLineDiv.appendChild(delServiceButton);
                    newServiceLineDiv.appendChild(toothInput);
                    newServiceLineDiv.appendChild(serviceDropdown);
                    newServiceLineDiv.appendChild(divider);
                    newServiceLineDiv.appendChild(remarkDropdown);
            
                    document.getElementById('service-line-container').appendChild(newServiceLineDiv);
                });
            });
            
        }

        // Repopulate remarks text
        if (parsedData.final_remarks_text) {
            document.getElementById('remarks-text-input').value = parsedData.final_remarks_text;
        }

        // Optional: Redraw the canvas if needed
        if (parsedData.final_remarks_canvas) {
            const img = new Image();
            img.src = parsedData.final_remarks_canvas;
            img.onload = () => {
                const canvas = document.getElementById("final-remarks");
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
            };
        }
    } catch (error) {
        console.error('Error parsing service information from localStorage:', error);
    }
}

// Get the add tooth chart button
const addToothChartBtn = document.getElementById('add-toothchart');
// Create a file input element for selecting images
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = 'image/*';
fileInput.style.display = 'none';
document.body.appendChild(fileInput);

let toothChartAdded = false;

// Function to create tooth chart div
function createToothChartDiv(imageUrl) {
    // Create tooth chart div structure
    const toothChartDiv = document.createElement('div');
    toothChartDiv.className = 'tooth-chart';

    // Create title container
    const titleContainer = document.createElement('div');
    titleContainer.className = 'service-title-container';
    
    // Add title
    const title = document.createElement('h3');
    title.textContent = 'TOOTH CHART';
    
    // Add delete button
    const deleteButton = document.createElement('button');
    deleteButton.id = 'delete-tooth-chart';
    deleteButton.textContent = 'X';
    deleteButton.addEventListener('click', removeToothChart);
    
    // Add title and delete button to container
    titleContainer.appendChild(title);
    titleContainer.appendChild(deleteButton);
    
    // Create image container
    const imageContainer = document.createElement('div');
    
    // Create and set image element
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = 'tooth-chart';
    img.id = 'tooth-chart-img';
    
    // Add image to container
    imageContainer.appendChild(img);
    
    // Add all elements to tooth chart div
    toothChartDiv.appendChild(titleContainer);
    toothChartDiv.appendChild(imageContainer);
    
    // Insert the tooth chart at the proper position in the service card
    const serviceCard = document.querySelector('.service-card');
    const finalRemarksSection = document.querySelector('.service-card .service-title-container:nth-of-type(1)');
    
    // Check if service line container exists and insert after it
    const serviceLineContainer = document.getElementById('service-line-container');
    if (serviceLineContainer) {
        serviceCard.insertBefore(toothChartDiv, serviceLineContainer.nextSibling);
    } else {
        // If service line container not found, just append to service card
        serviceCard.appendChild(toothChartDiv);
    }
    
    // Update button text and state
    addToothChartBtn.textContent = 'REMOVE TOOTH CHART';
    toothChartAdded = true;
    
    // Save tooth chart image to localStorage
    saveToothChartToLocalStorage(imageUrl);
}

// Function to handle file selection
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            createToothChartDiv(event.target.result);
        };
        reader.readAsDataURL(file);
    }
}

// Function to remove tooth chart
function removeToothChart() {
    const toothChart = document.querySelector('.tooth-chart');
    if (toothChart) {
        toothChart.parentElement.removeChild(toothChart);
        addToothChartBtn.textContent = 'ADD TOOTH CHART';
        toothChartAdded = false;
        
        // Remove tooth chart from localStorage
        removeToothChartFromLocalStorage();
    }
}

// Function to save tooth chart to localStorage
function saveToothChartToLocalStorage(imageUrl) {
    const patientId = localStorage.getItem("current_patient_id");
    if (!patientId) return;
    
    let currentServiceInfo = JSON.parse(localStorage.getItem('current_service_info') || '{}');
    
    // Add tooth chart to current service info
    currentServiceInfo.patient_id = patientId;
    currentServiceInfo.tooth_chart_image = imageUrl;
    
    localStorage.setItem('current_service_info', JSON.stringify(currentServiceInfo));
}

// Function to remove tooth chart from localStorage
function removeToothChartFromLocalStorage() {
    const currentServiceInfo = JSON.parse(localStorage.getItem('current_service_info') || '{}');
    
    if (currentServiceInfo.tooth_chart_image) {
        delete currentServiceInfo.tooth_chart_image;
        localStorage.setItem('current_service_info', JSON.stringify(currentServiceInfo));
    }
}

// Function to load tooth chart from localStorage
function loadToothChartFromLocalStorage() {
    const currentServiceInfo = JSON.parse(localStorage.getItem('current_service_info') || '{}');
    const patientId = localStorage.getItem("current_patient_id");
    
    if (currentServiceInfo.patient_id === patientId && currentServiceInfo.tooth_chart_image) {
        createToothChartDiv(currentServiceInfo.tooth_chart_image);
    }
}

// Check if tooth chart exists on the page and update button accordingly
function checkForExistingToothChart() {
    const toothChart = document.querySelector('.tooth-chart');
    if (toothChart) {
        addToothChartBtn.textContent = 'REMOVE TOOTH CHART';
        toothChartAdded = true;
    } else {
        addToothChartBtn.textContent = 'ADD TOOTH CHART';
        toothChartAdded = false;
    }
}

// Add event listeners
fileInput.addEventListener('change', handleFileSelect);

addToothChartBtn.addEventListener('click', function() {
    if (!toothChartAdded) {
        fileInput.click();
    } else {
        removeToothChart();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Keep the existing functionality
    document.getElementById('add-servicebtn').onclick = addNewServiceLine;
    document.getElementById('clear-btn').onclick = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    // Remove the existing tooth chart div if specified in the original code
    // This was in the original code, but may not be needed based on your page structure
    const existingToothChart = document.querySelector('.tooth-chart');
    if (existingToothChart) {
        existingToothChart.parentElement.removeChild(existingToothChart);
    }
    
    const storedData = localStorage.getItem('current_service_info');
    if (storedData) {
        loadCurrentServiceInfo();
        loadToothChartFromLocalStorage();
    } else {
        // Add 1 service line
        addNewServiceLine();
    }

    // Check for existing tooth chart and update button state
    checkForExistingToothChart();

    setTimeout(() => {
        document.getElementById("loading-overlay").style.display = "none";
    }, 1000);
});