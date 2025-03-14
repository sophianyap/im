const express = require('express')
const api = express.Router()
const mysql = require('mysql');
const apiGetHandlers = require('./api-get.js')
const apiPostHandlers = require('./api-post.js')

const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: "db_happyteeth",
    dateStrings: true
});

connection.connect(function (err) {
    if (err) throw err;
});

// GET handlers
api.get(`/get-patients`, async (req, res) => {
    return await apiGetHandlers.getPatientsHandler(connection, req, res);
});

api.get(`/get-services-offered`, async (req, res) => {
    return await apiGetHandlers.getServicesOfferedHandler(connection, req, res);
});

api.get('/appointment-history', (req, res) => apiGetHandlers.getAppointmentHistoryHandler(connection, req, res));
api.get('/session', (req, res) => apiGetHandlers.getSessionHandler(connection, req, res));
api.get('/patient-session', (req, res) => apiGetHandlers.getPatientSessionHandler(connection, req, res));
api.get('/getBillingInfo', (req, res) => apiGetHandlers.getBillingInfoHandler(connection, req, res));

// POST handlers
api.post(`/add-patient`, async (req, res) => {
    return await apiPostHandlers.addPatientHandler(connection, req, res);
});

api.post('/delete-patient', async (req, res) => {
    return await apiPostHandlers.deletePatientHandler(connection, req, res);
});

api.post('/update-patient', async (req, res) => {
    return await apiPostHandlers.updatePatientHandler(connection, req, res);
});

api.post('/store-session-data', async (req, res) => {
    return await apiPostHandlers.handleSessionDataStorage(connection, req, res);
});

module.exports = api