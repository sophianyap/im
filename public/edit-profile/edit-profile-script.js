document.addEventListener('DOMContentLoaded', () => {
    const patientId = localStorage.getItem("current_patient_id");
    
    if (!patientId) {
        console.error('No patient ID found in the local storage.');
        return;
    }
    
    // Fetch patient data to pre-fill the form
    fetchPatientData(patientId);

    document.getElementById('save-button').addEventListener('click', () => {
        savePatientData(patientId);
    })
    
    // Set up cancel button
    const cancelButton = document.getElementById('cancel-edit');
    if (cancelButton) {
        cancelButton.addEventListener('click', () => {
            window.location.href = `/patient-info/index.html?patient-id=${patientId}`;
        });
    }
    
    // Set up medical condition and medication add buttons
    const addConditionBtn = document.getElementById('add-condition');
    if (addConditionBtn) {
        addConditionBtn.addEventListener('click', () => addListItem('conditions-list', 'condition'));
    }
    
    const addMedicationBtn = document.getElementById('add-medication');
    if (addMedicationBtn) {
        addMedicationBtn.addEventListener('click', () => addListItem('medications-list', 'medication'));
    }

    setTimeout(() => {
        document.getElementById("loading-overlay").style.display = "none";
    }, 1000);
});

function fetchPatientData(patientId) {
    fetch(`/api/get-patients?id=${patientId}`, {
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
    .then(patient => {
        populateForm(patient);
    })
    .catch(error => {
        console.error('Error fetching patient data:', error);
        alert(`Error fetching patient data: ${error.message}`);
    });
}

function populateForm(patient) {

    console.log(patient);
    // Patient basic info
    document.getElementById('patient-first-name').value = patient.firstName || '';
    document.getElementById('patient-middle-name').value = patient?.middleName || '';
    document.getElementById('patient-last-name').value = patient.lastName || '';
    document.getElementById('patient-mobile').value = patient.mobile || '';
    document.getElementById('patient-birthdate').value = patient.birthdate  ;
    document.getElementById('patient-occupation').value = patient.occupation || '';

    document.getElementById('gender-title').value = patient.gender;
    document.getElementById('gender-title').selected = patient.gender;

    document.getElementById('patient-company').value = patient.company || '';
    document.getElementById('patient-city').value = patient.address?.city_name || '';
    document.getElementById('patient-barangay').value = patient.address?.barangay_name || '';
    document.getElementById('patient-street').value = patient.address?.street_name || '';

    document.getElementById('status-title').value = patient.civilStatus;
    document.getElementById('status-title').selected = patient.civilStatus;
    
    // Medical conditions
    const conditionsList = document.getElementById('conditions-list');
    if (conditionsList) {
        conditionsList.innerHTML = '';
        if (patient.medicalConditions && patient.medicalConditions.length > 0) {
            patient.medicalConditions.forEach(condition => {
                addListItem('conditions-list', 'condition', condition);
            });
        } else {
            addListItem('conditions-list', 'condition', '');
        }
    }
    
    // Medications
    const medicationsList = document.getElementById('medications-list');
    if (medicationsList) {
        medicationsList.innerHTML = '';
        if (patient.medicalHistory && patient.medicalHistory.length > 0) {
            patient.medicalHistory.forEach(medication => {
                addListItem('medications-list', 'medication', medication);
            });
        } else {
            addListItem('medications-list', 'medication', '');
        }
    }
}

function formatDateForInput(dateString) {
    // Convert date to YYYY-MM-DD format for input fields
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    } catch (e) {
        console.error('Error formatting date:', e);
        return '';
    }
}

function addListItem(listId, type, value = '') {
    const list = document.getElementById(listId);
    if (!list) return;
    
    const listItem = document.createElement('div');
    listItem.className = 'list-item';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = `${type}-input`;
    input.value = value;
    input.placeholder = type === 'condition' ? 'Enter medical condition' : 'Enter medication';
    
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = 'Remove';
    removeBtn.onclick = function() {
        list.removeChild(listItem);
    };
    
    listItem.appendChild(input);
    listItem.appendChild(removeBtn);
    list.appendChild(listItem);
}

function savePatientData(patientId) {
    // Collect form data
    const patientData = {
        id: patientId,
        firstName: document.getElementById('patient-first-name').value,
        middleName: document.getElementById('patient-middle-name').value,
        lastName: document.getElementById('patient-last-name').value,
        mobile: document.getElementById('patient-mobile').value,
        birthdate: document.getElementById('patient-birthdate').value,
        occupation: document.getElementById('patient-occupation').value,
        gender: document.getElementById('gender-title').value,
        company: document.getElementById('patient-company').value,
        address: {
            city_name: document.getElementById('patient-city').value,
            barangay_name: document.getElementById('patient-barangay').value,
            street_name: document.getElementById('patient-street').value
        },
        civilStatus: document.getElementById('status-title').value,
        medicalConditions: collectListValues('conditions-list', 'condition-input'),
        medicalHistory: collectListValues('medications-list', 'medication-input'),
        lastUpdated: new Date().toLocaleDateString()
    };
    
    console.log(JSON.stringify(patientData));

    // Send update to server
    fetch(`/api/update-patient`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(patientData)
    })
    .then(response => {
        if (!response.ok) {
            console.log(response.message);
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        alert('Patient information updated successfully!');
        window.location.href = `/patient-info/`;
    })
    .catch(error => {
        console.error('Error updating patient data:', error);
        alert(`Error updating patient data: ${error.message}`);
    });
}

function collectListValues(listId, inputClass) {
    const values = [];
    const inputs = document.querySelectorAll(`#${listId} .${inputClass}`);
    
    inputs.forEach(input => {
        const value = input.value.trim();
        if (value) {
            values.push(value);
        }
    });
    
    return values;
}