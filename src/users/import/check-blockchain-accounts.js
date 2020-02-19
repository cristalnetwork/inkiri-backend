const AccountChecker    = require('./check-blockchain-accounts-lib.js');

(async () => {
    const missing_account = await AccountChecker.getMissingAccounts();
    console.log(missing_account.length);
    console.log(missing_account);
    return process.exit(0);
})();

