/**
 * Handles updating an existing patient's information
 * @param {Object} connection - Database connection
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function updatePatientHandler(connection, req, res) {
    try {
        const patientData = req.body;

        // Validate patient ID exists
        if (!patientData.id) {
            return res.status(400).json({
                success: false,
                message: 'Patient ID is required'
            });
        }

        // Check if patient exists
        const patientExists = await checkPatientExists(connection, patientData.id);
        if (!patientExists) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found in database'
            });
        }

        // Basic validation for required fields
        const requiredFields = [
            'firstName',
            'lastName',
            'birthdate',
            'gender',
            'civilStatus',
            'mobile'
        ];

        const missingFields = requiredFields.filter(field => !patientData[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Validate address data
        if (!patientData.address || !patientData.address.city_name ||
            !patientData.address.barangay_name || !patientData.address.street_name) {
            return res.status(400).json({
                success: false,
                message: 'Complete address information is required'
            });
        }

        // Validate birthdate
        const birthDate = new Date(patientData.birthdate);
        if (isNaN(birthDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid birth date format'
            });
        }

        if (birthDate > new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Birth date cannot be in the future'
            });
        }

        // Validate Philippine mobile number (format: 09xxxxxxxxx)
        const mobileNumberRegex = /^09\d{9}$/;
        if (!mobileNumberRegex.test(patientData.mobile)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid mobile number format. Must be 11 digits starting with 09 (e.g., 09171234567)'
            });
        }

        // Begin transaction
        return await executeTransaction(connection, async () => {
            // Get the person_id associated with this patient
            const personResult = await executeQuery(
                connection,
                'SELECT person_id FROM tbl_patient WHERE patient_id = ?',
                [patientData.id]
            );
            
            if (personResult.length === 0) {
                throw new Error(`Person ID not found for patient ${patientData.id}`);
            }
            
            const personId = personResult[0].person_id;

            // 1. Process gender - we're using the ID directly as per the schema
            const genderId = patientData.gender;

            // 2. Process civil status - we're using the ID directly as per the schema
            const statusId = patientData.civilStatus;

            // 3. Process occupation
            const occupationId = await getOrCreateRecord(
                connection,
                'tbl_occupation',
                'occupation_id',
                'occupation_title',
                patientData.occupation || 'Not specified'
            );

            // 4. Process city - check if exists first
            const cityId = await getOrCreateCity(connection, patientData.address.city_name);

            // 5. Process barangay - check if exists first
            const barangayId = await getOrCreateBarangay(connection, patientData.address.barangay_name, cityId);

            // 6. Process address
            // Get current address_id for the person if it exists
            const personAddressResult = await executeQuery(
                connection,
                'SELECT address_id FROM tbl_person WHERE person_id = ?',
                [personId]
            );
            
            const currentAddressId = personAddressResult[0]?.address_id;
            
            let addressId;
            
            if (currentAddressId) {
                // Update existing address
                await executeQuery(
                    connection,
                    'UPDATE tbl_address SET address_street_name = ?, barangay_id = ? WHERE address_id = ?',
                    [patientData.address.street_name, barangayId, currentAddressId]
                );
                addressId = currentAddressId;
            } else {
                // Create new address
                const addressResult = await executeQuery(
                    connection,
                    'INSERT INTO tbl_address (address_street_name, barangay_id) VALUES (?, ?)',
                    [patientData.address.street_name, barangayId]
                );
                addressId = addressResult.insertId;
            }

            // 7. Update person information
            await executeQuery(
                connection,
                `UPDATE tbl_person SET 
                    person_last_name = ?, 
                    person_first_name = ?, 
                    person_middle_name = ?, 
                    person_birthdate = ?, 
                    gender_id = ?, 
                    status_id = ?, 
                    occupation_id = ?, 
                    address_id = ?,
                    person_company = ?, 
                    contact_number = ?
                WHERE person_id = ?`,
                [
                    patientData.lastName,
                    patientData.firstName,
                    patientData.middleName || null,
                    patientData.birthdate,
                    genderId,
                    statusId,
                    occupationId,
                    addressId,
                    patientData.company || null,
                    patientData.mobile,
                    personId
                ]
            );

            // 8. Handle medical conditions - first remove existing ones
            await executeQuery(
                connection,
                'DELETE FROM tbl_medical_condition_patient WHERE patient_id = ?',
                [patientData.id]
            );

            // 9. Add any medical conditions if provided
            if (patientData.medicalConditions && patientData.medicalConditions.length > 0) {
                for (const condition of patientData.medicalConditions) {
                    const conditionId = await getOrCreateRecord(
                        connection,
                        'tbl_medical_condition',
                        'condition_id',
                        'condition_name',
                        condition
                    );

                    await executeQuery(
                        connection,
                        'INSERT INTO tbl_medical_condition_patient (patient_id, condition_id) VALUES (?, ?)',
                        [patientData.id, conditionId]
                    );
                }
            }

            // 10. Handle medical history - first remove existing ones
            await executeQuery(
                connection,
                'DELETE FROM tbl_medical_history_patient WHERE patient_id = ?',
                [patientData.id]
            );

            // 11. Add medical history if provided
            if (patientData.medicalHistory && patientData.medicalHistory.length > 0) {
                for (const history of patientData.medicalHistory) {
                    const historyId = await getOrCreateRecord(
                        connection,
                        'tbl_medical_history',
                        'history_id',
                        'history_name',
                        history
                    );

                    await executeQuery(
                        connection,
                        'INSERT INTO tbl_medical_history_patient (patient_id, history_id) VALUES (?, ?)',
                        [patientData.id, historyId]
                    );
                }
            }

            return {
                status: 200,
                data: {
                    success: true,
                    message: 'Patient updated successfully',
                    patientId: patientData.id
                }
            };
        }, res);

    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

/**
 * Handles adding a new patient
 * @param {Object} connection - Database connection
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function addPatientHandler(connection, req, res) {
    try {
        const patientData = req.body;

        // Validate required person fields
        const requiredFields = [
            'firstName',
            'lastName',
            'birthdate',  // Changed from birthDate to match existing code
            'gender',
            'civilStatus',
            'mobile'      // Changed from mobileNumber to match existing code
        ];

        const missingFields = requiredFields.filter(field => !patientData[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Validate required address fields
        if (!patientData.address) {
            return res.status(400).json({
                success: false,
                message: 'Address information is required'
            });
        }

        const requiredAddressFields = ['street_name', 'barangay_name', 'city_name'];
        const missingAddressFields = requiredAddressFields.filter(field => !patientData.address[field]);

        if (missingAddressFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required address fields: ${missingAddressFields.join(', ')}`
            });
        }

        // Validate birthdate
        const birthDate = new Date(patientData.birthdate);
        if (isNaN(birthDate.getTime())) {
            return res.status(400).json({ success: false, message: 'Invalid birth date format' });
        }

        if (birthDate > new Date()) {
            return res.status(400).json({ success: false, message: 'Birth date cannot be in the future' });
        }

        // Validate Philippine mobile number (format: 09xxxxxxxxx)
        const mobileNumberRegex = /^09\d{9}$/;
        if (!mobileNumberRegex.test(patientData.mobile)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid mobile number format. Must be 11 digits starting with 09 (e.g., 09171234567)'
            });
        }

        // Begin transaction
        return await executeTransaction(connection, async () => {
            // 1. Process gender - using the ID directly
            const genderId = patientData.gender;

            // 2. Process civil status - using the ID directly
            const statusId = patientData.civilStatus;

            // 3. Process occupation
            const occupationId = await getOrCreateRecord(
                connection,
                'tbl_occupation',
                'occupation_id',
                'occupation_title',
                patientData.occupation || 'Not specified'
            );

            // 4. Process city - check if exists first
            const cityId = await getOrCreateCity(connection, patientData.address.city_name);

            // 5. Process barangay - check if exists first
            const barangayId = await getOrCreateBarangay(connection, patientData.address.barangay_name, cityId);

            // 6. Create address
            const addressResult = await executeQuery(
                connection,
                'INSERT INTO tbl_address (address_street_name, barangay_id) VALUES (?, ?)',
                [patientData.address.street_name, barangayId]
            );
            
            const addressId = addressResult.insertId;

            // 7. Insert into tbl_person
            const personInsertResult = await executeQuery(
                connection,
                `INSERT INTO tbl_person (
                    person_last_name, 
                    person_first_name, 
                    person_middle_name, 
                    person_birthdate, 
                    gender_id, 
                    status_id, 
                    occupation_id, 
                    address_id,
                    person_company, 
                    contact_number
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    patientData.lastName,
                    patientData.firstName,
                    patientData.middleName || null,
                    patientData.birthdate,
                    genderId,
                    statusId,
                    occupationId,
                    addressId,
                    patientData.company || null,
                    patientData.mobile
                ]
            );

            const personId = personInsertResult.insertId;

            // 8. Insert into tbl_patient
            const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            const patientInsertResult = await executeQuery(
                connection,
                'INSERT INTO tbl_patient (date_added, person_id) VALUES (?, ?)',
                [currentDate, personId]
            );

            const patientId = patientInsertResult.insertId;

            // 9. Add any medical conditions if provided
            if (patientData.medicalConditions && patientData.medicalConditions.length > 0) {
                for (const condition of patientData.medicalConditions) {
                    const conditionId = await getOrCreateRecord(
                        connection,
                        'tbl_medical_condition',
                        'condition_id',
                        'condition_name',
                        condition
                    );

                    await executeQuery(
                        connection,
                        'INSERT INTO tbl_medical_condition_patient (patient_id, condition_id) VALUES (?, ?)',
                        [patientId, conditionId]
                    );
                }
            }

            // 10. Add medical history if provided
            if (patientData.medicalHistory && patientData.medicalHistory.length > 0) {
                for (const history of patientData.medicalHistory) {
                    const historyId = await getOrCreateRecord(
                        connection,
                        'tbl_medical_history',
                        'history_id',
                        'history_name',
                        history
                    );

                    await executeQuery(
                        connection,
                        'INSERT INTO tbl_medical_history_patient (patient_id, history_id) VALUES (?, ?)',
                        [patientId, historyId]
                    );
                }
            }

            return {
                status: 201,
                data: {
                    success: true,
                    message: 'Patient added successfully',
                    patientId: patientId
                }
            };
        }, res);

    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

/**
 * Handles deleting a patient and all associated records
 * @param {Object} connection - Database connection
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function deletePatientHandler(connection, req, res) {
    try {
        if (!req.query.id) {
            return res.status(400).json({ success: false, message: 'Patient id not provided!' });
        }

        const patientId = req.query.id;

        // Check if patient exists
        const patientExists = await checkPatientExists(connection, patientId);
        if (!patientExists) {
            return res.status(404).json({ success: false, message: 'Patient not found in database!' });
        }

        // Start transaction and perform deletion
        return await executeTransaction(connection, async () => {
            // Step 1: Get the person_id and address_id
            const personResult = await executeQuery(
                connection,
                `SELECT p.person_id, p.address_id 
                 FROM tbl_patient tp 
                 JOIN tbl_person p ON tp.person_id = p.person_id 
                 WHERE tp.patient_id = ?`,
                [patientId]
            );
            
            if (personResult.length === 0) {
                throw new Error(`Patient with ID ${patientId} not found`);
            }
            
            const personId = personResult[0].person_id;
            const addressId = personResult[0].address_id;
            
            // Step 2: Delete related data in the correct order (respecting foreign key constraints)
            
            // Delete medical condition relationships
            await executeQuery(
                connection,
                `DELETE FROM tbl_medical_condition_patient WHERE patient_id = ?`,
                [patientId]
            );

            // Delete medical history relationships
            await executeQuery(
                connection,
                `DELETE FROM tbl_medical_history_patient WHERE patient_id = ?`,
                [patientId]
            );

            // Delete patient tooth chart
            await executeQuery(
                connection,
                `DELETE FROM tbl_patient_tooth_chart WHERE patient_id = ?`,
                [patientId]
            );

            // Get all session IDs for this patient
            const sessions = await executeQuery(
                connection,
                `SELECT session_id FROM tbl_session WHERE patient_id = ?`,
                [patientId]
            );
            
            const sessionIds = sessions.map(session => session.session_id);
            
            // Process sessions if any exist
            if (sessionIds.length > 0) {
                // Delete prescriptions related to sessions
                await executeQuery(
                    connection,
                    `DELETE FROM tbl_prescription WHERE session_id IN (?)`,
                    [sessionIds]
                );
                
                // Delete services related to sessions
                await executeQuery(
                    connection,
                    `DELETE FROM tbl_service WHERE session_id IN (?)`,
                    [sessionIds]
                );
                
                // Delete all sessions
                await executeQuery(
                    connection,
                    `DELETE FROM tbl_session WHERE patient_id = ?`,
                    [patientId]
                );
            }
            
            // Delete patient record
            await executeQuery(
                connection,
                `DELETE FROM tbl_patient WHERE patient_id = ?`,
                [patientId]
            );
            
            // Delete the person record
            await executeQuery(
                connection,
                `DELETE FROM tbl_person WHERE person_id = ?`,
                [personId]
            );
            
            // Check if address can be deleted (no other person uses it)
            if (addressId) {
                const addressUsageCount = await executeQuery(
                    connection,
                    `SELECT COUNT(*) as count FROM tbl_person WHERE address_id = ?`,
                    [addressId]
                );
                
                if (addressUsageCount[0].count === 0) {
                    // Get barangay_id before deleting the address
                    const addressInfo = await executeQuery(
                        connection,
                        `SELECT barangay_id FROM tbl_address WHERE address_id = ?`,
                        [addressId]
                    );
                    
                    const barangayId = addressInfo[0]?.barangay_id;
                    
                    // Delete the address
                    await executeQuery(
                        connection,
                        `DELETE FROM tbl_address WHERE address_id = ?`,
                        [addressId]
                    );
                    
                    // Check if we need to clean up unused barangay
                    if (barangayId) {
                        const barangayUsageCount = await executeQuery(
                            connection,
                            `SELECT COUNT(*) as count FROM tbl_address WHERE barangay_id = ?`,
                            [barangayId]
                        );
                        
                        if (barangayUsageCount[0].count === 0) {
                            // Get city_id before deleting the barangay
                            const barangayInfo = await executeQuery(
                                connection,
                                `SELECT city_id FROM tbl_barangay WHERE barangay_id = ?`,
                                [barangayId]
                            );
                            
                            const cityId = barangayInfo[0]?.city_id;
                            
                            // Delete the barangay
                            await executeQuery(
                                connection,
                                `DELETE FROM tbl_barangay WHERE barangay_id = ?`,
                                [barangayId]
                            );
                            
                            // Check if we need to clean up unused city
                            if (cityId) {
                                const cityUsageCount = await executeQuery(
                                    connection,
                                    `SELECT COUNT(*) as count FROM tbl_barangay WHERE city_id = ?`,
                                    [cityId]
                                );
                                
                                if (cityUsageCount[0].count === 0) {
                                    // Delete the city
                                    await executeQuery(
                                        connection,
                                        `DELETE FROM tbl_city WHERE city_id = ?`,
                                        [cityId]
                                    );
                                }
                            }
                        }
                    }
                }
            }

            return {
                status: 200,
                data: {
                    success: true,
                    message: 'Patient and all related data deleted successfully'
                }
            };
        }, res);
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}


async function handleSessionDataStorage(connection, req, res) {
    try {
        // Extract session data from request
        const sessionData = req.body;
        
        if (!sessionData) {
            return res.status(400).json({ error: "No session data provided" });
        }
        
        // Set default dentist ID to 0 as specified
        const dentistId = 0;
        
        // 1. Insert session record
        const sessionResult = await insertSessionRecord(connection, sessionData, dentistId);
        const sessionId = sessionResult.insertId;
        
        // 2. Insert service records
        if (sessionData.service_values && sessionData.service_values.length > 0) {
            await insertServiceRecords(connection, sessionData.service_values, sessionId);
        }
        
        // 3. Insert prescription records
        if (sessionData.prescriptions && sessionData.prescriptions.length > 0) {
            await insertPrescriptionRecords(connection, sessionData.prescriptions, sessionId);
        }
        
        // 4. Update patient tooth chart if present
        if (sessionData.tooth_chart_image) {
            await updatePatientToothChart(connection, sessionData.patient_id, sessionData.tooth_chart_image);
        }
        
        return res.status(200).json({ 
            success: true, 
            message: "Session data stored successfully", 
            sessionId: sessionId 
        });
        
    } catch (error) {
        console.error("Error storing session data:", error);
        return res.status(500).json({ error: "Failed to store session data: " + error.message });
    }
}


// Insert session record in tbl_session
// Modified insertSessionRecord function to handle session_remarks_image
async function insertSessionRecord(connection, sessionData, dentistId) {
    // Get current date and time
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const currentTime = currentDate.toTimeString().split(' ')[0]; // Format: HH:MM:SS
    
    // Extract the base64 data from the data URL for session remarks image
    let sessionRemarksImageBuffer = null;
    if (sessionData.session_remarks_image) {
        // Check if the data is a data URL (starts with "data:")
        if (sessionData.session_remarks_image.startsWith('data:')) {
            // Extract the base64 part after the comma
            const base64Data = sessionData.session_remarks_image.split(',')[1];
            sessionRemarksImageBuffer = Buffer.from(base64Data, 'base64');
        } else {
            // If it's already in base64 format without the data URL prefix
            sessionRemarksImageBuffer = Buffer.from(sessionData.session_remarks_image, 'base64');
        }
    }
    
    // Prepare the SQL query
    const query = `
        INSERT INTO tbl_session 
        (patient_id, dentist_id, session_date, session_remarks, session_remarks_image, session_time_start, session_time_end) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    // Execute the query with parameters
    return new Promise((resolve, reject) => {
        connection.query(
            query,
            [
                sessionData.patient_id,
                dentistId,
                formattedDate,
                sessionData.session_remarks || '',
                sessionRemarksImageBuffer, // This will properly store the canvas image as LONGBLOB
                currentTime,
                currentTime // For simplicity, using same time for start and end
            ],
            (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            }
        );
    });
}


// Insert service records in tbl_service
async function insertServiceRecords(connection, services, sessionId) {
    const serviceInsertPromises = services.map(async service => {
        // Ensure service_offered_id is provided
        const serviceOfferedId = service.service_offered_id;
        if (!serviceOfferedId) {
            throw new Error('Service offered ID is required');
        }

        const sql = `
            INSERT INTO tbl_service 
            (session_id, service_offered_id, service_tooth_number, service_status, service_fee, service_fee_status, service_amount_tendered) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        const values = [
            sessionId,
            serviceOfferedId,  // Ensure this is not null
            service.tooth || null,
            service.remarkId || 'Incomplete',
            service.fee || 0.00,
            service.status || 'UNPAID',
            service.tendered || 0.00
        ];
        
        return executeQuery(connection, sql, values);
    });
    
    return await Promise.all(serviceInsertPromises);
}

// Insert prescription records in tbl_prescription and tbl_medication
async function insertPrescriptionRecords(connection, prescriptions, sessionId) {
    const prescriptionPromises = prescriptions.map(async prescription => {
        // First insert the medication
        const medicationSql = `
            INSERT INTO tbl_medication 
            (medication_name, medication_dosage, medication_frequency_duration) 
            VALUES (?, ?, ?)
        `;
        
        const medicationValues = [
            prescription.medication,
            prescription.dosage || null,
            prescription.frequencyDuration || null
        ];
        
        const medicationResult = await executeQuery(connection, medicationSql, medicationValues);
        const medicationId = medicationResult.insertId;
        
        // Then insert the prescription
        const prescriptionSql = `
            INSERT INTO tbl_prescription 
            (session_id, medication_id, special_instructions) 
            VALUES (?, ?, ?)
        `;
        
        const prescriptionValues = [
            sessionId,
            medicationId,
            null // special instructions if needed
        ];
        
        return executeQuery(connection, prescriptionSql, prescriptionValues);
    });
    
    return await Promise.all(prescriptionPromises);
}

// Update patient tooth chart
async function updatePatientToothChart(connection, patientId, toothChartImage) {
    // Extract the base64 data from the data URL for tooth chart image
    let toothChartImageBuffer = null;
    
    // Check if the data is a data URL (starts with "data:")
    if (toothChartImage.startsWith('data:')) {
        // Extract the base64 part after the comma
        const base64Data = toothChartImage.split(',')[1];
        toothChartImageBuffer = Buffer.from(base64Data, 'base64');
    } else {
        // If it's already in base64 format without the data URL prefix
        toothChartImageBuffer = Buffer.from(toothChartImage, 'base64');
    }
    
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    // Check if a record already exists for this patient
    const checkQuery = "SELECT patient_id FROM tbl_patient_tooth_chart WHERE patient_id = ?";
    
    return new Promise((resolve, reject) => {
        connection.query(checkQuery, [patientId], (error, results) => {
            if (error) {
                reject(error);
                return;
            }
            
            if (results.length > 0) {
                // Update existing record
                const updateQuery = "UPDATE tbl_patient_tooth_chart SET tooth_chart = ?, date_added = ? WHERE patient_id = ?";
                connection.query(updateQuery, [toothChartImageBuffer, formattedDate, patientId], (error, results) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results);
                    }
                });
            } else {
                // Insert new record
                const insertQuery = "INSERT INTO tbl_patient_tooth_chart (patient_id, tooth_chart, date_added) VALUES (?, ?, ?)";
                connection.query(insertQuery, [patientId, toothChartImageBuffer, formattedDate], (error, results) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results);
                    }
                });
            }
        });
    });
}

// Helper function to save image to filesystem
function saveImageToFileSystem(base64Image, patientId) {
    return new Promise((resolve, reject) => {
        if (!base64Image.startsWith('data:')) {
            return resolve(base64Image); // Already a path, not base64
        }
        
        const fs = require('fs');
        const path = require('path');
        
        // Extract actual base64 data and determine file type
        const matches = base64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return reject(new Error('Invalid base64 string'));
        }
        
        const imageType = matches[1].split('/')[1];
        const base64Data = matches[2];
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        // Create directory if it doesn't exist
        const uploadDir = path.join(__dirname, '../uploads/tooth_charts');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        // Generate unique filename
        const filename = `patient_${patientId}_chart_${Date.now()}.${imageType}`;
        const filepath = path.join(uploadDir, filename);
        
        // Write file
        fs.writeFile(filepath, imageBuffer, (err) => {
            if (err) return reject(err);
            
            // Return relative path to be stored in database
            resolve(`/uploads/tooth_charts/${filename}`);
        });
    });
}

// Helper Functions

/**
 * Gets or creates a city record
 * @param {Object} connection - Database connection
 * @param {string} cityName - Name of the city
 * @returns {Promise<number>} - City ID
 */
