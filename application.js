const jsonxml = require('jsontoxml');
const convert = require('xml-js');
const fs = require('fs');
const { trim } = require('lodash');
const moment = require('moment');

const shareData = {
  user: {
    id: '2321',
    firstName: 'Joe',
    lastName: 'Doe',
    middleInitial: 'M',
    salutation: 'Mr',
    suffix: '',
    email: 'joe@gmail.com',
    phone: '+15551234567',
    country: 'USA',
    state: 'TX',
    city: 'Austin',
    postalCode: '12345',
    street1: '123 Nowhere',
    street2: '',
    dateOfBirth: '1975-03-30',
    employmentStatus: 'UNEMPLOYED',
    ssn: '111223333',
    maritalStatus: 'M',
    countryOfBirth: 'USA',
    citizenship: 'USA',
    numDependents: 0,
  },
  transactionAccount: {
    id: '98213',
  },
  documents: [
    { exec_login_ts: '20180316134800', exec_ts: '20180316134800', form_no: '5002', file_length: '77327', file_name: 'Form5002.pdf', sha1_checksum: '06c49036c2eea742be9d3046f84a462d87f85b1c' },
    { exec_login_ts: '20180316134800', exec_ts: '20180316134800', form_no: '5002', file_length: '77327', file_name: 'Form5002.pdf', sha1_checksum: '06c49036c2eea742be9d3046f84a462d87f85b1c' },
    { exec_login_ts: '20180316134800', exec_ts: '20180316134800', form_no: '5002', file_length: '77327', file_name: 'Form5002.pdf', sha1_checksum: '06c49036c2eea742be9d3046f84a462d87f85b1c' }
  ],
}

const CONFIGS = {
  IBKR_ADVISOR_ACCOUNT_ID: '4732914', // shareGRO Advisor Account ID on IBKR
  USER_PREFIX: 'share',
  USER_ACCOUNT_TYPE: 'INDIVIDUAL',
}

const sampleJSON = fs.readFileSync('Individual_US_SampleApplication_20190627.xml', 'utf8');

var resultJSON = convert.xml2json(sampleJSON, {compact: true, spaces: 4});

fs.writeFile('Individual_US_SampleApplication_20190627.json', resultJSON, 'utf8', () => {});

const {
  user,
  transactionAccount,
  documents,
} = shareData;

const userFullName = trim(`${user.firstName} ${user.middleInitial} ${user.lastName}`);

const documentsData = documents.map(doc => {
  const {
    exec_login_ts, exec_ts, form_no, file_length, file_name, sha1_checksum,
  } = doc;
  return {
    _attributes: {
      exec_login_ts,
      exec_ts,
      form_no,
    },
    SignedBy: {
      _text: userFullName,
    },
    AttachedFile: {
      _attributes: {
        file_length,
        file_name,
        sha1_checksum,
      }
    }
  };
});

