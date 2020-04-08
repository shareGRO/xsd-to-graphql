// use @ to represent attributes
const SHAREGRO_DATA = {
  ibkrAdvisorAccountId: '4732914', // shareGRO Advisor Account ID on IBKR
  userId: '3242', // shareGRO User Id
  userCountry: 'USA',
  userState: 'TX',
  userEmail: 'joe@gmail.com',
  usernamePrefix: 'share',
}

module.exports.elementsToIgnore = [
  'Applications/Application/@id',
  'Applications/Application/Customer/Organization',
  'Applications/Application/Customer/JointHolders',
  'Applications/Application/Customer/Trust',
  'Applications/Application/Customer/@id',
  'Applications/Application/Customer/@transfer_us_micro_cap_stock',
  'Applications/Application/Customer/@termination_age',
  'Applications/Application/Customer/@preferred_primary_language',
  'Applications/Application/Customer/@preferred_secondary_language',
  'Applications/Application/Customer/@tax_treaty_country',
  'Applications/Application/Customer/AccountHolder/AccountHolderDetails/Title',
  'Applications/Application/Documents/Document/@external_acct_id',
  'Applications/Application/Documents/Document/@external_individual_id',
  'Applications/Application/Customer/AccountHolder/FinancialInformation/@liquid_net_worth',
];

module.exports.elementsToHardCode = {
  'Applications/Application/@master_account_id': SHAREGRO_DATA.ibkrAdvisorAccountId,
  'Applications/Application/@has_translation': false, 
  'Applications/Application/@input_language': 'en',
  'Applications/Application/@paper_account': false, // these are not paper accounts, correct? yes, that is correct
  'Applications/Application/Customer/@external_id': SHAREGRO_DATA.userId,
  'Applications/Application/Customer/@email': SHAREGRO_DATA.userEmail,
  'Applications/Application/Customer/@type': 'INDIVIDUAL',
  'Applications/Application/Customer/@prefix': SHAREGRO_DATA.usernamePrefix,
  'Applications/Application/Customer/@md_status_nonpro': true, // not sure about this one but it seems reasonable that all of these would be non-pro accounts? Or are they all pro accounts?
  'Applications/Application/Customer/@legal_residence_country': SHAREGRO_DATA.userCountry,
  'Applications/Application/Customer/@origin_country': SHAREGRO_DATA.userCountry,
  'Applications/Application/Customer/@governing_state': SHAREGRO_DATA.userState,
  'Applications/Application/Customer/@meet_aml_standard': true, // I think this is "Anti Money Laundering" .. do we know what the IBKR anti money laundering standard is?
  'Applications/Application/Customer/@has_direct_trading_access': false, //this looks like one that could be a fixed value. do they have direct access to trading? No, right?
  'Applications/Application/Customer/@opt_for_debit_card': false,
  'Applications/Application/Customer/@robo_fa_client': false,
  'Applications/Application/Customer/@independent_account': false,
  'Applications/Application/Customer/AccountHolder/AccountHolderDetails/@AuthorizedPerson': true,
  'Applications/Application/Customer/AccountHolder/AccountHolderDetails/Ownership/@percentage': 100,
  'Applications/Application/Customer/AccountHolder/TaxInformation/W9/@customer_type': 'Individual',
  'Applications/Application/Customer/AccountHolder/FinancialInformation/@net_worth': 100000,

};