async function getOrCreateCity(connection, cityName) {
    const cityResults = await executeQuery(
        connection,
        'SELECT city_id FROM tbl_city WHERE city_name = ?',
        [cityName]
    );

    if (cityResults.length > 0) {
        return cityResults[0].city_id;
    } else {
        const cityInsertResult = await executeQuery(
            connection,
            'INSERT INTO tbl_city (city_name) VALUES (?)',
            [cityName]
        );
        return cityInsertResult.insertId;
    }
}

/**
 * Gets or creates a barangay record
 * @param {Object} connection - Database connection
 * @param {string} barangayName - Name of the barangay
 * @param {number} cityId - ID of the city
 * @returns {Promise<number>} - Barangay ID
 */
async function getOrCreateBarangay(connection, barangayName, cityId) {
    const barangayResults = await executeQuery(
        connection,
        'SELECT barangay_id FROM tbl_barangay WHERE barangay_name = ? AND city_id = ?',
        [barangayName, cityId]
    );

    if (barangayResults.length > 0) {
        return barangayResults[0].barangay_id;
    } else {
        const barangayInsertResult = await executeQuery(
            connection,
            'INSERT INTO tbl_barangay (barangay_name, city_id) VALUES (?, ?)',
            [barangayName, cityId]
        );
        return barangayInsertResult.insertId;
    }
}

