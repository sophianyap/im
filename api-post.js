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
            'middleName',
            'lastName',
            'birthdate',
            'gender',
            'civilStatus',
            'occupation',
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
            const personId = await getPersonId(connection, patientData.id);

            // 1. Process gender
            const genderId = await getOrCreateRecord(
                connection, 
                'tbl_gender', 
                'gender_id', 
                'gender_title', 
                patientData.gender
            );

            // 2. Process civil status
            const statusId = await getOrCreateRecord(
                connection, 
                'tbl_status', 
                'status_id', 
                'status_title', 
                patientData.civilStatus
            );

            // 3. Process occupation
            const occupationId = await getOrCreateRecord(
                connection, 
                'tbl_occupation', 
                'occupation_id', 
                'occupation_title', 
                patientData.occupation
            );

            // 4. Update person information
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
                    person_company = ?, 
                    contact_number = ?
                WHERE person_id = ?`,
                [
                    patientData.lastName,
                    patientData.firstName,
                    patientData.middleName,
                    patientData.birthdate,
                    genderId,
                    statusId,
                    occupationId,
                    patientData.company || null,
                    patientData.mobile,
                    personId
                ]
            );

            // 5. Process city - check if exists first
            const cityId = await getOrCreateCity(connection, patientData.address.city_name);

            // 6. Process barangay - check if exists first
            const barangayId = await getOrCreateBarangay(connection, patientData.address.barangay_name, cityId);

            // 7. Update address information
            const addressResult = await executeQuery(
                connection,
                'SELECT address_id FROM tbl_address WHERE person_id = ?',
                [personId]
            );

            if (addressResult.length > 0) {
                // Update existing address
                await executeQuery(
                    connection,
                    'UPDATE tbl_address SET address_street_name = ?, barangay_id = ? WHERE person_id = ?',
                    [patientData.address.street_name, barangayId, personId]
                );
            } else {
                // Insert new address if none exists
                await executeQuery(
                    connection,
                    'INSERT INTO tbl_address (address_street_name, person_id, barangay_id) VALUES (?, ?, ?)',
                    [patientData.address.street_name, personId, barangayId]
                );
            }

            // 8. Handle medical conditions - first remove existing ones
            await executeQuery(
                connection,
                'DELETE FROM tbl_medical_condition WHERE patient_id = ?',
                [patientData.id]
            );

            // Add new medical conditions
            if (patientData.medicalConditions && patientData.medicalConditions.length > 0) {
                for (const condition of patientData.medicalConditions) {
                    await executeQuery(
                        connection,
                        'INSERT INTO tbl_medical_condition (patient_id, remarks) VALUES (?, ?)',
                        [patientData.id, condition]
                    );
                }
            }

            // 9. Handle medical history/medications - first remove existing ones
            await executeQuery(
                connection,
                'DELETE FROM tbl_medical_history WHERE patient_id = ?',
                [patientData.id]
            );

            // Add new medications
            if (patientData.medicalHistory && patientData.medicalHistory.length > 0) {
                for (const medication of patientData.medicalHistory) {
                    await executeQuery(
                        connection,
                        'INSERT INTO tbl_medical_history (patient_id, remarks) VALUES (?, ?)',
                        [patientData.id, medication]
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

        console.log(req.body);

        // Validate required person fields
        const requiredFields = [
            'firstName',
            'lastName',
            'birthDate',
            'gender',
            'civilStatus',
            'mobileNumber'
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

        const requiredAddressFields = ['street', 'barangay', 'city'];
        const missingAddressFields = requiredAddressFields.filter(field => !patientData.address[field]);

        if (missingAddressFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required address fields: ${missingAddressFields.join(', ')}`
            });
        }

        // Validate birthdate
        const birthDate = new Date(patientData.birthDate);
        if (isNaN(birthDate.getTime())) {
            return res.status(400).json({ success: false, message: 'Invalid birth date format' });
        }

        if (birthDate > new Date()) {
            return res.status(400).json({ success: false, message: 'Birth date cannot be in the future' });
        }

        // Validate Philippine mobile number (format: 09xxxxxxxxx)
        const mobileNumberRegex = /^09\d{9}$/;
        if (!mobileNumberRegex.test(patientData.mobileNumber)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid mobile number format. Must be 11 digits starting with 09 (e.g., 09171234567)'
            });
        }

        // Validate medical history if provided
        if (patientData.currentMedications && !Array.isArray(patientData.currentMedications)) {
            return res.status(400).json({
                success: false,
                message: 'Current medications must be an array'
            });
        }

        // Begin transaction
        return await executeTransaction(connection, async () => {
            // 1. Process gender
            const genderId = await getOrCreateRecord(
                connection, 
                'tbl_gender', 
                'gender_id', 
                'gender_title', 
                patientData.gender
            );

            // 2. Process civil status
            const statusId = await getOrCreateRecord(
                connection, 
                'tbl_status', 
                'status_id', 
                'status_title', 
                patientData.civilStatus
            );

            // 3. Process occupation
            const occupationId = await getOrCreateRecord(
                connection, 
                'tbl_occupation', 
                'occupation_id', 
                'occupation_title', 
                patientData.occupation
            );

            // 4. Insert into tbl_person
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
                    person_company, 
                    contact_number
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    patientData.lastName,
                    patientData.firstName,
                    patientData.middleName || null,
                    patientData.birthDate,
                    genderId,
                    statusId,
                    occupationId,
                    patientData.company || null,
                    patientData.mobileNumber
                ]
            );
            
            const personId = personInsertResult.insertId;

            // 5. Insert into tbl_patient
            const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            const patientInsertResult = await executeQuery(
                connection,
                'INSERT INTO tbl_patient (date_added, person_id) VALUES (?, ?)',
                [currentDate, personId]
            );
            
            const patientId = patientInsertResult.insertId;

            // 6. Process city - check if exists first
            const cityId = await getOrCreateCity(connection, patientData.address.city);

            // 7. Process barangay - check if exists first
            const barangayId = await getOrCreateBarangay(connection, patientData.address.barangay, cityId);

            // 8. Insert into tbl_address (after checking if it already exists)
            await insertAddressIfNotExists(
                connection, 
                patientData.address.street, 
                personId, 
                barangayId
            );

            // 9. Add any medical conditions if provided
            if (patientData.medicalConditions && patientData.medicalConditions.length > 0) {
                for (const condition of patientData.medicalConditions) {
                    await executeQuery(
                        connection,
                        'INSERT INTO tbl_medical_condition (patient_id, remarks) VALUES (?, ?)',
                        [patientId, condition]
                    );
                }
            }

            // 10. Add medical history if provided
            if (patientData.currentMedications && patientData.currentMedications.length > 0) {
                for (const medication of patientData.currentMedications) {
                    await executeQuery(
                        connection,
                        'INSERT INTO tbl_medical_history (patient_id, remarks) VALUES (?, ?)',
                        [patientId, medication]
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
            return res.status(404).json({ success: false, message: 'Patient not in database!' });
        }
        
        // Start transaction and perform deletion
        return await executeTransaction(connection, async () => {
            // Step 1: Get the person_id and session_ids
            const personId = await getPersonId(connection, patientId);
            const sessionIds = await getSessionIds(connection, patientId);
            
            // Step 2: Delete related data in the correct order
            // Delete patient tooth chart if exists
            await executeQuery(connection, 
                `DELETE FROM tbl_patient_tooth_chart WHERE patient_id = ?;`, 
                [patientId]
            );
            
            // Delete medical conditions and history
            await executeQuery(connection, 
                `DELETE FROM tbl_medical_condition WHERE patient_id = ?;`, 
                [patientId]
            );
            
            await executeQuery(connection, 
                `DELETE FROM tbl_medical_history WHERE patient_id = ?;`, 
                [patientId]
            );
            
            if (sessionIds.length > 0) {
                // Handle session-related deletions
                // Create placeholders for the IN clause
                const sessionPlaceholders = sessionIds.map(() => '?').join(',');
                
                // Delete prescriptions related to sessions
                await executeQuery(connection, 
                    `DELETE FROM tbl_prescription WHERE session_id IN (${sessionPlaceholders});`, 
                    sessionIds
                );
                
                // Delete services related to sessions
                await executeQuery(connection, 
                    `DELETE FROM tbl_service WHERE session_id IN (${sessionPlaceholders});`, 
                    sessionIds
                );
            }
            
            // Delete sessions
            await executeQuery(connection, 
                `DELETE FROM tbl_session WHERE patient_id = ?;`, 
                [patientId]
            );
            
            // Delete patient record
            await executeQuery(connection, 
                `DELETE FROM tbl_patient WHERE patient_id = ?;`, 
                [patientId]
            );
            
            // Delete address record
            await executeQuery(connection, 
                `DELETE FROM tbl_address WHERE person_id = ?;`, 
                [personId]
            );
            
            // Finally delete person record
            await executeQuery(connection, 
                `DELETE FROM tbl_person WHERE person_id = ?;`, 
                [personId]
            );

            return {
                status: 200,
                data: {
                    success: true, 
                    message: 'Patient and all related data deleted successfully!'
                }
            };
        }, res);
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
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
    const addressResults = await executeQuery(
        connection,
        'SELECT address_id FROM tbl_address WHERE address_street_name = ? AND person_id = ? AND barangay_id = ?',
        [streetName, personId, barangayId]
    );

    if (addressResults.length === 0) {
        await executeQuery(
            connection,
            'INSERT INTO tbl_address (address_street_name, person_id, barangay_id) VALUES (?, ?, ?)',
            [streetName, personId, barangayId]
        );
    }
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
    updatePatientHandler
}