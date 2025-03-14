document.addEventListener('DOMContentLoaded', () => {
    const patientId = localStorage.getItem("current_patient_id");
    const sessionId = localStorage.getItem("current_session_id");

    if (!patientId) {
        console.error('No patient ID found.');
        return;
    }

    if (!sessionId) {
        console.error('No session ID found.');
        return;
    }

    fetch(`/api/get-session?patient_id=${patientId}&session_id=${sessionId}`, {
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