/**
 * Inserts an address if it doesn't already exist
 * @param {Object} connection - Database connection
 * @param {string} streetName - Street name
 * @param {number} personId - Person ID
 * @param {number} barangayId - Barangay ID
 * @returns {Promise<void>}
 */
async function insertAddressIfNotExists(connection, streetName, personId, barangayId) {
    // New implementation to match schema - address is no longer tied to person_id in the table structure
    const addressResults = await executeQuery(
        connection,
        'SELECT address_id FROM tbl_address WHERE address_street_name = ? AND barangay_id = ?',
        [streetName, barangayId]
    );

    let addressId;
    if (addressResults.length === 0) {
        const result = await executeQuery(
            connection,
            'INSERT INTO tbl_address (address_street_name, barangay_id) VALUES (?, ?)',
            [streetName, barangayId]
        );
        addressId = result.insertId;
    } else {
        addressId = addressResults[0].address_id;
    }

    // Update the person record with the address_id
    await executeQuery(
        connection,
        'UPDATE tbl_person SET address_id = ? WHERE person_id = ?',
        [addressId, personId]
    );
}
/**
 * Checks if a patient exists in the database
 * @param {Object} connection - Database connection
 * @param {number} patientId - Patient ID to check
 * @returns {Promise<boolean>} - True if patient exists
 */
