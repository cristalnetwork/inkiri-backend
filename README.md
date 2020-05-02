


# CristalNetwork REST & GraphQL API
This is a step by step guide to launch an instance of CristalNetwork Backend API. 
This doc will try to guide you through:
1. Setting up the dev environment, 
2. Configuring parameters   
  1. Blockchain parameters,
  2.  DDBB parmeters,
  3. Google Drive Storage parmeters -_optional_-,
  4. Payment Gateway parameters [https://iugu.com](https://iugu.com/) -_optional_-,
  5. Firebase Push Notification service -_optional_-,
  6. Configure cron jobs.
3. Running a local Backend Instance.

## Intro
This REST and GraphQL API is part of the CristalNetwork Core Apps.
```mermaid
graph TD
start(FRONTEND)
eos(BLOCKCHAIN)
nodejs(BACKEND)

start--Push&Pull requests-->nodejs
start--Push transactions & Pull PAPs-->eos
nodejs--Pull transactions & Issue Iugu-->eos
```
#### Services
* Pull blockchain transactions for configured [https://github.com/cristalnetwork/inkiri-eos-contracts](https://github.com/cristalnetwork/inkiri-eos-contracts) instance contract and keep a local record on a MongoDB instance.
* Pull [IUGU Payment Gateway](https://iugu.com) payments for configured accounts using [IUGU API](https://dev.iugu.com/reference), and issues corresponding amount of money to recipients' bank account balance. This is the way money is issued.
* Provides a GraphQL API to access data:
  * Account requests:
    * Deposit
    * Exchange
    * Payment
    * Provider
    * Send
    * Withdraw
    * Service
    * Pad
    * Salary
    * Iugu/Issue
  * Users
    * Personal information
    * Commercial bank accounts to whom withdraw are requested
  * Services (B2B and B2C services) and Pre Authorized Debits Contracts
  * Providers
  * Businesses Teams
  * IUGU operations 
* Authentication through EOSIO Contract Auth and JWT.
#### Administrator accounts services
* Administrate users
  * Create Account
  * Configure accounts' overdraft (The **overdraft** allows the **customer** to continue paying bills even when there is insufficient money in the **customer's** account.)
* Administrate the bank
  * Access all transactions.
  * Possibility to change requests statuses, such as cancel withdraw or accept an exchange reques.
  * Administrate suppliers
  * Manage external transfers (outside the economy)
#### Personal account services
* Hire services and managing recurring payments (Pre Auth Debits)
* Authorize other accounts to manage balances or just to view transaction list.  
* Request payments.
* Withdraw paper money and convert money to FIAT currency and credit at commercial bank account.
#### Business accounts services
* Administrate supplier
* Request supplier payment through FIAT money conversion.
* Administrate a team
* Pay salaries
* Create services and invite customers to Pre Authorized Debits.
* Charge PAD slips.
* Point of Sale
  * Authorize other accounts to charge customers and view payments.  
  * Charge customers for service and product, allowing in-app payment.
## 1.- Setup Dev Environment

Please make sure that you have:

### Node.js installed (https://nodejs.org/) 
Min version required is 10.16.0, please refer to [this installation guide].(https://github.com/nodesource/distributions/blob/master/README.md#debinstall)

### [MongoDB](https://www.mongodb.com/) running in `replica set` mode.

##### Option 1: Local MongoDB Instance
We composed this tiny simplified guide. Please refer to [this link](https://thecodebarbarian.com/introducing-run-rs-zero-config-mongodb-runner.html#your-first-transaction-with-run-rs-and-mongodb-40) for detailed installation instructions.
 ```bash
npm install run-rs -g
run-rs --keep --mongod --dbpath /path_to_cristalnetwork/mongodata -v 4.0.0 --shell
```
##### Option 2: Docker MongoDB Instance
If you are used to **docker**, please refer to [this link](https://gist.github.com/harveyconnor/518e088bad23a273cae6ba7fc4643549).
##### Option 3: Third party MongoDB Services
You may also take a look at [Atlas Mongo Cloud Service](https://www.mongodb.com/cloud/atlas), they have an amazing free tier.
### Install npm modules
Finally, run `npm install` in your root project folder

## Configuration
Please copy sample configuration file `project_root_path/src/common/config/env.cristaltoken.config_SAMPLE_.js` to `project_root_path/src/common/config/env.cristaltoken.config.js` by running:
```bash
cd project_root_full_path
cp ./src/common/config/env.cristaltoken.config_SAMPLE_.js ./src/common/config/env.cristaltoken.config.js
```
The following paragraphs will guide on hos to get configuration parameters and how to input them in the just created configuration file `project_root_full_path/src/common/config/env.cristaltoken.config.js`, by replacing certain string with your content.

#### JWT secret string
The API implements JWT (JSON Web Token) for users and requests authentication.
When a user authenticates itself onto the platform, the backend server provides a token for the client to be used in further requests.
**JWT is created with a secret key** and that secret key is private to the server instance. When the server instance receive a JWT from the client, the server verifies that JWT with the secret key. Any modification to the JWT will result into verification failure.

Replace **<JWT_SECRET>** with your secret key.

Please refer to the following links for further information [https://jwt.io](https://jwt.io/) and [https://github.com/auth0/node-jsonwebtoken](https://github.com/auth0/node-jsonwebtoken).

#### Blockchain
You will have to configure the blockchain currency symbol, the account name you use to deploy the contract and the endpoints.

Replace **<BLOCKCHAIN_CURRENCY_SYMBOL>** in this file `project_root_full_path/src/common/config/env.cristaltoken.config.js` with the currency symbol of the blokchain. Use **TLOS** for TELOS blockchain, **EOS** for EOS blockchain, **EOS** for a Local Single-Node Testnet blockchain.

Replace **<BLOCKCHAIN_ACCOUNT_NAME>** with the EOSIO account name used [here](https://github.com/cristalnetwork/inkiri-eos-contracts#setup-dev-environment) to deploy the contract.

Replace **<BLOCKCHAIN_TOKEN_SYMBOL>** with the token symbol used [here](https://github.com/cristalnetwork/inkiri-eos-contracts#4-create-the-bank-contract-token) for the currency you issue. 

You wil have to configure the blockchain endpoints too.
```json
{
  "eos" : {
        "blockchain_endpoint_prod":    "http://localhost:8888",         // http://localhost:8888 for Local Single Node testnet, https://telos.eoscafeblock.com for TELOS
        "blockchain_endpoint_dev":     "http://localhost:8888",         // http://localhost:8888 for Local Single Node testnet, https://testnet.telosusa.io
        "hyperion" :{
          "history_endpoint_prod":      "https://telos.caleos.io",      // http://localhost:8888 for Local Single Node testnet , https://telos.caleos.io for TELOS
          "history_endpoint_dev" :      "https://testnet.telosusa.io"   // http://localhost:8888 for Local Single Node testnet , https://testnet.telosusa.io for TELOS
  }
}
```
For more info about network params please [refer to this link](https://developers.eos.io/manuals/eosjs/latest/how-to-guides/how-to-set-the-network).
As you may have noticed, the configuration file allows you to configure 4 endpoints. 
The blockchain _state_ endpoint for pushing transactions in the *prod*and *dev* environments configuration modes, and the blockchain _history_ hyperion endpoint for retrieving history data in the *prod* and *dev* environments configuration modes.

Here is a non exhaustive list of endpoint you may use accordingly to the network:
|                |MAINNET                        |TESTNET                      |
|----------------|-------------------------------|-----------------------------|
|EOS             | https://api.eoseoul.io        | https://jungle2.cryptolions.io|
|EOS Hyperion    | https://mainnet.eosn.io       | https://jungle.hyperion.eosrio.io/ |
|TELOS           | https://telos.eoscafeblock.com | https://testnet.telosusa.io|
|TELOS Hyperion   | https://telos.caleos.io      | https://testnet.telosusa.io |
|Local Single-Node | http://localhost:8888       | http://localhost:8888 |

For EOS and TELOS endpoints checkout [https://tools.eosmetal.io/nodestatus/eos](https://tools.eosmetal.io/nodestatus/eos) and [https://eostoolkit.io/networks](https://eostoolkit.io/networks).
You can also check the Hyperion Open History Endpoint List available at [https://t.me/EOSHyperion](https://t.me/EOSHyperion)

#### Mongo DDBB
Replace **<MONGOBD_CONNECTION_URI>** with your MongoDB connection URI.

If you are running a local server the connection might be something like this
```bash
mongodb://localhost:27017,localhost:27017,localhost:27017/?replicaSet=rs&retryWrites=true&w=majority
```

#### Google Drive Storage

##### 1. Create a Google Project.
You can check this link https://console.developers.google.com/apis

##### 2. Enable Google Drive API and Google Sheets API. 
You can [check this link](https://developers.google.com/drive/api/v3/enable-drive-api) to enable Drive API and [check this one](https://developers.google.com/sheets/api/quickstart/js) to enable Sheets API.

##### 3. Create a credential
The credential required is the **Service Account** type one.
When doing this guide Google provided a 3 steps creation process:
In the first step you provide identification data (names).
The second step requires you to Grant access to the project. I granted full control access. 
You can restrict the access at your convenience. Just keep in mind that the account must have permission to create folders and upload files to the drive, and modify their permissions, and permission to create sheets and modify their permissions.
You can grant other users the permissions to administer this service account at the third step. This is optional.
You must create a private key and download the file in JSON format. 
This file will be used to configure the backend. 

> You can check [this minified image-only step by step guide](https://docs.google.com/presentation/d/1rT788_nK6WMOyqIy1whPpO3ubLz-0Tq06Ll5Mtjjlfk/edit?usp=sharing) to configure the service account credential. You may also [check this guide ](https://medium.com/@bretcameron/how-to-use-the-google-drive-api-with-javascript-57a6cc9e5262#7640)

The donwloaded credential JSON file has this structure:
```json
{
  "type": "service_account",
  "project_id": "AAAAAAAAAAAA",
  "private_key_id": "BBBBBBBBBBBB",
  "private_key": "-----BEGIN PRIVATE KEY-----CCCCCCCCCC-----END PRIVATE KEY-----",
  "client_email": "cristaltoken@quickstart-AAAAAAAAAAAA.iam.gserviceaccount.com",
  "client_id": "ZZZZZZZZZZZZ",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/cristaltoken%40YYYYYYYYYYYY-XXXXXXXXXXXX.iam.gserviceaccount.com"
}
```
Move the file to `./src/common/config/drive.credentials.json`.

##### 4. Create a Google Drive Folder
Create a folder at Google Drive and grant write access to the email account created in the step before for the service account credential (*cristaltoken@quickstart-AAAAAAAAAAAA.iam.gserviceaccount.com* in this guide)
Replace **<GOOGLE_DRIVE_ID>** with the created folder id ID. This folder will be used to store private files (files such as Invoices and Receipts).

#### IUGU: Payment Gateway
If you want the backend to issue money everytime a IUGU payment is received, you will have to create an API key for your IUGU account. It is basically an authentication token.
Please [refer to this official IUGU guide](https://dev.iugu.com/reference#section-criando-suas-chaves-de-api-api-tokens).

You will have to configure this fields/parameters: 
```json
{   
  "iugu":
    {
      "accounts" : [
        {
          "key"                       : "<IUGU_ACCOUNT_NAME>"
          , "token"                   : "<IUGU_ACCOUNT_RAW_TOKEN>"
        }
      ]
      , "issuer_key"                  : "<ISSUER_WIF_PRIVATE_KEY>"
    }
}
```

Copy the created token and paste it by replacing **<IUGU_ACCOUNT_RAW_TOKEN>**.
You may add a name or description to identifiy alter on the account through which the payment and the corresponding issue occurred. Replace **<IUGU_ACCOUNT_NAME>** with your preferred name.
Finally paste issuer private key, for example the one used [in this step](https://github.com/cristalnetwork/inkiri-eos-contracts#setup-dev-environment), by replacing **<ISSUER_WIF_PRIVATE_KEY>**.

#### Firebase Push Notification
Login into your gmail account and go to [https://console.firebase.google.com](https://console.firebase.google.com).
Create a new project and configure `Cloud & Messaging` by adding a web app. 
> You can follow [this minified image-only step by step guide](https://docs.google.com/presentation/d/1SMYwUNt9KfEH5H1Iw55O1ckwhWt0QXgzytKcdf8GSaw/edit?usp=sharing). 
Register the app by setting a nickname.
Copy and save in a temp file the script provided by the google service.

It looks like:

```javascript
<!-- The core Firebase JS SDK is always required and must be listed first -->
<script src="https://www.gstatic.com/firebasejs/7.14.1/firebase-app.js"></script>

<!-- TODO: Add SDKs for Firebase products that you want to use
     https://firebase.google.com/docs/web/setup#available-libraries -->

<script>
  // Your web app's Firebase configuration
  var firebaseConfig = {
    apiKey: "XXXXXXXXXXXX",
    authDomain: "JJJJJJJJJJJJ.firebaseapp.com",
    databaseURL: "https://JJJJJJJJJJJJ.firebaseio.com",
    projectId: "JJJJJJJJJJJJ",
    storageBucket: "JJJJJJJJJJJJ.appspot.com",
    messagingSenderId: "YYYYYYYYYYYY",
    appId: "1:YYYYYYYYYYYY:web:XXXXXXXXXXXX"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
</script>
```
After saving the file, continue to the console and go to project setting and click on `Service Accounts`.

You will get a service account credential to use Admin SDK and be able to send push notification from the backend.

Create a new private key pair for `Node.js` platform and download the file onto `./src/common/config/firebase.credentials.json`.

As you may noticed, the file structure is similar to the Google Drive one.
```json
{
  "type": "service_account",
  "project_id": "JJJJJJJJJJJJ",
  "private_key_id": "aaaaaaaaaaaa",
  "private_key": "-----BEGIN PRIVATE KEY-----XXXXXXXXXXXX\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-YYYYYYYYYYYY@test-cn-XXXXXXXXXXXX.iam.gserviceaccount.com",
  "client_id": "ZZZZZZZZZZZZ",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-YYYYYYYYYYYY%40test-cn-XXXXXXXXXXXX.iam.gserviceaccount.com"
}
```

#### Cron jobs
The backend uses 5 cron jobs:
##### 1. Import blockchian transactions cron.
This cron imports transactions querying since last imported to the configured hyperion API endpoint.  
This is a **high priority** cron. You should run this cron every 15 or 30 seconds.
The script is prepared to be configured to run every minute, it means you can schedule using crontab like this:
```bash
* * * * * node /path_to_cron
```
and the cron will run twice a minute, it is every 30 seconds.

> File path: `src/cron_jobs/blockchain/import.transactions.js`

##### 2. Import blockchian customers and account balances cron.
This cron imports customers from the contract's table and imports every customer's balance. 
This is a **low priority** cron. You may run this cron every 5 minutes.

> File path: `src/cron_jobs/blockchain/import.accounts.js`

##### 3. Import IUGU payments cron.
This cron query IUGU API for all the payments updated the last day and store those transactions that are not stored yet. 

This cron also tries to find the recipient account of the payment. To do so, the script extract the account's IUGU Alias set in the invoice description. 
This text is expected to be between asterisks in the invoice description.
If this text is not found ini the invoice description, the script check a custom variable named `projeto` configured by a third party invoice system. That variable contains the receipt account's IUGU Alias.

This is a **medium priority** cron. You should run this cron every 5 minutes.
File path: `src/cron_jobs/iugu/import.js`
##### 4. Issue imported IUGU payments cron.
This cron lists already imported IUGU payment transactions and issues corresponding amount of money to recipients if exists. Otherwise administrators will have to issue manually.

This is a **medium priority** cron. You should run this cron every 5 minutes.
File path: `src/cron_jobs/iugu/issue.js`
##### 5. Push notifications cron.
This cron lists a table named `push_notifications` where the modules store notifications to be send to users, such as requests transitions and operations imported from the blockchain and push them to the configured account's device(s).

This is a **medium priority** cron. You should run this cron every 1 minutes.
File path: `src/cron_jobs/push_notifications/send.all.js`

> This is a usefull link that may help you to configure and schedule cron jobs directly frmo node [https://www.npmjs.com/package/node-cron](https://www.npmjs.com/package/node-cron)

## Usage
To run the project, please use a command line the following:
```bash
IUGU_ISSUER_PRIVATE_KEY=<YOUR_ADMIN_EOSIO_ACCOUNT_PRIVATE_KEY> npm start
```
> Please note the private key is [the one generated when deploying the smart contract at this link](https://github.com/cristalnetwork/inkiri-eos-contracts#setup-dev-environment).

If you already configured the WIF private key, just run `npm start`.
It will run the server at port 3600.
