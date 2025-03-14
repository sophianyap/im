-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 14, 2025 at 11:20 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_happyteeth`
--

-- --------------------------------------------------------

--
-- Table structure for table `tbl_address`
--

CREATE TABLE `tbl_address` (
  `address_id` int(11) NOT NULL,
  `address_street_name` text DEFAULT NULL,
  `barangay_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_address`
--

INSERT INTO `tbl_address` (`address_id`, `address_street_name`, `barangay_id`) VALUES
(0, 'Dona Luisa', 0);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_barangay`
--

CREATE TABLE `tbl_barangay` (
  `barangay_id` int(11) NOT NULL,
  `barangay_name` text DEFAULT NULL,
  `city_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_barangay`
--

INSERT INTO `tbl_barangay` (`barangay_id`, `barangay_name`, `city_id`) VALUES
(0, 'Toril', 0);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_city`
--

CREATE TABLE `tbl_city` (
  `city_id` int(11) NOT NULL,
  `city_name` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_city`
--

INSERT INTO `tbl_city` (`city_id`, `city_name`) VALUES
(0, 'Davao City');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_dentist`
--

CREATE TABLE `tbl_dentist` (
  `dentist_id` int(11) NOT NULL,
  `person_id` int(11) NOT NULL,
  `dentist_specialization` text DEFAULT NULL,
  `license_number` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_dentist`
--

INSERT INTO `tbl_dentist` (`dentist_id`, `person_id`, `dentist_specialization`, `license_number`) VALUES
(0, 0, 'Orthodontics', 'DN-1234567');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_gender`
--

CREATE TABLE `tbl_gender` (
  `gender_id` int(11) NOT NULL,
  `gender_title` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_gender`
--

INSERT INTO `tbl_gender` (`gender_id`, `gender_title`) VALUES
(0, 'Male'),
(1, 'Female');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_medical_condition`
--

CREATE TABLE `tbl_medical_condition` (
  `condition_id` int(11) NOT NULL,
  `condition_name` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_medical_condition_patient`
--

CREATE TABLE `tbl_medical_condition_patient` (
  `patient_id` int(11) NOT NULL,
  `condition_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_medical_history`
--

CREATE TABLE `tbl_medical_history` (
  `history_id` int(11) NOT NULL,
  `history_name` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_medical_history_patient`
--

CREATE TABLE `tbl_medical_history_patient` (
  `patient_id` int(11) NOT NULL,
  `history_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_medication`
--

CREATE TABLE `tbl_medication` (
  `medication_id` int(11) NOT NULL,
  `medication_name` text DEFAULT NULL,
  `medication_dosage` text DEFAULT NULL,
  `medication_frequency_duration` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_occupation`
--

CREATE TABLE `tbl_occupation` (
  `occupation_id` int(11) NOT NULL,
  `occupation_title` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_occupation`
--

INSERT INTO `tbl_occupation` (`occupation_id`, `occupation_title`) VALUES
(0, 'General Dentist');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_patient`
--

CREATE TABLE `tbl_patient` (
  `patient_id` int(11) NOT NULL,
  `person_id` int(11) NOT NULL,
  `date_added` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_patient_tooth_chart`
--

CREATE TABLE `tbl_patient_tooth_chart` (
  `patient_id` int(11) NOT NULL,
  `tooth_chart` longblob DEFAULT NULL,
  `patienttooth_remarks` text DEFAULT NULL,
  `date_added` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_person`
--

CREATE TABLE `tbl_person` (
  `person_id` int(11) NOT NULL,
  `person_last_name` text DEFAULT NULL,
  `person_first_name` text DEFAULT NULL,
  `person_middle_name` text DEFAULT NULL,
  `person_birthdate` date DEFAULT NULL,
  `gender_id` int(11) DEFAULT NULL,
  `status_id` int(11) DEFAULT NULL,
  `occupation_id` int(11) DEFAULT NULL,
  `address_id` int(11) DEFAULT NULL,
  `person_company` text DEFAULT NULL,
  `contact_number` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_person`
--

INSERT INTO `tbl_person` (`person_id`, `person_last_name`, `person_first_name`, `person_middle_name`, `person_birthdate`, `gender_id`, `status_id`, `occupation_id`, `address_id`, `person_company`, `contact_number`) VALUES
(0, 'Pacquing', 'Catherine', 'Cascabel', '1977-10-27', 1, 0, 0, 0, 'Cascabel Dental Clinic', '0951 378 5324');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_prescription`
--

CREATE TABLE `tbl_prescription` (
  `prescription_id` int(11) NOT NULL,
  `session_id` int(11) DEFAULT NULL,
  `medication_id` int(11) DEFAULT NULL,
  `special_instructions` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_service`
--

CREATE TABLE `tbl_service` (
  `service_id` int(11) NOT NULL,
  `session_id` int(11) NOT NULL,
  `service_offered_id` int(11) NOT NULL,
  `service_tooth_number` text DEFAULT NULL,
  `service_status` text DEFAULT NULL,
  `service_fee` decimal(10,2) DEFAULT NULL,
  `service_fee_status` text DEFAULT NULL,
  `service_amount_tendered` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_services_offered`
--

CREATE TABLE `tbl_services_offered` (
  `service_offered_id` int(11) NOT NULL,
  `service_offered_name` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_services_offered`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `tbl_session`
--

CREATE TABLE `tbl_session` (
  `session_id` int(11) NOT NULL,
  `patient_id` int(11) DEFAULT NULL,
  `dentist_id` int(11) DEFAULT NULL,
  `session_date` date DEFAULT NULL,
  `session_remarks` text DEFAULT NULL,
  `session_remarks_image` longblob DEFAULT NULL,
  `session_time_start` time DEFAULT NULL,
  `session_time_end` time DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_status`
--

CREATE TABLE `tbl_status` (
  `status_id` int(11) NOT NULL,
  `status_title` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_status`
--

INSERT INTO `tbl_status` (`status_id`, `status_title`) VALUES
(0, 'Single'),
(1, 'Widowed'),
(2, 'Separated'),
(3, 'Annulled');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `tbl_address`
--
ALTER TABLE `tbl_address`
  ADD PRIMARY KEY (`address_id`),
  ADD KEY `barangay_id` (`barangay_id`);

--
-- Indexes for table `tbl_barangay`
--
ALTER TABLE `tbl_barangay`
  ADD PRIMARY KEY (`barangay_id`),
  ADD KEY `city_id` (`city_id`);

--
-- Indexes for table `tbl_city`
--
ALTER TABLE `tbl_city`
  ADD PRIMARY KEY (`city_id`);

--
-- Indexes for table `tbl_dentist`
--
ALTER TABLE `tbl_dentist`
  ADD PRIMARY KEY (`dentist_id`),
  ADD KEY `person_id` (`person_id`);

--
-- Indexes for table `tbl_gender`
--
ALTER TABLE `tbl_gender`
  ADD PRIMARY KEY (`gender_id`);

--
-- Indexes for table `tbl_medical_condition`
--
ALTER TABLE `tbl_medical_condition`
  ADD PRIMARY KEY (`condition_id`);

--
-- Indexes for table `tbl_medical_condition_patient`
--
ALTER TABLE `tbl_medical_condition_patient`
  ADD PRIMARY KEY (`patient_id`,`condition_id`),
  ADD KEY `condition_id` (`condition_id`);

--
-- Indexes for table `tbl_medical_history`
--
ALTER TABLE `tbl_medical_history`
  ADD PRIMARY KEY (`history_id`);

--
-- Indexes for table `tbl_medical_history_patient`
--
ALTER TABLE `tbl_medical_history_patient`
  ADD PRIMARY KEY (`patient_id`,`history_id`),
  ADD KEY `history_id` (`history_id`);

--
-- Indexes for table `tbl_medication`
--
ALTER TABLE `tbl_medication`
  ADD PRIMARY KEY (`medication_id`);

--
-- Indexes for table `tbl_occupation`
--
ALTER TABLE `tbl_occupation`
  ADD PRIMARY KEY (`occupation_id`);

--
-- Indexes for table `tbl_patient`
--
ALTER TABLE `tbl_patient`
  ADD PRIMARY KEY (`patient_id`),
  ADD KEY `fk_person_id` (`person_id`);

--
-- Indexes for table `tbl_patient_tooth_chart`
--
ALTER TABLE `tbl_patient_tooth_chart`
  ADD PRIMARY KEY (`patient_id`);

--
-- Indexes for table `tbl_person`
--
ALTER TABLE `tbl_person`
  ADD PRIMARY KEY (`person_id`),
  ADD KEY `gender_id` (`gender_id`),
  ADD KEY `status_id` (`status_id`),
  ADD KEY `occupation_id` (`occupation_id`),
  ADD KEY `address_id` (`address_id`);

--
-- Indexes for table `tbl_prescription`
--
ALTER TABLE `tbl_prescription`
  ADD PRIMARY KEY (`prescription_id`),
  ADD KEY `session_id` (`session_id`),
  ADD KEY `medication_id` (`medication_id`);

--
-- Indexes for table `tbl_service`
--
ALTER TABLE `tbl_service`
  ADD PRIMARY KEY (`service_id`),
  ADD KEY `session_id` (`session_id`),
  ADD KEY `tbl_service_ibfk_2` (`service_offered_id`);

--
-- Indexes for table `tbl_services_offered`
--
ALTER TABLE `tbl_services_offered`
  ADD PRIMARY KEY (`service_offered_id`);

--
-- Indexes for table `tbl_session`
--
ALTER TABLE `tbl_session`
  ADD PRIMARY KEY (`session_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `dentist_id` (`dentist_id`);

--
-- Indexes for table `tbl_status`
--
ALTER TABLE `tbl_status`
  ADD PRIMARY KEY (`status_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `tbl_address`
--
ALTER TABLE `tbl_address`
  MODIFY `address_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_barangay`
--
ALTER TABLE `tbl_barangay`
  MODIFY `barangay_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_city`
--
ALTER TABLE `tbl_city`
  MODIFY `city_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_dentist`
--
ALTER TABLE `tbl_dentist`
  MODIFY `dentist_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_gender`
--
ALTER TABLE `tbl_gender`
  MODIFY `gender_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tbl_medical_condition`
--
ALTER TABLE `tbl_medical_condition`
  MODIFY `condition_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_medical_history`
--
ALTER TABLE `tbl_medical_history`
  MODIFY `history_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_medication`
--
ALTER TABLE `tbl_medication`
  MODIFY `medication_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_occupation`
--
ALTER TABLE `tbl_occupation`
  MODIFY `occupation_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_patient`
--
ALTER TABLE `tbl_patient`
  MODIFY `patient_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_patient_tooth_chart`
--
ALTER TABLE `tbl_patient_tooth_chart`
  MODIFY `patient_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_person`
--
ALTER TABLE `tbl_person`
  MODIFY `person_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_prescription`
--
ALTER TABLE `tbl_prescription`
  MODIFY `prescription_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_service`
--
ALTER TABLE `tbl_service`
  MODIFY `service_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_services_offered`
--
ALTER TABLE `tbl_services_offered`
  MODIFY `service_offered_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `tbl_session`
--
ALTER TABLE `tbl_session`
  MODIFY `session_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_status`
--
ALTER TABLE `tbl_status`
  MODIFY `status_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `tbl_address`
--
ALTER TABLE `tbl_address`
  ADD CONSTRAINT `tbl_address_ibfk_2` FOREIGN KEY (`barangay_id`) REFERENCES `tbl_barangay` (`barangay_id`);

--
-- Constraints for table `tbl_barangay`
--
ALTER TABLE `tbl_barangay`
  ADD CONSTRAINT `tbl_barangay_ibfk_1` FOREIGN KEY (`city_id`) REFERENCES `tbl_city` (`city_id`);

--
-- Constraints for table `tbl_dentist`
--
ALTER TABLE `tbl_dentist`
  ADD CONSTRAINT `person_id` FOREIGN KEY (`person_id`) REFERENCES `tbl_person` (`person_id`);

--
-- Constraints for table `tbl_medical_condition_patient`
--
ALTER TABLE `tbl_medical_condition_patient`
  ADD CONSTRAINT `tbl_medical_condition_patient_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `tbl_patient` (`patient_id`),
  ADD CONSTRAINT `tbl_medical_condition_patient_ibfk_2` FOREIGN KEY (`condition_id`) REFERENCES `tbl_medical_condition` (`condition_id`);

--
-- Constraints for table `tbl_medical_history_patient`
--
ALTER TABLE `tbl_medical_history_patient`
  ADD CONSTRAINT `tbl_medical_history_patient_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `tbl_patient` (`patient_id`),
  ADD CONSTRAINT `tbl_medical_history_patient_ibfk_2` FOREIGN KEY (`history_id`) REFERENCES `tbl_medical_history` (`history_id`);

--
-- Constraints for table `tbl_patient`
--
ALTER TABLE `tbl_patient`
  ADD CONSTRAINT `fk_person_id` FOREIGN KEY (`person_id`) REFERENCES `tbl_person` (`person_id`);

--
-- Constraints for table `tbl_patient_tooth_chart`
--
ALTER TABLE `tbl_patient_tooth_chart`
  ADD CONSTRAINT `tbl_patient_tooth_chart_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `tbl_patient` (`patient_id`);

--
-- Constraints for table `tbl_person`
--
ALTER TABLE `tbl_person`
  ADD CONSTRAINT `tbl_person_ibfk_1` FOREIGN KEY (`gender_id`) REFERENCES `tbl_gender` (`gender_id`),
  ADD CONSTRAINT `tbl_person_ibfk_2` FOREIGN KEY (`status_id`) REFERENCES `tbl_status` (`status_id`),
  ADD CONSTRAINT `tbl_person_ibfk_3` FOREIGN KEY (`occupation_id`) REFERENCES `tbl_occupation` (`occupation_id`),
  ADD CONSTRAINT `tbl_person_ibfk_4` FOREIGN KEY (`address_id`) REFERENCES `tbl_address` (`address_id`);

--
-- Constraints for table `tbl_prescription`
--
ALTER TABLE `tbl_prescription`
  ADD CONSTRAINT `tbl_prescription_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `tbl_session` (`session_id`),
  ADD CONSTRAINT `tbl_prescription_ibfk_2` FOREIGN KEY (`medication_id`) REFERENCES `tbl_medication` (`medication_id`);

--
-- Constraints for table `tbl_service`
--
ALTER TABLE `tbl_service`
  ADD CONSTRAINT `tbl_service_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `tbl_session` (`session_id`),
  ADD CONSTRAINT `tbl_service_ibfk_2` FOREIGN KEY (`service_offered_id`) REFERENCES `tbl_services_offered` (`service_offered_id`);

--
-- Constraints for table `tbl_session`
--
ALTER TABLE `tbl_session`
  ADD CONSTRAINT `tbl_session_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `tbl_patient` (`patient_id`),
  ADD CONSTRAINT `tbl_session_ibfk_2` FOREIGN KEY (`dentist_id`) REFERENCES `tbl_dentist` (`dentist_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
