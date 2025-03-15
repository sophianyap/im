# HappyTeeth

A dental clinic management system that helps track patients, appointments, services, and billing information.

## Overview

HappyTeeth is a web-based application built with Node.js and Express on the backend, using MariaDB for data storage. It provides an interface for dental clinics to manage:

- Patient records
- Appointment history
- Services offered
- Billing information
- User sessions

## Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/happyteeth.git
   cd happyteeth
   ```
2. Build the application for Docker:
   ```bash
   docker compose build
   ```

3. Start the application using Docker Compose:
   ```bash
   docker compose up -d
   ```

4. Access the application in your browser:
   ```
   http://localhost:3000
   ```

## Application Structure

- `index.js` - Main application entry point
- `api.js` - API router setup and database connection
- `api-get.js` - Handlers for GET endpoints
- `api-post.js` - Handlers for POST endpoints
- `public/` - Static web assets
- `resources/` - Database initialization scripts

## API Endpoints

### GET Endpoints
- `/api/get-patients` - Retrieves patient list
- `/api/get-services-offered` - Lists available dental services
- `/api/appointment-history` - Gets appointment history
- `/api/patient-session` - Gets patient-specific session
- `/api/getBillingInfo` - Retrieves billing information

### POST Endpoints
- `/api/add-patient` - Adds a new patient
- `/api/delete-patient` - Removes a patient
- `/api/update-patient` - Updates patient information
- `/api/store-session-data` - Stores session information

## Docker Configuration

The application runs in two containers:

1. **MariaDB** (happyteeth-mariadb):
   - Version: 10.4.32
   - Exposes port 3306
   - Configured with database name `db_happyteeth`
   - Data persisted through Docker volume

2. **Node.js Application** (happyteeth-app):
   - Built from the Dockerfile in the project
   - Exposes port 3000
   - Connects to the MariaDB container
   - Waits for the database to be ready before starting

## Configuration

Default environment variables are set in the Docker configuration:

```
PORT=3000
DB_HOST=mariadb
DB_USER=dbuser
DB_PASSWORD=dbpassword
```

You can modify these settings in the `docker-compose.yml` file if needed.

## Database

The application uses a MariaDB database with the following configuration:

- Database name: `db_happyteeth`
- User: `dbuser`
- Password: `dbpassword`
- Root password: `rootpassword`

Database initialization scripts should be placed in the `resources/` directory.

## Development

To run the application:

```bash
docker-compose up
```

To rebuild the containers after making changes:

```bash
docker compose build
docker compose up -d
```

## Stopping the Application

To stop the containers:

```bash
docker compose down
```

To stop and remove all data (including the database volume):

```bash
docker compose down -v
```

## License

MIT License
