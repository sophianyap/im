/**
 * Handles patient retrieval requests
 * @param {Object} connection - Database connection
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function getPatientsHandler(connection, req, res) {
    try {
        if (req.query.id) {
            return getPatientDetails(connection, req.query.id, res);
        } else {
            return getAllPatients(connection, res);
        }
    } catch (error) {
        console.error('Unexpected error in getPatientsHandler:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

/**
 * Retrieves detailed information for a specific patient
 * @param {Object} connection - Database connection
 * @param {string|number} patientId - Patient ID to retrieve
 * @param {Object} res - Express response object
 */
async function getPatientDetails(connection, patientId, res) {
    try {
        // Basic patient information query
        const basicQuery = `
            SELECT 
                p.patient_id,
                per.person_last_name,
                per.person_first_name,
                per.person_middle_name,
                per.person_birthdate,
                TIMESTAMPDIFF(YEAR, per.person_birthdate, CURDATE()) AS age,
                g.gender_title AS gender,
                per.contact_number,
                p.date_added,
                s.status_title AS civil_status,
                o.occupation_title AS occupation,
                per.person_company AS company
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
            WHERE p.patient_id = ?`;

        // Execute patient basic info query
        const patientResult = await executeQuery(connection, basicQuery, [patientId]);
        
        if (patientResult.length === 0) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }
        
        const patient = patientResult[0];

        // Prepare all additional queries
        const queries = {
            address: {
                query: `
                    SELECT 
                        a.address_street_name,
                        b.barangay_name,
                        c.city_name
                    FROM 
                        tbl_address a
                    JOIN 
                        tbl_person per ON a.person_id = per.person_id
                    LEFT JOIN 
                        tbl_barangay b ON a.barangay_id = b.barangay_id
                    LEFT JOIN 
                        tbl_city c ON b.city_id = c.city_id
                    WHERE 
                        per.person_id = (SELECT person_id FROM tbl_patient WHERE patient_id = ?)
                    LIMIT 1`,
                params: [patientId]
            },
            medicalConditions: {
                query: `
                    SELECT 
                        remarks
                    FROM 
                        tbl_medical_condition
                    WHERE 
                        patient_id = ?
                    ORDER BY 
                        condition_id DESC`,
                params: [patientId]
            },
            medicalHistory: {
                query: `
                    SELECT 
                        remarks
                    FROM 
                        tbl_medical_history
                    WHERE 
                        patient_id = ?
                    ORDER BY 
                        history_id DESC`,
                params: [patientId]
            },
            medications: {
                query: `
                    SELECT 
                        m.medication_name
                    FROM 
                        tbl_prescription p
                    JOIN 
                        tbl_medication m ON p.medication_id = m.medication_id
                    WHERE 
                        p.session_id IN (SELECT session_id FROM tbl_session WHERE patient_id = ?)
                    GROUP BY 
                        m.medication_name`,
                params: [patientId]
            },
            lastUpdated: {
                query: `
                    SELECT 
                        MAX(session_date) AS last_updated
                    FROM 
                        tbl_session
                    WHERE 
                        patient_id = ?`,
                params: [patientId]
            }
        };

        // Execute all queries in parallel
        const results = await Promise.all([
            executeQuery(connection, queries.address.query, queries.address.params),
            executeQuery(connection, queries.medicalConditions.query, queries.medicalConditions.params),
            executeQuery(connection, queries.medicalHistory.query, queries.medicalHistory.params),
            executeQuery(connection, queries.medications.query, queries.medications.params),
            executeQuery(connection, queries.lastUpdated.query, queries.lastUpdated.params)
        ]);

        // Process address data
        let address = {};
        if (results[0].length > 0) {
            const addr = results[0][0];
            address = {
                street_name: addr.address_street_name,
                barangay_name: addr.barangay_name,
                city_name: addr.city_name
            };
        }

        // Process medical conditions and history
        const medicalConditions = results[1].map(item => item.remarks).filter(Boolean);
        const medicalHistory = results[2].map(item => item.remarks).filter(Boolean);

        // Extract medications
        const medications = results[3].map(item => item.medication_name);

        console.log(patient.person_birthdate);
        // Format the response
        const formattedResponse = {
            id: patient.patient_id,
            firstName: patient.person_first_name,
            middleName: patient.person_middle_name,
            lastName: patient.person_last_name,
            dateAdded: formatDate(patient.date_added),
            age: patient.age,
            mobile: patient.contact_number,
            address: Object.keys(address).length > 0 ? address : 'Not provided',
            birthdate: patient.person_birthdate,
            occupation: patient.occupation || 'Not provided',
            gender: patient.gender || 'Not provided',
            civilStatus: patient.civil_status || 'Not provided',
            company: patient.company,
            medicalConditions: medicalConditions.length > 0 ? [...new Set(medicalConditions)] : [],
            medicalHistory: medicalHistory.length > 0 ? [...new Set(medicalHistory)] : [],
            medications: medications.length > 0 ? [...new Set(medications)] : [],
            lastUpdated: results[4][0]?.last_updated ?
                formatDate(results[4][0].last_updated) :
                formatDate(patient.date_added)
        };

        return res.json(formattedResponse);
    } catch (error) {
        console.error('Error retrieving patient details:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Database error in retrieving complete patient details' 
        });
    }
}

/**
 * Retrieves a list of all patients with basic information
 * @param {Object} connection - Database connection
 * @param {Object} res - Express response object
 */
async function getAllPatients(connection, res) {
    try {
        const listQuery = `
            SELECT 
                p.patient_id,
                per.person_last_name AS last_name,
                per.person_first_name AS first_name,
                per.person_middle_name AS middle_name,
                TIMESTAMPDIFF(YEAR, per.person_birthdate, CURDATE()) AS age,
                g.gender_title AS gender,
                per.contact_number
            FROM 
                tbl_patient p
            JOIN 
                tbl_person per ON p.person_id = per.person_id
            LEFT JOIN 
                tbl_gender g ON per.gender_id = g.gender_id
            ORDER BY 
                per.person_last_name, per.person_first_name`;

        const patients = await executeQuery(connection, listQuery);
        return res.json(patients);
    } catch (error) {
        console.error('Error retrieving all patients:', error);
        return res.status(500).json({ success: false, message: 'Database error' });
    }
}

/**
 * Executes a database query as a promise
 * @param {Object} connection - Database connection
 * @param {string} query - SQL query to execute
 * @param {Array} [params=[]] - Parameters for the query
 * @returns {Promise<Array>} - Query results
 */
function executeQuery(connection, query, params = []) {
    return new Promise((resolve, reject) => {
        connection.query(query, params, (err, results) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(results);
        });
    });
}

/**
 * Helper function to format dates
 * @param {string|Date} dateString - Date to format
 * @returns {string} - Formatted date string
 */
function formatDate(dateString) {
    if (!dateString) return 'Not provided';

    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

module.exports = {
    getPatientsHandler
}