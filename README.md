# SunSmart
The SunSmart application is an IoT enabled web application for monitoring the amount of sun exposure a user receives.

## Prerequisites
### Get third party API key.
* Weatherbit.io
 1. Head to [weatherbit.io](https://www.weatherbit.io/api) get API key
 2. Replace your Weatherbit APIKEY in `/3rd-party-apikeys/weatherbit`.
* Gmail API
 1. Follow [here](https://stackoverflow.com/a/24123550) to get Gmail API Credential.
 2. Replace your Gmail credentials in `/3rd-party-apikeys/gmail`.
* Google Maps API
 1. Follow [here](https://developers.google.com/maps/documentation/javascript/get-api-key) to get Google Maps APIKEY.
 2. Replace your Google Maps APIKEY in `/3rd-party-apikeys/googlemaps`.

### Install mongodb
1. `sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 2930ADAE8CAF5059EE73BB4B58712A2291FA4AD5`
2. `echo "deb [ arch=amd64,arm64 ] http://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/testing multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.6.list`
3. `sudo apt-get update`
4. `sudo apt-get install -y mongodb-org`
5. `sudo service mongod start`

## Usage
1. `sudo npm install express-generator -g`
2. `git clone` this project to AWS.
3. `cd SunSmart/iot-server/`
4. `npm install`
5. `npm install express request mongoose ejs jwt-simple bcrypt-nodejs nodemailer`
6. `npm start`
