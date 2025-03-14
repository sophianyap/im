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
 * Handles services offered requests
 * @param {Object} connection - Database connection
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function getServicesOfferedHandler(connection, req, res) {
    try {
        return getServicesOffered(connection, res)
    } catch (error) {
        console.error('Unexpected error in getPatientsHandler:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

async function getServicesOffered(connection, res) {
    try {
        const query = `SELECT service_offered_id, service_offered_name FROM tbl_services_offered;`
        const servicesOffered = await executeQuery(connection, query);
        return res.json(servicesOffered);
    } catch (error) {
        console.error('Error getting services offered:', error);
        return res.status(500).json({ success: false, message: 'Database error' });
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
                per.gender_id,
                per.status_id,
                per.contact_number,
                p.date_added,
                o.occupation_title AS occupation,
                per.person_company AS company
            FROM 
                tbl_patient p
            JOIN 
                tbl_person per ON p.person_id = per.person_id
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
                    LEFT JOIN 
                        tbl_barangay b ON a.barangay_id = b.barangay_id
                    LEFT JOIN 
                        tbl_city c ON b.city_id = c.city_id
                    WHERE 
                        a.address_id = (SELECT address_id FROM tbl_person WHERE person_id = 
                            (SELECT person_id FROM tbl_patient WHERE patient_id = ?))
                    LIMIT 1`,
                params: [patientId]
            },
            medicalConditions: {
                query: `
                    SELECT 
                        mc.condition_name AS condition_name
                    FROM 
                        tbl_medical_condition_patient mcp
                    JOIN
                        tbl_medical_condition mc ON mcp.condition_id = mc.condition_id
                    WHERE 
                        mcp.patient_id = ?
                    ORDER BY 
                        mc.condition_id DESC`,
                params: [patientId]
            },
            medicalHistory: {
                query: `
                    SELECT 
                        mh.history_name AS history_name
                    FROM 
                        tbl_medical_history_patient mhp
                    JOIN
                        tbl_medical_history mh ON mhp.history_id = mh.history_id
                    WHERE 
                        mhp.patient_id = ?
                    ORDER BY 
                        mh.history_id DESC`,
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
        const medicalConditions = results[1].map(item => item.condition_name).filter(Boolean);
        const medicalHistory = results[2].map(item => item.history_name).filter(Boolean);

        // Extract medications
        const medications = results[3].map(item => item.medication_name);

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
            gender: patient.gender_id,
            civilStatus: patient.status_id,
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
 * Handles appointment history retrieval requests
 * @param {Object} connection - Database connection
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function getAppointmentHistoryHandler(connection, req, res) {
    try {
        const patientId = req.query.patientId;
        
        if (!patientId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Patient ID is required' 
            });
        }
        
        return getPatientAppointments(connection, patientId, res);
    } catch (error) {
        console.error('Unexpected error in getAppointmentHistoryHandler:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

/**
 * Retrieves all appointment sessions for a specific patient
 * @param {Object} connection - Database connection
 * @param {string|number} patientId - Patient ID to retrieve appointments for
 * @param {Object} res - Express response object
 */
async function getPatientAppointments(connection, patientId, res) {
    try {
        const appointmentsQuery = `
            SELECT 
                s.session_id,
                s.session_date,
                s.session_remarks,
                s.session_time_start,
                s.session_time_end,
                CONCAT(p.person_last_name, ', ', p.person_first_name, 
                    CASE WHEN p.person_middle_name IS NOT NULL THEN CONCAT(' ', p.person_middle_name) ELSE '' END) AS dentist_name,
                GROUP_CONCAT(DISTINCT so.service_offered_name SEPARATOR ' - ') AS services
            FROM 
                tbl_session s
            LEFT JOIN 
                tbl_dentist d ON s.dentist_id = d.dentist_id
            LEFT JOIN 
                tbl_person p ON d.person_id = p.person_id
            LEFT JOIN 
                tbl_service srv ON s.session_id = srv.session_id
            LEFT JOIN 
                tbl_services_offered so ON srv.service_offered_id = so.service_offered_id
            WHERE 
                s.patient_id = ?
            GROUP BY 
                s.session_id
            ORDER BY 
                s.session_date DESC, s.session_time_start DESC`;

        const appointments = await executeQuery(connection, appointmentsQuery, [patientId]);
        
        // Format the response data
        const formattedAppointments = appointments.map(appt => ({
            sessionId: appt.session_id,
            date: formatDate(appt.session_date),
            timeStart: formatTime(appt.session_time_start),
            timeEnd: formatTime(appt.session_time_end),
            dentistName: appt.dentist_name || 'Not assigned',
            remarks: appt.session_remarks || '',
            services: appt.services || 'No services recorded'
        }));
        
        return res.json({
            success: true,
            data: formattedAppointments
        });
    } catch (error) {
        console.error('Error retrieving patient appointments:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Database error in retrieving appointment history' 
        });
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

/**
 * Helper function to format time
 * @param {string|Date} timeString - Time to format
 * @returns {string} - Formatted time string
 */
function formatTime(timeString) {
    if (!timeString) return 'Not specified';
    
    const time = new Date(`1970-01-01T${timeString}`);
    return time.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
    });
}

/**
 * Handles session retrieval requests
 * @param {Object} connection - Database connection
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function getSessionHandler(connection, req, res) {
    try {
        const sessionId = req.query.sessionId;
        
        if (!sessionId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Session ID is required' 
            });
        }
        
        return getSessionDetails(connection, sessionId, res);
    } catch (error) {
        console.error('Unexpected error in getSessionHandler:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

/**
 * Retrieves detailed information for a specific dental session
 * @param {Object} connection - Database connection
 * @param {string|number} sessionId - Session ID to retrieve
 * @param {Object} res - Express response object
 */
async function getSessionDetails(connection, sessionId, res) {
    try {
        // Basic session information query
        const sessionQuery = `
            SELECT 
                s.session_id,
                s.patient_id,
                s.dentist_id,
                s.session_date,
                s.session_remarks,
                s.session_remarks_image,
                s.session_time_start,
                s.session_time_end,
                CONCAT(dp.person_last_name, ', ', dp.person_first_name) AS dentist_name,
                CONCAT(pp.person_last_name, ', ', pp.person_first_name) AS patient_name
            FROM 
                tbl_session s
            LEFT JOIN 
                tbl_dentist d ON s.dentist_id = d.dentist_id
            LEFT JOIN 
                tbl_person dp ON d.person_id = dp.person_id
            LEFT JOIN 
                tbl_patient p ON s.patient_id = p.patient_id
            LEFT JOIN 
                tbl_person pp ON p.person_id = pp.person_id
            WHERE 
                s.session_id = ?`;

        // Execute session info query
        const sessionResult = await executeQuery(connection, sessionQuery, [sessionId]);
        
        if (sessionResult.length === 0) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }
        
        const session = sessionResult[0];

        // Get services provided in this session
        const servicesQuery = `
            SELECT 
                srv.service_id,
                srv.service_tooth_number,
                srv.service_status,
                srv.service_fee,
                srv.service_fee_status,
                srv.service_amount_tendered,
                so.service_offered_id,
                so.service_offered_name
            FROM 
                tbl_service srv
            JOIN 
                tbl_services_offered so ON srv.service_offered_id = so.service_offered_id
            WHERE 
                srv.session_id = ?
            ORDER BY 
                srv.service_id`;
        
        const services = await executeQuery(connection, servicesQuery, [sessionId]);

        // Get prescriptions for this session
        const prescriptionsQuery = `
            SELECT 
                p.prescription_id,
                p.special_instructions,
                m.medication_id,
                m.medication_name,
                m.medication_dosage,
                m.medication_frequency_duration
            FROM 
                tbl_prescription p
            JOIN 
                tbl_medication m ON p.medication_id = m.medication_id
            WHERE 
                p.session_id = ?
            ORDER BY 
                p.prescription_id`;
                
        const prescriptions = await executeQuery(connection, prescriptionsQuery, [sessionId]);

        // Get tooth chart for this patient
        const toothChartQuery = `
            SELECT 
                ptc.tooth_chart,
                ptc.patienttooth_remarks
            FROM 
                tbl_patient_tooth_chart ptc
            WHERE 
                ptc.patient_id = ?
            ORDER BY
                ptc.date_added DESC
            LIMIT 1`;
                
        const toothChartResult = await executeQuery(connection, toothChartQuery, [session.patient_id]);
        const toothChart = toothChartResult.length > 0 ? toothChartResult[0] : null;

        // Format the response
        const formattedResponse = {
            sessionId: session.session_id,
            patientId: session.patient_id,
            dentistId: session.dentist_id,
            dentistName: session.dentist_name || 'Not assigned',
            patientName: session.patient_name,
            date: formatDate(session.session_date),
            remarks: session.session_remarks || '',
            remarksImage: session.session_remarks_image,
            timeStart: formatTime(session.session_time_start),
            timeEnd: formatTime(session.session_time_end),
            services: services.map(service => ({
                serviceId: service.service_id,
                serviceOfferedId: service.service_offered_id,
                serviceName: service.service_offered_name,
                toothNumber: service.service_tooth_number || '',
                status: service.service_status || 'Incomplete',
                fee: service.service_fee || 0,
                feeStatus: service.service_fee_status || 'Unpaid',
                amountTendered: service.service_amount_tendered || 0
            })),
            prescriptions: prescriptions.map(prescription => ({
                prescriptionId: prescription.prescription_id,
                medicationId: prescription.medication_id,
                medicationName: prescription.medication_name,
                dosage: prescription.medication_dosage,
                frequencyDuration: prescription.medication_frequency_duration,
                specialInstructions: prescription.special_instructions || ''
            })),
            toothChart: toothChart ? {
                chartData: toothChart.tooth_chart, // This will be a blob in the database
                remarks: toothChart.patienttooth_remarks || ''
            } : null
        };

        return res.json({
            success: true,
            data: formattedResponse
        });
    } catch (error) {
        console.error('Error retrieving session details:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Database error in retrieving session details' 
        });
    }
}

/**
 * Handles patient session retrieval requests
 * @param {Object} connection - Database connection
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function getPatientSessionHandler(connection, req, res) {
    try {
        const sessionId = req.query.sessionId;
        const patientId = req.query.patientId;
        
        if (!sessionId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Session ID is required' 
            });
        }
        
        if (!patientId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Patient ID is required' 
            });
        }
        
        return getPatientSessionDetails(connection, sessionId, patientId, res);
    } catch (error) {
        console.error('Unexpected error in getPatientSessionHandler:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

/**
 * Retrieves detailed information for a specific dental session belonging to a specific patient
 * @param {Object} connection - Database connection
 * @param {string|number} sessionId - Session ID to retrieve
 * @param {string|number} patientId - Patient ID to validate ownership
 * @param {Object} res - Express response object
 */
async function getPatientSessionDetails(connection, sessionId, patientId, res) {
    try {
        // Verify the session belongs to the specified patient
        const verifyQuery = `
            SELECT session_id 
            FROM tbl_session 
            WHERE session_id = ? AND patient_id = ?`;
            
        const verifyResult = await executeQuery(connection, verifyQuery, [sessionId, patientId]);
        
        if (verifyResult.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Session not found or does not belong to specified patient' 
            });
        }
        
        // Basic session information query
        const sessionQuery = `
            SELECT 
                s.session_id,
                s.patient_id,
                s.dentist_id,
                s.session_date,
                s.session_remarks,
                s.session_remarks_image,
                s.session_time_start,
                s.session_time_end,
                CONCAT(dp.person_last_name, ', ', dp.person_first_name) AS dentist_name,
                CONCAT(pp.person_last_name, ', ', pp.person_first_name) AS patient_name
            FROM 
                tbl_session s
            LEFT JOIN 
                tbl_dentist d ON s.dentist_id = d.dentist_id
            LEFT JOIN 
                tbl_person dp ON d.person_id = dp.person_id
            LEFT JOIN 
                tbl_patient p ON s.patient_id = p.patient_id
            LEFT JOIN 
                tbl_person pp ON p.person_id = pp.person_id
            WHERE 
                s.session_id = ?`;

        // Execute session info query
        const sessionResult = await executeQuery(connection, sessionQuery, [sessionId]);
        const session = sessionResult[0];

        // Get services provided in this session
        const servicesQuery = `
            SELECT 
                srv.service_id,
                srv.service_tooth_number,
                srv.service_status,
                srv.service_fee,
                srv.service_fee_status,
                srv.service_amount_tendered,
                so.service_offered_id,
                so.service_offered_name
            FROM 
                tbl_service srv
            JOIN 
                tbl_services_offered so ON srv.service_offered_id = so.service_offered_id
            WHERE 
                srv.session_id = ?
            ORDER BY 
                srv.service_id`;
        
        const services = await executeQuery(connection, servicesQuery, [sessionId]);

        // Get prescriptions for this session
        const prescriptionsQuery = `
            SELECT 
                p.prescription_id,
                p.special_instructions,
                m.medication_id,
                m.medication_name,
                m.medication_dosage,
                m.medication_frequency_duration
            FROM 
                tbl_prescription p
            JOIN 
                tbl_medication m ON p.medication_id = m.medication_id
            WHERE 
                p.session_id = ?
            ORDER BY 
                p.prescription_id`;
                
        const prescriptions = await executeQuery(connection, prescriptionsQuery, [sessionId]);

        // Get tooth chart for this patient
        const toothChartQuery = `
            SELECT 
                ptc.tooth_chart,
                ptc.patienttooth_remarks,
                ptc.date_added
            FROM 
                tbl_patient_tooth_chart ptc
            WHERE 
                ptc.patient_id = ?
            ORDER BY
                ptc.date_added DESC
            LIMIT 1`;
                
        const toothChartResult = await executeQuery(connection, toothChartQuery, [patientId]);
        const toothChart = toothChartResult.length > 0 ? toothChartResult[0] : null;

        // Format the response
        const formattedResponse = {
            sessionId: session.session_id,
            patientId: session.patient_id,
            dentistId: session.dentist_id,
            dentistName: session.dentist_name || 'Not assigned',
            patientName: session.patient_name,
            date: formatDate(session.session_date),
            remarks: session.session_remarks || '',
            remarksImage: session.session_remarks_image,
            timeStart: formatTime(session.session_time_start),
            timeEnd: formatTime(session.session_time_end),
            services: services.map(service => ({
                serviceId: service.service_id,
                serviceOfferedId: service.service_offered_id,
                serviceName: service.service_offered_name,
                toothNumber: service.service_tooth_number || '',
                status: service.service_status || 'Incomplete',
                fee: service.service_fee || 0,
                feeStatus: service.service_fee_status || 'Unpaid',
                amountTendered: service.service_amount_tendered || 0
            })),
            prescriptions: prescriptions.map(prescription => ({
                prescriptionId: prescription.prescription_id,
                medicationId: prescription.medication_id,
                medicationName: prescription.medication_name,
                dosage: prescription.medication_dosage,
                frequencyDuration: prescription.medication_frequency_duration,
                specialInstructions: prescription.special_instructions || ''
            })),
            toothChart: toothChart ? {
                chartData: toothChart.tooth_chart,
                remarks: toothChart.patienttooth_remarks || '',
                lastUpdated: formatDate(toothChart.date_added)
            } : null
        };

        return res.json({
            success: true,
            data: formattedResponse
        });
    } catch (error) {
        console.error('Error retrieving patient session details:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Database error in retrieving session details' 
        });
    }
}

/**
 * Handles billing information retrieval requests
 * @param {Object} connection - Database connection
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function getBillingInfoHandler(connection, req, res) {
    try {
        const patientId = req.query.patientId;
        const sessionId = req.query.sessionId;

        if (!patientId || !sessionId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Patient ID and Session ID are required' 
            });
        }

        return getBillingInfo(connection, patientId, sessionId, res);
    } catch (error) {
        console.error('Unexpected error in getBillingInfoHandler:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

/**
 * Retrieves billing information for a specific session and patient
 * @param {Object} connection - Database connection
 * @param {string|number} patientId - Patient ID
 * @param {string|number} sessionId - Session ID
 * @param {Object} res - Express response object
 */
async function getBillingInfo(connection, patientId, sessionId, res) {
    try {
        // Query to get billing information
        const billingQuery = `
            SELECT 
                so.service_offered_name AS service_name,
                srv.service_fee AS total_fee,
                srv.service_amount_tendered AS amount_tendered,
                (srv.service_fee - srv.service_amount_tendered) AS balance,
                srv.service_fee_status AS payment_status
            FROM 
                tbl_service srv
            JOIN 
                tbl_services_offered so ON srv.service_offered_id = so.service_offered_id
            JOIN 
                tbl_session sess ON srv.session_id = sess.session_id
            WHERE 
                sess.session_id = ? AND sess.patient_id = ?
        `;

        const billingResults = await executeQuery(connection, billingQuery, [sessionId, patientId]);

        // Query to get prescription information
        const prescriptionQuery = `
            SELECT 
                m.medication_name,
                m.medication_dosage,
                m.medication_frequency_duration
            FROM 
                tbl_prescription p
            JOIN 
                tbl_medication m ON p.medication_id = m.medication_id
            WHERE 
                p.session_id = ?
        `;

        const prescriptionResults = await executeQuery(connection, prescriptionQuery, [sessionId]);

        // Format the response
        const formattedResponse = {
            billing: billingResults.map(billing => ({
                serviceName: billing.service_name,
                totalFee: billing.total_fee,
                amountTendered: billing.amount_tendered,
                balance: billing.balance,
                paymentStatus: billing.payment_status
            })),
            prescriptions: prescriptionResults.map(prescription => ({
                medicationName: prescription.medication_name,
                dosage: prescription.medication_dosage,
                frequencyDuration: prescription.medication_frequency_duration
            }))
        };

        return res.json({
            success: true,
            data: formattedResponse
        });
    } catch (error) {
        console.error('Error retrieving billing information:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Database error in retrieving billing information' 
        });
    }
}
module.exports = {
    getPatientsHandler,
    getServicesOfferedHandler,
    getAppointmentHistoryHandler,
    getSessionHandler,
    getPatientSessionHandler,
    getBillingInfoHandler
}