-- Initialize tbl_services_offered
INSERT INTO `tbl_services_offered` (`service_offered_id`, `service_offered_name`) VALUES
(1, 'ROOT CANAL THERAPY'),
(2, 'TOOTH EXTRACTION'),
(3, 'DENTURES'),
(4, 'VENEERS'),
(5, 'DENTAL CLEANING'),
(6, 'COMPOSITE FILLING'),
(7, 'TOOTH WHITENING'),
(8, 'CERAMIC CROWNS'),
(9, 'DENTAL IMPLANTS'),
(10, 'ORTHODONTICS'),
(11, 'ZIRCONIA CROWNS');

-- Status
INSERT INTO tbl_status (status_id, status_title) VALUES (0, 'Single');

INSERT INTO tbl_status (status_id, status_title) VALUES (1, 'Widowed');

INSERT INTO tbl_status (status_id, status_title) VALUES (2, 'Separated');

INSERT INTO tbl_status (status_id, status_title) VALUES (3, 'Annulled');

-- Gender
INSERT INTO tbl_gender (gender_id, gender_title) VALUES (0, 'Male');

INSERT INTO tbl_gender (gender_id, gender_title) VALUES (1, 'Female');

-- Initialize doctor 
-- Address
INSERT INTO tbl_city (city_id, city_name) VALUES (0, 'Davao City');

INSERT INTO tbl_barangay (barangay_id, barangay_name, city_id) VALUES (0, 'Toril', 0);

INSERT INTO tbl_address (address_id, address_street_name, barangay_id) VALUES (0, 'Dona Luisa', 0);

INSERT INTO tbl_occupation (occupation_id, occupation_title) VALUES (0, 'General Dentist');

-- Person
INSERT INTO tbl_person (person_id, person_last_name, person_first_name, person_middle_name, person_birthdate, gender_id, status_id, occupation_id, address_id, person_company, contact_number) VALUES (0, 'Pacquing', 'Catherine', 'Cascabel', '1977-10-27', 1, 0, 0, 0, 'Cascabel Dental Clinic', '0951 378 5324');

-- Dentist
INSERT INTO tbl_dentist (dentist_id, person_id, dentist_specialization, license_number) VALUES (0, 0, 'Orthodontics', 'DN-1234567');

-- Set upload size max to 16MB
SET GLOBAL max_allowed_packet=16777216; 