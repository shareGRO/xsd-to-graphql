const convert = require('xml-js');
const fs = require('fs');
const { trim } = require('lodash');
const moment = require('moment');

const { CONFIGS, REGULATORY_INFORMATION, ALL_TRADING_PERMISSIONS, DOCUMENT_NUMBERS } = require('./constants');

const shareData = {
  user: {
    id: '2321',
    transactionAccountId: '7933',
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
    numOfDependents: 0,
    affiliation: false,
    regulatoryControl: false,
    otherInteractiveBrokersAccounts: false,
  },
}

const sampleJSON = fs.readFileSync('Individual_US_SampleApplication_20190627.xml', 'utf8');

var resultJSON = convert.xml2json(sampleJSON, {compact: true, spaces: 4});

fs.writeFile('Individual_US_SampleApplication_20190627.json', resultJSON, 'utf8', () => {});

const { user } = shareData;

const timestamp = moment().format('YYYYMMDDhhmmss');

const userFullName = trim(`${user.firstName} ${user.middleInitial} ${user.lastName}`);

const RegulatoryInformation = {
  RegulatoryDetail: [
    {
      _attributes: {
        code: REGULATORY_INFORMATION.REGULATORYCONTROL,
        status: user.regulatoryControl,
      }
    },
    {
      _attributes: {
        code: REGULATORY_INFORMATION.AFFILIATION,
        status: user.affiliation,
      }
    },
    {
      _attributes: {
        code: REGULATORY_INFORMATION.IBACCOUNTS,
        status: user.otherInteractiveBrokersAccounts,
      }
    }
  ]
};

const TradingPermissions = {
  TradingPermission: ALL_TRADING_PERMISSIONS.map(tradingPermission => ({
    _attributes: { ...tradingPermission }
  }))
}

const Documents = {
  Document: DOCUMENT_NUMBERS.map(documentNumber => {  
    return {
      _attributes: {
        exec_login_ts: timestamp,
        exec_ts: timestamp,
        form_no: documentNumber,
      },
      SignedBy: {
        _text: userFullName,
      }
    };
  }),
};

const ApplicationsData = {
  _declaration: {
    _attributes: {
      version: "1.0"
    }
  },
  Applications: {
    _attributes: {
      xmlns: "http://www.interactivebrokers.com/schemas/IBCust_import"
    },
    Application: {
      Customer: {
        _attributes: {
          email: user.email,
          external_id: user.id,
          md_status_nonpro: false,
          prefix: CONFIGS.USER_PREFIX,
          type: CONFIGS.USER_ACCOUNT_TYPE,
        },
        AccountHolder: {
          AccountHolderDetails: {
            _attributes: {
              external_id: user.id,
                same_mail_address: true
              },
              Name: {
                _attributes: {
                  first: user.firstName,
                  last: user.lastName,
                  middle: user.middleInitial,
                  salutation: user.salutation,
                  suffix: user.suffix
                }
              },
              DOB: {
                _text: user.dateOfBirth,
              },
              CountryOfBirth: {
                _text: user.countryOfBirth,
              },
              MaritalStatus: {
                _text: user.maritalStatus,
              },
              NumDependents: {
                _text: user.numOfDependents
              },
              Residence: {
                _attributes: {
                  city: user.city,
                  country: user.country,
                  postal_code: user.postalCode,
                  state: user.state,
                  street_1: user.street1,
                  street_2: user.street2,
                }
              },
              Phones: {
                Phone: {
                  _attributes: {
                    type: CONFIGS.PHONE_TYPE,
                    number: user.phone,
                    country: CONFIGS.COUNTRY,
                  }
                }
              },
              Email: {
                _attributes: {
                  email: user.email,
                }
              },
              Identification: {
                _attributes: {
                  LegalResidenceCountry: user.country,
                  LegalResidenceState: user.state,
                  SSN: user.ssn,
                  citizenship: user.citizenship,
                }
              },
              EmploymentType: {
                _text: user.employmentStatus
              },
              TaxResidencies: {
                TaxResidency: {
                  _attributes: {
                    TIN: user.ssn,
                    TINType: CONFIGS.TIN_TYPE,
                    country: CONFIGS.COUNTRY
                  }
                }
              },
              W9: {
                _attributes: {
                  cert1: true, // To be set to True in order to certify that the given taxpayer identification number (TIN) is correct.
                  cert2: true, // To be set to True if agreeing to certification 2 in part II. Must be set to false if notified by IRS as being subject to backup withholding.
                  cert3: true, // To be set to True in order to certify that the customer is a U.S. Citizen or other U.S. Person.
                  customer_type: CONFIGS.W9_CUSTOMER_TYPE,
                  name: userFullName,
                  blank_form: true,
                  proprietary_form_number: CONFIGS.W9_FORM_NUMBER,
                  tax_form_file: CONFIGS.W9_TAX_FORM_FILE,
                  tin: user.ssn,
                  tin_type: CONFIGS.TIN_TYPE,
                }
              },
              Ownership: {
                _attributes: {
                  percentage: 100
                }
              },
              Title: {
                _attributes: {
                  code: CONFIGS.ACCOUNT_TITLE
                }
              }
            },
            RegulatoryInformation,
          }
        },
        Accounts: {
          Account: {
            _attributes: {
              base_currency: CONFIGS.CURRENCY,
              external_id: user.transactionAccountId,
              margin: CONFIGS.MARGIN_TYPE,
              multicurrency: false
            },
            TradingPermissions,
          }
          },
          Users: {
            User: {
              _attributes: {
                external_individual_id: user.id,
                external_user_id: user.id,
                prefix: CONFIGS.USER_PREFIX,
              }
            }
          },
          Documents,
      }
  }
}

const resultXML = convert.json2xml(ApplicationsData, {compact: true, spaces: 2});

fs.writeFile('IndividualApplication.xml', resultXML, 'utf8', () => {});
