function makePatientDiv(patient) {
  // Create the patient card
  const patientCard = document.createElement('div');
  patientCard.className = 'patient-card';

  // Create the patient info section
  const patientInfo = document.createElement('div');
  patientInfo.className = 'patient-info';

  // Create the first line with ID and name
  const firstLine = document.createElement('div');
  firstLine.className = 'first-line';

  const patientId = document.createElement('div');
  patientId.className = 'patient-id';
  patientId.textContent = patient.patient_id;

  const patientsName = document.createElement('div');
  patientsName.className = 'patients-name';
  patientsName.textContent = `${patient.last_name}, ${patient.first_name}`;

  firstLine.appendChild(patientId);
  firstLine.appendChild(patientsName);

  // Create the patient details section
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
  // Format the contact number if needed
  const formattedContact = patient.contact_number ? patient.contact_number.replace(/(\d{4})(\d{4})(\d{3})/, '$1 $2 $3') : '';
  patientContact.textContent = formattedContact;

  patientDetails.appendChild(patientAge);
  patientDetails.appendChild(patientGender);
  patientDetails.appendChild(divider);
  patientDetails.appendChild(patientContact);

  // Add the parts to the patient info
  patientInfo.appendChild(firstLine);
  patientInfo.appendChild(patientDetails);

  // Create the arrow link
  const patientLink = document.createElement('a');
  patientLink.href = `/patient-info/index.html?patient-id=${patient.patient_id}`;

  const arrow = document.createElement('div');
  arrow.className = 'arrow';

  const arrowBtn = document.createElement('button');
  arrowBtn.style.fontWeight = 'bold';
  arrowBtn.textContent = '>';

  arrow.appendChild(arrowBtn);
  patientLink.appendChild(arrow);

  // Assemble the patient card
  patientCard.appendChild(patientInfo);
  patientCard.appendChild(patientLink);

  return patientCard;
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
      const mainContainer = document.getElementById("patient-container"); // Replace with your actual container ID

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