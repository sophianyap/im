function resetPatientInfo() {
    document.querySelector('.patient-name').textContent = '';
    document.querySelector('.patient-id').textContent = '';
    document.querySelector('.date-added').textContent = '';

    document.querySelectorAll('.information').forEach(info => info.textContent = '');

    document.querySelector('.medical-hstry1 .info-title').innerHTML = '';
    document.querySelector('.medical-hstry2 .info-title').innerHTML = '';

    document.querySelector('.date-updated .info-title:nth-child(2)').textContent = '';
}

function addPatientInfo(patient) {
    // Updating patient information dynamically
    document.querySelector('.patient-name').textContent = patient.name;
    document.querySelector('.patient-id').textContent = patient.id;
    document.querySelector('.date-added').textContent = patient.dateAdded;

    document.querySelector('.info-patient1 .info-age:nth-child(1) .information').textContent = patient.age;
    document.querySelector('.info-patient1 .info-age:nth-child(2) .information').textContent = patient.mobile;
    document.querySelector('.info-patient1 .info-age:nth-child(3) .information').textContent = patient.address;

    document.querySelector('.info-patient2 .info-age:nth-child(1) .information').textContent = patient.birthdate;
    document.querySelector('.info-patient2 .info-age:nth-child(2) .information').textContent = patient.email;
    document.querySelector('.info-patient2 .info-age:nth-child(3) .information').textContent = patient.occupation;

    document.querySelectorAll('.info-patient2 .info-age:nth-child(1) .information')[1].textContent = patient.gender;
    document.querySelectorAll('.info-patient2 .info-age:nth-child(2) .information')[1].textContent = patient.civilStatus;
    document.querySelectorAll('.info-patient2 .info-age:nth-child(3) .information')[1].textContent = patient.religion;

    // Medical conditions and medications
    const medicalConditionsContainer = document.querySelector('.medical-hstry1 .info-title');
    medicalConditionsContainer.innerHTML = '';
    patient.medicalConditions.forEach(condition => {
        medicalConditionsContainer.innerHTML += `<ol>${condition}</ol>`;
    });

    const medicationsContainer = document.querySelector('.medical-hstry2 .info-title');
    medicationsContainer.innerHTML = '';
    patient.medications.forEach(medication => {
        medicationsContainer.innerHTML += `<ol>${medication}</ol>`;
    });

    document.querySelector('.date-updated .info-title:nth-child(2)').textContent = patient.lastUpdated;
}

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('patient-id');

    resetPatientInfo();

    if (!patientId) {
        console.error('No patient ID found in the URL.');
        return;
    }

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