function checkPatientExists(connection, patientId) {
    return new Promise((resolve, reject) => {
        const checkQuery = `SELECT EXISTS(SELECT 1 FROM tbl_patient WHERE patient_id = ?) AS \`exists\`;`;
        connection.query(checkQuery, [patientId], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                reject(err);
                return;
            }
            resolve(results[0].exists === 1);
        });
    });
}

/**
 * Gets the person_id for a patient
 * @param {Object} connection - Database connection
 * @param {number} patientId - Patient ID 
 * @returns {Promise<number>} - Person ID
 */
function getPersonId(connection, patientId) {
    return new Promise((resolve, reject) => {
        const query = `SELECT person_id FROM tbl_patient WHERE patient_id = ?;`;
        connection.query(query, [patientId], (err, results) => {
            if (err) {
                reject(err);
                return;
            }
            if (results.length === 0) {
                reject(new Error(`Patient with ID ${patientId} not found`));
                return;
            }
            resolve(results[0].person_id);
        });
    });
}

/**
 * Gets all session IDs for a patient
 * @param {Object} connection - Database connection
 * @param {number} patientId - Patient ID
 * @returns {Promise<Array>} - Array of session IDs
 */
function getSessionIds(connection, patientId) {
    return new Promise((resolve, reject) => {
        const query = `SELECT session_id FROM tbl_session WHERE patient_id = ?;`;
        connection.query(query, [patientId], (err, results) => {
            if (err) {
                reject(err);
                return;
            }
            const sessionIds = results.map(row => row.session_id);
            resolve(sessionIds);
        });
    });
}

