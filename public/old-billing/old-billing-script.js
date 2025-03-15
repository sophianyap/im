document.addEventListener('DOMContentLoaded', function () {
    const patientId = localStorage.getItem('current_patient_id');
    const sessionId = localStorage.getItem('current_session_id');

    if (!patientId || !sessionId) {
        alert('Patient ID or Session ID not found in localStorage');
        return;
    }

    fetch(`/api/getBillingInfo?patientId=${patientId}&sessionId=${sessionId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                populateBillingTable(data.data.billing);
                populatePrescriptionTable(data.data.prescriptions);
            } else {
                alert('Failed to fetch billing information');
            }
        })
        .then(() => {
            setTimeout(() => {
              if (document.getElementById("loading-overlay")) {
                document.getElementById("loading-overlay").style.display = "none";
              }
            }, 1000);
          })
        .catch(error => {
            console.error('Error fetching billing information:', error);
            alert('Error fetching billing information');
        });
});

function populateBillingTable(billingData) {
    const billingTableBody = document.getElementById('billing-table-body');
    billingTableBody.innerHTML = ''; // Clear existing rows

    billingData.forEach(billing => {
        const row = document.createElement('tr');
        row.className = 'table-row';

        row.innerHTML = `
            <td class="table-data">${billing.serviceName}</td>
            <td class="table-data">₱${billing.totalFee}</td>
            <td class="table-data">₱${billing.amountTendered}</td>
            <td class="table-data">₱${billing.balance}</td>
            <td class="table-data">${billing.paymentStatus}</td>
        `;

        billingTableBody.appendChild(row);
    });
}

function populatePrescriptionTable(prescriptionData) {
    const prescriptionTableBody = document.getElementById('prescription-table-body');
    prescriptionTableBody.innerHTML = ''; // Clear existing rows

    prescriptionData.forEach(prescription => {
        const row = document.createElement('tr');
        row.className = 'table-row';

        row.innerHTML = `
            <td class="table-data">${prescription.medicationName}</td>
            <td class="table-data">${prescription.dosage}</td>
            <td class="table-data">${prescription.frequencyDuration}</td>
        `;

        prescriptionTableBody.appendChild(row);
    });
}