const ApplicationsData = {
  "_declaration": {
      "_attributes": {
          "version": "1.0"
      }
  },
  "Applications": {
      "_attributes": {
          "xmlns": "http://www.interactivebrokers.com/schemas/IBCust_import"
      },
      "Application": {
          "Customer": {
              "_attributes": {
                  "email": user.email,
                  "external_id": user.id,
                  "md_status_nonpro": "false",
                  "prefix": CONFIGS.USER_PREFIX,
                  "type": CONFIGS.USER_ACCOUNT_TYPE,
              },
              "AccountHolder": {
                  "AccountHolderDetails": {
                      "_attributes": {
                          "external_id": user.id,
                          "same_mail_address": "true"
                      },
                      "Name": {
                          "_attributes": {
                              "first": user.firstName,
                              "last": user.lastName,
                              "middle": user.middleInitial,
                              "salutation": user.salutation,
                              "suffix": user.suffix
                          }
                      },
                      "DOB": {
                          "_text": user.dateOfBirth,
                      },
                      "CountryOfBirth": {
                          "_text": user.countryOfBirth,
                      },
                      "MaritalStatus": {
                          "_text": user.maritalStatus,
                      },
                      "NumDependents": {
                          "_text": user.numDependents
                      },
                      "Residence": {
                          "_attributes": {
                              "city": user.city,
                              "country": user.country,
                              "postal_code": user.postalCode,
                              "state": user.state,
                              "street_1": user.street1,
                              "street_2": user.street2,
                          }
                      },
                      "Phones": {
                          "Phone": {
                              "_attributes": {
                                  "type": "Mobile",
                                  "number": user.phone,
                                  "country": "USA"
                              }
                          }
                      },
                      "Email": {
                          "_attributes": {
                              "email": user.email,
                          }
                      },
                      "Identification": {
                          "_attributes": {
                              "LegalResidenceCountry": user.country,
                              "LegalResidenceState": user.state,
                              "SSN": user.ssn,
                              "citizenship": user.citizenship,
                          }
                      },
                      "EmploymentType": {
                          "_text": user.employmentStatus
                      },
                      "TaxResidencies": {
                          "TaxResidency": {
                              "_attributes": {
                                  "TIN": user.ssn,
                                  "TINType": "SSN",
                                  "country": "United States"
                              }
                          }
                      },
                      "W9": { // is this required?
                          "_attributes": {
                              "cert1": "true",
                              "cert2": "true",
                              "cert3": "true",
                              "customer_type": "Individual",
                              "name": userFullName,
                              "blank_form": "true",
                              "proprietary_form_number": "5002", // is this a reference to the document?
                              "tax_form_file": "Form5002.pdf", // is this a reference to the document?
                              "tin": user.ssn,
                              "tin_type": "SSN"
                          }
                      },
                      "Ownership": {
                          "_attributes": {
                              "percentage": "100"
                          }
                      },
                      "Title": {
                          "_attributes": {
                              "code": "Account Holder"
                          }
                      }
                  },
                  "RegulatoryInformation": { // this seems to be required but I don't understands
                      "RegulatoryDetail": [
                          {
                              "_attributes": {
                                  "code": "REGULATORYCONTROL",
                                  "status": "false"
                              }
                          },
                          {
                              "_attributes": {
                                  "code": "AFFILIATION",
                                  "status": "false"
                              }
                          }
                      ]
                  }
              }
          },
          "Accounts": {
              "Account": {
                  "_attributes": {
                      "base_currency": "USD",
                      "external_id": transactionAccount.id,
                      "margin": "RegT", // this should probably change
                      "multicurrency": "false"
                  },
                  "InvestmentObjectives": { // is this important?
                      "objective": [
                          {
                              "_text": "Growth"
                          },
                          {
                              "_text": "Trading"
                          },
                          {
                              "_text": "Hedging"
                          }
                      ]
                  },
                  "TradingPermissions": { // I need to check with this one
                      "TradingPermission": [
                          {
                              "_attributes": {
                                  "country": "UNITED STATES",
                                  "product": "STOCKS"
                              }
                          },
                          {
                              "_attributes": {
                                  "country": "UNITED STATES",
                                  "product": "OPTIONS"
                              }
                          },
                          {
                              "_attributes": {
                                  "country": "UNITED STATES",
                                  "product": "MUTUAL FUNDS"
                              }
                          },
                          {
                              "_attributes": {
                                  "country": "CANADA",
                                  "product": "STOCKS"
                              }
                          },
                          {
                              "_attributes": {
                                  "country": "MEXICO",
                                  "product": "STOCKS"
                              }
                          }
                      ]
                  },
              }
          },
          "Users": {
              "User": {
                  "_attributes": {
                      "external_individual_id": user.id,
                      "external_user_id": user.id,
                      "prefix": CONFIGS.USER_PREFIX,
                  }
              }
          },
          "Documents": {
              "Document": documentsData,
          }
      }
  }
}

const resultXML = convert.json2xml(ApplicationsData, {compact: true, spaces: 2});

fs.writeFile('IndividualApplication.xml', resultXML, 'utf8', () => {});
