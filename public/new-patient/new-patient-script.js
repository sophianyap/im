document.addEventListener('DOMContentLoaded', function() {
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

    // Function to add a new current medication input field
    function addCurrentMedication() {
        const currentMedicationsContainer = document.querySelector('.medical-hstry2');
        const newMedication = document.createElement('div');
        newMedication.classList.add('medical-condition-card2');
        newMedication.innerHTML = `
            <button class="remove-condition">x</button>
            <input type="text" class="curmed-input">
        `;
        currentMedicationsContainer.insertBefore(newMedication, currentMedicationsContainer.lastElementChild);

        // Add event listener to the new remove button
        newMedication.querySelector('.remove-condition').addEventListener('click', function() {
            currentMedicationsContainer.removeChild(newMedication);
        });
    }

    // Add event listeners to the "add another condition" and "add more" buttons
    document.querySelector('.medical-hstry1 .add-condition').addEventListener('click', addMedicalCondition);
    document.querySelector('.medical-hstry2 .add-condition').addEventListener('click', addCurrentMedication);

    // Add event listeners to existing remove buttons (if any)
    document.querySelectorAll('.medical-hstry1 .remove-condition').forEach(button => {
        button.addEventListener('click', function() {
            const conditionCard = button.parentElement;
            conditionCard.parentElement.removeChild(conditionCard);
        });
    });

    document.querySelectorAll('.medical-hstry2 .remove-condition').forEach(button => {
        button.addEventListener('click', function() {
            const medicationCard = button.parentElement;
            medicationCard.parentElement.removeChild(medicationCard);
        });
    });
});

document.getElementById('save-profile').addEventListener('click', async () => {
    const patientData = {
        firstName: document.getElementById('patient-firstname').value,
        middleName: document.getElementById('patient-middlename').value,
        lastName: document.getElementById('patient-lastname').value,
        mobileNumber: document.getElementById('patient-mobile').value,
        birthDate: document.getElementById('patient-birthdate').value,
        occupation: document.getElementById('patient-occupation').value,
        gender: document.getElementById('gender-title').value,
        civilStatus: document.getElementById('status-title').value,
        company: document.getElementById('patient-company').value,
        address: {
            city: document.getElementById('patient-city').value,
            barangay: document.getElementById('patient-brngy').value,
            street: document.getElementById('patient-street').value
        },
        medicalConditions: Array.from(document.querySelectorAll('.med-input')).map(input => input.value),
        currentMedications: Array.from(document.querySelectorAll('.curmed-input')).map(input => input.value)
    };

    alert(JSON.stringify(patientData));
    console.log(JSON.stringify(patientData));

    try {
        const response = await fetch('/api/add-patient', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(patientData)
        });

        if (response.ok) {
            alert('Patient added successfully!');
            window.location.href = '/index.html'; // Redirect to home page
        } else {
            const errorData = await response.json();
            alert(`Error: ${errorData.message}`);
        }
    } catch (error) {
        console.error('Error adding patient:', error);
        alert('Failed to add patient. Please try again later.');
    }
});