/**
 * Executes a database query as a promise
 * @param {Object} connection - Database connection
 * @param {string} query - SQL query to execute
 * @param {Array} [params=[]] - Parameters for the query
 * @returns {Promise<Object>} - Query results
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
 * Gets or creates a record in a lookup table
 * @param {Object} connection - Database connection
 * @param {string} tableName - Table name
 * @param {string} idField - ID field name
 * @param {string} titleField - Title field name
 * @param {string} titleValue - Value to look up or create
 * @returns {Promise<number>} - ID of existing or new record
 */
async function getOrCreateRecord(connection, tableName, idField, titleField, titleValue) {
    const checkQuery = `SELECT ${idField} FROM ${tableName} WHERE ${titleField} = ?`;
    const results = await executeQuery(connection, checkQuery, [titleValue]);

    if (results.length > 0) {
        return results[0][idField];
    } else {
        // Insert new record if it doesn't exist
        const insertQuery = `INSERT INTO ${tableName} (${titleField}) VALUES (?)`;
        const insertResult = await executeQuery(connection, insertQuery, [titleValue]);
        return insertResult.insertId;
    }
}

/**
 * Executes a transaction with proper error handling
 * @param {Object} connection - Database connection
 * @param {Function} callback - Transaction callback
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} - Transaction result
 */
async function executeTransaction(connection, callback, res) {
    return new Promise((resolve, reject) => {
        connection.beginTransaction(async (err) => {
            if (err) {
                console.error('Error starting transaction:', err);
                res.status(500).json({ success: false, message: 'Database error' });
                reject(err);
                return;
            }

            try {
                const result = await callback();

                connection.commit((err) => {
                    if (err) {
                        return connection.rollback(() => {
                            console.error('Error committing transaction:', err);
                            res.status(500).json({ success: false, message: 'Database error during commit' });
                            reject(err);
                        });
                    }

                    res.status(result.status).json(result.data);
                    resolve(result);
                });
            } catch (error) {
                connection.rollback(() => {
                    console.error('Transaction error:', error);
                    res.status(500).json({ success: false, message: 'Database error during operation' });
                    reject(error);
                });
            }
        });
    });
}

module.exports = {
    addPatientHandler,
    deletePatientHandler,
    updatePatientHandler,
    handleSessionDataStorage
}