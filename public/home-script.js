function makePatientDiv(patient) {
  // Create the container div
  const patientContainer = document.createElement('div');
  patientContainer.className = 'patient-container';

  // Create the anchor element
  const patientCardArea = document.createElement('a');
  patientCardArea.href = `/patient-info/index.html?patient-id=${patient.patient_id}`;
  patientCardArea.className = 'patient-card-area';

  // Create the button element
  const patientCardButton = document.createElement('button');
  patientCardButton.className = 'patient-card';

  // Create the patient info div
  const patientInfo = document.createElement('div');
  patientInfo.className = 'patient-info';

  // Create the first line div
  const firstLine = document.createElement('div');
  firstLine.className = 'first-line';

  const patientId = document.createElement('div');
  patientId.className = 'patient-id';
  patientId.textContent = patient.patient_id;

  const patientsName = document.createElement('div');
  patientsName.className = 'patients-name';
  patientsName.textContent = `${patient.last_name}, ${patient.first_name} ${patient.middle_name || ''}`;

  firstLine.appendChild(patientId);
  firstLine.appendChild(patientsName);

  // Create the patient details div
  const patientDetails = document.createElement('div');
  patientDetails.className = 'patient-details';

  const patientAge = document.createElement('span');
  patientAge.className = 'patient-age';
  patientAge.textContent = patient.age;

  const patientGender = document.createElement('span');
  patientGender.className = 'patient-gender';
  patientGender.textContent = patient.gender ? patient.gender.charAt(0) : '';

  const divider = document.createElement('span');
  divider.className = 'divider';
  divider.textContent = '|';

  const patientContact = document.createElement('span');
  patientContact.className = 'patient-contact';
  patientContact.textContent = patient.contact_number ? patient.contact_number.replace(/(\d{4})(\d{4})(\d{3})/, '$1 $2 $3') : '';

  patientDetails.appendChild(patientAge);
  patientDetails.appendChild(patientGender);
  patientDetails.appendChild(divider);
  patientDetails.appendChild(patientContact);

  // Append the first line and patient details to the patient info
  patientInfo.appendChild(firstLine);
  patientInfo.appendChild(patientDetails);

  // Append the patient info to the button
  patientCardButton.appendChild(patientInfo);

  // Append the button to the anchor
  patientCardArea.appendChild(patientCardButton);

  // Append the anchor to the container
  patientContainer.appendChild(patientCardArea);

  return patientContainer;
}

document.addEventListener('DOMContentLoaded', function () {
  // Fill patient container
  fetch('/api/get-patients', {
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

      // Set total no. of patients
      const totalNo = document.getElementById("total-no");
      totalNo.innerHTML = data.length;

      // Get the container where patients will be displayed
      const mainContainer = document.querySelector(".patient-container"); // Replace with your actual container ID

      // Clear existing content if needed
      mainContainer.innerHTML = '';

      // Add each patient to the display
      data.forEach(patient => {
        const patientElement = makePatientDiv(patient);
        mainContainer.appendChild(patientElement);
      });
    })
    .catch(error => {
      console.error('Error:', error);
      alert(`Error: ${error}`);
    });
})