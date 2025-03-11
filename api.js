const express = require('express')
const api = express.Router()
const mysql = require('mysql');

const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: "db_happyteeth"
});

connection.connect(function(err) {
    if (err) throw err;
});

api.get(`/get-patients`, async (req, res) => {
    console.log('getpatients!!!!!');

    if (req.query.id) {
        // Detailed query for a specific patient
        const patientId = req.query.id;
        const basicQuery = `SELECT 
            p.patient_id,
            per.patient_last_name,
            per.patient_first_name,
            per.patient_middle_name,
            per.patient_birthdate,
            TIMESTAMPDIFF(YEAR, per.patient_birthdate, CURDATE()) AS age,
            g.gender_title AS gender,
            per.contactnumber_id AS contact_number,
            p.date_added,
            s.status_title AS civil_status,
            o.occupation_title AS occupation,
            per.patient_company AS company,
            per.person_type
        FROM 
            tbl_patient p
        JOIN 
            tbl_person per ON p.person_id = per.person_id
        LEFT JOIN 
            tbl_gender g ON per.gender_id = g.gender_id
        LEFT JOIN 
            tbl_status s ON per.status_id = s.status_id
        LEFT JOIN 
            tbl_occupation o ON per.occupation_id = o.occupation_id
        WHERE p.patient_id = ${patientId}`;

        // Execute the main query first
        connection.query(basicQuery, (err, patientResult, fields) => {
            if (err) {
                console.error('Error fetching patient details:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (patientResult.length === 0) {
                return res.status(404).json({ error: 'Patient not found' });
            }

            const patient = patientResult[0];

            // Query for address information
            const addressQuery = `
                SELECT 
                    a.address_street_name,
                    b.barangay_name,
                    c.barangay_name AS city_name
                FROM 
                    tbl_address a
                JOIN 
                    tbl_person per ON a.person_id = per.person_id
                LEFT JOIN 
                    tbl_barangay b ON a.barangay_id = b.barangay_id
                LEFT JOIN 
                    tbl_city c ON b.city_id = c.city_id
                WHERE 
                    per.person_id = (SELECT person_id FROM tbl_patient WHERE patient_id = ${patientId})
                LIMIT 1`;

            // Query for medical conditions (using patient questionnaire as a proxy)
            const medicalConditionsQuery = `
                SELECT 
                    remarks
                FROM 
                    tbl_patient_questionnaire
                WHERE 
                    session_id IN (SELECT session_id FROM tbl_session WHERE patient_id = ${patientId})
                ORDER BY 
                    date DESC`;

            // Query for medications
            const medicationsQuery = `
                SELECT 
                    m.medication_name
                FROM 
                    tbl_prescription p
                JOIN 
                    tbl_medication m ON p.medication_id = m.medication_id
                WHERE 
                    p.session_id IN (SELECT session_id FROM tbl_session WHERE patient_id = ${patientId})
                GROUP BY 
                    m.medication_name`;

            // Query for last updated (most recent session)
            const lastUpdatedQuery = `
                SELECT 
                    MAX(session_date) AS last_updated
                FROM 
                    tbl_session
                WHERE 
                    patient_id = ${patientId}`;

            // Using Promise.all to run all additional queries in parallel
            Promise.all([
                new Promise((resolve, reject) => {
                    connection.query(addressQuery, (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                }),
                new Promise((resolve, reject) => {
                    connection.query(medicalConditionsQuery, (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                }),
                new Promise((resolve, reject) => {
                    connection.query(medicationsQuery, (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                }),
                new Promise((resolve, reject) => {
                    connection.query(lastUpdatedQuery, (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                })
            ])
            .then(([addressResults, medicalConditionsResults, medicationsResults, lastUpdatedResults]) => {
                // Format the address
                let address = '';
                if (addressResults.length > 0) {
                    const addr = addressResults[0];
                    const parts = [
                        addr.address_street_name,
                        addr.barangay_name,
                        addr.city_name
                    ].filter(Boolean);
                    address = parts.join(', ');
                }

                // Extract and parse medical conditions
                const medicalConditions = [];
                if (medicalConditionsResults.length > 0) {
                    // This assumes remarks contains medical conditions
                    medicalConditionsResults.forEach(item => {
                        if (item.remarks) {
                            // Attempt to parse JSON if stored that way, or split by commas
                            try {
                                const conditions = JSON.parse(item.remarks);
                                if (Array.isArray(conditions)) {
                                    medicalConditions.push(...conditions);
                                }
                            } catch (e) {
                                // If not JSON, split by comma or add as is
                                if (item.remarks.includes(',')) {
                                    medicalConditions.push(...item.remarks.split(',').map(c => c.trim()));
                                } else {
                                    medicalConditions.push(item.remarks.trim());
                                }
                            }
                        }
                    });
                }

                // Extract medications
                const medications = medicationsResults.map(item => item.medication_name);

                // Format the response according to the requested structure
                const formattedResponse = {
                    id: patient.patient_id,
                    name: `${patient.patient_last_name}, ${patient.patient_first_name}`,
                    dateAdded: formatDate(patient.date_added),
                    age: patient.age,
                    mobile: formatPhoneNumber(patient.contact_number),
                    address: address || 'Not provided',
                    birthdate: formatDate(patient.patient_birthdate),
                    email: 'Not provided', // Email not in current schema
                    occupation: patient.occupation || 'Not provided',
                    gender: patient.gender || 'Not provided',
                    civilStatus: patient.civil_status || 'Not provided',
                    religion: 'Not provided', // Religion not in current schema
                    medicalConditions: medicalConditions.length > 0 ? [...new Set(medicalConditions)] : [],
                    medications: medications.length > 0 ? [...new Set(medications)] : [],
                    lastUpdated: lastUpdatedResults[0]?.last_updated ? 
                        formatDate(lastUpdatedResults[0].last_updated) : 
                        formatDate(patient.date_added)
                };

                res.json(formattedResponse);
            })
            .catch(error => {
                console.error('Error in additional queries:', error);
                return res.status(500).json({ error: 'Database error in retrieving complete patient details' });
            });
        });
    } else {
        // Simple query for all patients (with only the requested fields)
        const listQuery = `SELECT 
            p.patient_id,
            per.patient_last_name AS last_name,
            per.patient_first_name AS first_name,
            TIMESTAMPDIFF(YEAR, per.patient_birthdate, CURDATE()) AS age,
            g.gender_title AS gender,
            per.contactnumber_id AS contact_number
        FROM 
            tbl_patient p
        JOIN 
            tbl_person per ON p.person_id = per.person_id
        LEFT JOIN 
            tbl_gender g ON per.gender_id = g.gender_id
        ORDER BY 
            per.patient_last_name, per.patient_first_name`;
        
        connection.query(listQuery, (err, result, fields) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            console.log(result);
            res.json(result);
        });
    }
});

// Helper function to format dates
function formatDate(dateString) {
    if (!dateString) return 'Not provided';
    
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Helper function to format phone numbers as "0912 345 6789"
function formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return 'Not provided';
    
    // Remove non-numeric characters
    const cleaned = ('' + phoneNumber).replace(/\D/g, '');
    
    // Format as "0912 345 6789"
    if (cleaned.length === 11) {
        return `${cleaned.substring(0, 4)} ${cleaned.substring(4, 7)} ${cleaned.substring(7)}`;
    } else if (cleaned.length === 10) {
        // If missing the leading 0
        return `0${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
    }
    
    // If format doesn't match expected patterns, return as is
    return phoneNumber;
}

module.exports = api