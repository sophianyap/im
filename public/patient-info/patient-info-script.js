function resetPatientInfo() {
    document.querySelector('.patient-name').textContent = '';
    document.querySelector('.patient-id').textContent = '';
    document.querySelector('.date-added').textContent = '';

    document.querySelector('.date-updated .info-title:nth-child(2)').textContent = '';
}

document.getElementById('delete-patient').addEventListener('click', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('patient-id');

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

    // Updating patient information dynamically
    document.querySelector('.patient-name').textContent = `${patient.lastName}, ${patient.firstName} ${patient.middleName}`;
    document.querySelector('.patient-id').textContent = patient.id;
    document.querySelector('.date-added').textContent = patient.dateAdded;

    document.querySelector('.info-patient1 .info-age:nth-child(1) .information').textContent = patient.age;
    document.querySelector('.info-patient1 .info-age:nth-child(2) .information').textContent = patient.mobile;

    document.getElementById('city').textContent = patient.address.city_name;
    document.getElementById('barangay').textContent = patient.address.barangay_name;
    document.getElementById('street').textContent = patient.address.street_name;

    document.querySelector('.info-patient2 .info-age:nth-child(1) .information').textContent = patient.birthdate;
    document.querySelector('.info-patient2 .info-age:nth-child(2) .information').textContent = patient.occupation;

    document.querySelectorAll('.info-patient2 .info-age:nth-child(1) .information')[1].textContent = patient.gender;
    document.querySelectorAll('.info-patient2 .info-age:nth-child(2) .information')[1].textContent = patient.company;

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

    // Set new session
    document.getElementById('add-button-appt').href = `/new-session/index.html?patient-id=${patient.id}`;
}

document.querySelectorAll('#edit-profile').forEach(button => {
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('patient-id');
    if (patientId) {
        button.closest('a').href = `/edit-profile/index.html?patient-id=${patientId}`;
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('patient-id');

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
    .catch(error => {
        console.error('Error:', error);
        alert(`Error: ${error}`);
    });
});