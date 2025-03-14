document.addEventListener('DOMContentLoaded', () => {
    loadBillingData();
    
    // Add prescription button functionality
    document.getElementById('add-prescription').addEventListener('click', addPrescriptionRow);
    
    // Save data button functionality
    document.getElementById('save-data').addEventListener('click', saveData);
    
    // Add remove prescription functionality to existing button
    setupRemovePrescriptionButtons();

    setTimeout(() => {
        document.getElementById("loading-overlay").style.display = "none";
    }, 1000);
    
    // Update the date
    updateCurrentDate();
});

/**
 * Setup event listeners for remove prescription buttons
 */
function setupRemovePrescriptionButtons() {
    document.querySelectorAll('.remove-prescription').forEach(button => {
        button.addEventListener('click', function() {
            this.closest('tr').remove();
        });
    });
}

/**
 * Update the current date in the header
 */
function updateCurrentDate() {
    const dateElement = document.querySelector('.date-today-ds');
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const now = new Date();
    const dayName = days[now.getDay()];
    const monthName = months[now.getMonth()];
    const date = now.getDate();
    const year = now.getFullYear();
    
    dateElement.textContent = `${dayName}- ${monthName} ${date < 10 ? '0' + date : date}, ${year}`;
}

/**
 * Loads the billing data from localStorage and populates the billing table
 */
function loadBillingData() {
    const storedData = localStorage.getItem('current_service_info');
    
    if (!storedData) {
        console.warn('No service information found in localStorage.');
        return;
    }
    
    try {
        const parsedData = JSON.parse(storedData);

        console.log(parsedData);
        const serviceValues = parsedData.service_values;
        
        if (!serviceValues || serviceValues.length === 0) {
            console.warn('No service values found in stored data.');
            return;
        }
        
        // Get the billing table body
        const billingTableBody = document.getElementById('billing-body');
        billingTableBody.innerHTML = ''; // Clear existing entries
        
        // Get services for translating IDs to names
        getServices().then(services => {
            // Create a row for each service
            serviceValues.forEach(service => {
                const serviceName = getServiceName(services, service.serviceId);
                const newRow = createBillingRow(serviceName, service.serviceId);
                billingTableBody.appendChild(newRow);
            });
        }).catch(error => {
            console.error('Error loading services:', error);
        });
        
    } catch (error) {
        console.error('Error parsing service information from localStorage:', error);
    }
}

/**
 * Get service name from service ID
 */
function getServiceName(services, serviceId) {
    const service = services.find(s => String(s.service_offered_id) === String(serviceId));
    return service ? service.service_offered_name : 'Unknown Service';
}

/**
 * Creates a new billing table row
 */
function createBillingRow(serviceName, serviceId) {
    const tr = document.createElement('tr');
    tr.className = 'table-row';
    
    tr.innerHTML = `
        <td class="table-data">${serviceName}</td>
        <td class="table-data">₱<input class="input-billing" placeholder="0.00"></td>
        <td class="table-data">₱<input class="input-billing" placeholder="0.00"></td>
        <td class="table-data">₱0.00</td>
        <td class="table-data">
            <select name="service" id="status">
                <option value="PAID">PAID</option>
                <option value="UNPAID" selected>UNPAID</option>
            </select>
        </td>
    `;
    
    // Add event listener to calculate balance
    const feeInput = tr.querySelectorAll('.input-billing')[0];
    const tenderedInput = tr.querySelectorAll('.input-billing')[1];
    const balanceCell = tr.querySelectorAll('.table-data')[3];
    const statusSelect = tr.querySelector('#status');
    
    function updateBalance() {
        const fee = parseFloat(feeInput.value) || 0;
        const tendered = parseFloat(tenderedInput.value) || 0;
        const balance = fee - tendered;
        
        balanceCell.textContent = `₱${balance.toFixed(2)}`;
        
        // Auto-update payment status
        if (balance <= 0 && fee > 0) {
            statusSelect.value = 'PAID';
        } else if (fee > 0) {
            statusSelect.value = 'UNPAID';
        }
    }
    
    feeInput.addEventListener('input', updateBalance);
    tenderedInput.addEventListener('input', updateBalance);

    tr.dataset.serviceId = serviceId;  // Ensure serviceId is stored in the row
    
    return tr;
}

/**
 * Adds a new prescription row to the prescription table
 */
function addPrescriptionRow() {
    const prescriptionTableBody = document.getElementById('medication-body');
    
    const tr = document.createElement('tr');
    tr.className = 'table-row';
    
    tr.innerHTML = `
        <td><button class="remove-prescription">x</button></td>
        <td class="table-data"><input class="input-billing"></td>
        <td class="table-data"><input class="input-billing"></td>
        <td class="table-data"><input class="input-billing"></td>
    `;
    
    // Add event listener for remove button
    const removeButton = tr.querySelector('.remove-prescription');
    removeButton.addEventListener('click', function() {
        tr.remove();
    });
    
    prescriptionTableBody.appendChild(tr);
}

/**
 * Save billing and prescription data
 */
function saveData() {
    // Get all prescription rows
    const prescriptionRows = document.getElementById('medication-body').querySelectorAll('tr');
    const prescriptions = [];
    
    prescriptionRows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        if (inputs.length > 0 && inputs[0].value.trim() !== '') { // Only save if medication name is provided
            prescriptions.push({
                medication: inputs[0].value,
                dosage: inputs[1].value,
                frequencyDuration: inputs[2].value
            });
        }
    });
    
    // Get all billing rows
    const billingRows = document.getElementById('billing-body').querySelectorAll('tr');
    const billings = [];
    
    billingRows.forEach(row => {
        const serviceCells = row.querySelectorAll('.table-data');
        if (serviceCells.length > 0) {
            const serviceName = serviceCells[0].textContent;
            const serviceId = row.dataset.serviceId;  // Get serviceId from data attribute
            const inputs = row.querySelectorAll('input');
            const fee = inputs[0].value;
            const tendered = inputs[1].value;
            const balance = serviceCells[3].textContent.replace('₱', '');
            const status = row.querySelector('select').value;
            
            billings.push({
                serviceName,
                service_offered_id: serviceId,  // Include service_offered_id
                fee,
                tendered,
                balance,
                status
            });
        }
    });

    // Get current service info and update it
    const storedData = localStorage.getItem('current_service_info');
    
    if (storedData) {
        try {
            const parsedData = JSON.parse(storedData);

            // Merge service_values and billings into a single array
            const mergedServiceValues = parsedData.service_values.map(service => {
                const billing = billings.find(b => b.service_offered_id === service.serviceId);
                return {
                    ...service,
                    ...billing
                };
            });

            // Update the parsedData with the merged service values
            parsedData.service_values = mergedServiceValues;
            parsedData.prescriptions = prescriptions;

            // Save back to localStorage
            localStorage.setItem('current_service_info', JSON.stringify(parsedData));
            
            // Provide feedback to user
            alert('Billing and prescription data saved successfully!');
            
        } catch (error) {
            console.error('Error updating service information:', error);
            alert('Error saving data. Please try again.');
        }
    } else {
        console.warn('No service information found in localStorage.');
        alert('No service information found. Please create a service record first.');
    }

    // Send the updated data to the backend
    fetch('/api/store-session-data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: localStorage.getItem('current_service_info')
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Session data saved successfully!');
        } else {
            alert('Error: ' + data.error);
        }
    
        localStorage.clear();
        window.location.href = '/';
    })
    .catch(error => {
        console.error('Error saving session data:', error);
        alert('Error saving session data. Please try again.');
    });
}

/**
 * Get services from API
 */
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