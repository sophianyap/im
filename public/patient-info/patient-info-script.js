function resetPatientInfo() {
    document.querySelector('.patient-name').textContent = '';
    document.querySelector('.patient-id').textContent = '';
    document.querySelector('.date-added').textContent = '';

    document.querySelector('.date-updated .info-title:nth-child(2)').textContent = '';
}

document.getElementById('delete-patient').addEventListener('click', async () => {
    const patientId = localStorage.getItem("current_patient_id");

    try {
        const response = await fetch(`/api/delete-patient?id=${patientId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            alert('Patient deleted successfully!');
            window.location.href = '/index.html'; // Redirect to home page
        } else {
            const errorData = await response.json();
            alert(`Error: ${errorData.message}`);
        }
    } catch (error) {
        console.error('Error deleting patient:', error);
        alert('Failed to delete patient. Please try again later.');
    }
});

function addPatientInfo(patient) {
    console.log(patient);

    const genderArray = ['Male', 'Female']
    const civilStatusArray = ['Single', 'Married', 'Widowed', 'Separated', 'Annulled'];

    // Updating patient information dynamically
    document.getElementById('patient-name').textContent = `${patient.lastName}, ${patient.firstName} ${!(patient.middleName) ? '' : patient.middleName}`;
    document.querySelector('.patient-id').textContent = patient.id;
    document.getElementById('date-added').textContent = patient.dateAdded;

    document.getElementById('age-display').textContent = patient.age;
    document.getElementById('number-display').textContent = patient.mobile;

    document.getElementById('city-display').innerHTML = patient.address.city_name;
    document.getElementById('barangay-display').innerHTML = patient.address.barangay_name;
    document.getElementById('street-display').innerHTML = patient.address.street_name;

    document.getElementById('civil-status-display').innerHTML = 
        patient.civilStatus !== undefined ? civilStatusArray[parseInt(patient.civilStatus, 10)] : "Not specified";

    console.log(patient.civilStatus);

    document.getElementById('birthday-display').textContent = patient.birthdate;
    document.getElementById('occupation-display').textContent = patient.occupation;

    document.getElementById('gender-display').textContent = 
        patient.gender !== undefined ? genderArray[parseInt(patient.gender, 10)] : "Not specified";

    document.getElementById('company-display').textContent = patient.company;

    // Medical conditions and medications
    const medicalConditionsContainer = document.querySelector('.medical-hstry1 .info-title');
    medicalConditionsContainer.innerHTML = '';
    patient.medicalConditions.forEach(condition => {
        medicalConditionsContainer.innerHTML += `<ol>${condition}</ol>`;
    });

    const medicationsContainer = document.querySelector('.medical-hstry2 .info-title');
    medicationsContainer.innerHTML = '';
    patient.medicalHistory.forEach(medication => {
        medicationsContainer.innerHTML += `<ol>${medication}</ol>`;
    });

    document.querySelector('.date-updated .info-title:nth-child(2)').textContent = patient.lastUpdated;
}

document.querySelectorAll('#edit-profile').forEach(button => {
    button.closest('a').href = `/edit-profile/`;
});

async function fetchAppointmentHistory() {
    try {
        // Show loading overlay
        document.getElementById('loading-overlay').style.display = 'flex';
        
        // Get the current patient ID from localStorage
        const currentPatientId = localStorage.getItem('current_patient_id');
        
        if (!currentPatientId) {
            console.error('No patient ID found in localStorage');
            return;
        }
        
        // Fetch appointment history from the API
        const response = await fetch(`/api/appointment-history?patientId=${currentPatientId}`);
        const data = await response.json();
        
        if (!data.success) {
            console.error('Error fetching appointment history:', data.message);
            return;
        }
        
        // Display the appointment history
        displayAppointmentHistory(data.data);
    } catch (error) {
        console.error('Error in fetchAppointmentHistory:', error);
    } finally {
        // Hide loading overlay
        document.getElementById('loading-overlay').style.display = 'none';
    }
}

// Function to display appointment history in the UI
function displayAppointmentHistory(appointments) {
    const appointmentContainer = document.querySelector('.appointment-container');
    
    // Clear existing appointments
    appointmentContainer.innerHTML = '';
    
    if (appointments.length === 0) {
        appointmentContainer.innerHTML = '<p class="no-appointments">No appointment history found.</p>';
        return;
    }
    
    // Add each appointment to the container
    appointments.forEach(appointment => {
        const appointmentCard = document.createElement('div');
        appointmentCard.className = 'appointment-card';
        appointmentCard.innerHTML = `
            <div class="appointment-info">
                <div class="first-line">
                    <div class="apt-date">${appointment.date}</div>
                </div>
                <div class="patient-details">
                    <span class="apt-doctor">${appointment.services}</span>
                </div>
            </div>
            <a href="/appt-history/">
                <div class="apt-arrow">
                    <p style="color: black;">SEE MORE INFO</p>
                    <button style="font-weight: bold;">> </button>
                </div>
            </a>
        `;

        appointmentCard.onclick = () => {
            localStorage.setItem('current_session_id', appointment.sessionId);
        };
        
        appointmentContainer.appendChild(appointmentCard);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const patientId = localStorage.getItem("current_patient_id");

    // Remove current session id if it exists
    localStorage.removeItem("current_session_id");

    if (!patientId) {
        console.error('No patient ID found in the URL.');
        return;
    }
    resetPatientInfo();
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
    .then(data => {
        console.log(data); // Log data instead of response
        addPatientInfo(data);
    })
    .then(() => {
        setTimeout(() => {
          document.getElementById("loading-overlay").style.display = "none";
        }, 1000);
      })
    .catch(error => {
        console.error('Error:', error);
        alert(`Error: ${error}`);
    });

    fetchAppointmentHistory();
});