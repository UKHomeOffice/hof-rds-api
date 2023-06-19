# HOF RDS API Service
Provides a service layer to read, create and delete reports from a SQL table.

**Reading:**  The main application will make a request to this api.  This service will then connect to the database, get the data back and send it to the main application if it is successful

**Saving:** The main application will send the data to this service as an end point.  This service will connect to a database and store that data and respond back to the main application if successful

## Database connection
This repo uses knex which, if NODE_ENV is not set, will try to connect to a localhost instance of postgres. If it is set, it will try to use the below environmental variables `DB_HOST` etc... to connect to a formal DB using the proper credentials.

## Env Vars
You can set the following to specific how you want your results to look:
- `MAX_PAYLOAD_SIZE` - Max payload size for request bodies. Increase this is request body sizes contain base64 strings for storing thumbnail images into the save & return 'session' data
- `PORT` - Custom port you can run this service on
- `MAX_DATA_AGE` - Max age in days of data before it is cleaned from the RDS instance
- `SERVICE_NAME` - This specifies which HOF service to use migrations, seeds and db config from in the './services' folder
- `LATEST_MIGRATION` - This is the latest migration you wanted automated migrations to run up to based on the migration names in the relevant service folder under './services'
- `CLIENT` - This is the database client type. This defaults to postgresql.
- `DB_HOST`,`DB_USER`,`DB_PASS`,`DB_NAME` - These are production credentials for accessing the relevant database.

## Local Setup
The migrations and seeds folders are used by knex to setup a local DB with dummy information for testing the service. These are not used in production where it is assumed a separate DB is setup for knex to connect to that is already setup.

Run the following commands to setup a test DB:
```
brew install postgres
brew services start postgresql
psql postgres
CREATE ROLE knex WITH LOGIN PASSWORD 'knex';
ALTER ROLE knex WITH SUPERUSER;
CREATE DATABASE <DB_NAME>;
\q
```
If you download Postico for Mac (https://eggerapps.at/postico/), you can then inspect your postgres DB for example and look at the test entries inserted into the test table 'Reports'.

You then need to use a knexfile with migrations and seeds folders to populate your database.
The ms-schema repo which is used for migrations in the Modern Slavery service (https://github.com/UKHomeOffice/ms-schema) can be used as a test example and is included in this project. You can run
```
yarn run db:setup
```
from that repo to setup your database.

Setup a '.env' file for the service you want to test this against. For example:
```
SERVICE_NAME=asc
NODE_ENV=local
LATEST_MIGRATION=20230428215725_saved_applications (optional - otherwise runs all migrations)
```
Then run `yarn db:local:migrate` to update your local database with the relevant migrations for local testing.

## Install & Run <a name="install-and-run"></a>
The application can be run on your local machine

## Creating a migration
To create a new migration, go into the relevant service folder, i.e. `cd ./services/asc`, ensure you have `npm i knex -g` and run:
```
knex migrate:make <migration_name>
```
This will then create the new migration in the migrations folder of the service

### Dependencies <a name="dependencies"></a>
You will need to have the following installed:

[Node JS](https://nodejs.org/en/download/releases/) ( LTS Erbium v14.x )

[npm](https://www.npmjs.com/get-npm) ( v6.x )

[PostgreSQL](https://www.postgresql.org/download/) ( v12.x )

## Running the application

Ensure your database service is available and running.

Then to run the service use:

 ```npm start``` to run the server.

With the server running you can run the main app with save and return lookup UI functionality.
See details of how to do this in [modern slavery](https://github.com/UKHomeOffice/modern-slavery) application
