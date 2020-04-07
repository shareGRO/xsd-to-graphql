const fs = require('fs');
const path = require('path');
const Xsd2JsonSchema = require('xsd2jsonschema').Xsd2JsonSchema;
const { isNil, get, uniq, split, last, toUpper } = require('lodash');
const { buildSchema, printSchema, introspectionQuery, buildClientSchema, graphqlSync, getIntrospectionQuery, graphql } = require('graphql');

const { graphQLTypes } = require('./graphql/types');
const{ createType } = require('./graphql/createType');
// const { introspectionQuery } = require('graphql'); 
 

const getAllFiles = function(dirPath, arrayOfFiles) {
  files = fs.readdirSync(dirPath)
 
  arrayOfFiles = arrayOfFiles || []
 
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles)
    } else {
      arrayOfFiles.push(path.join(__dirname, dirPath, "/", file))
    }
  })
 
  return arrayOfFiles
}

const getScalars = (data) => {
  const keys = Object.keys(data);
  const scalars = [];
  keys.forEach((key) => {
    const {
      properties,
    } = dataObjects[key];
    if (!isNil(properties)) {
      const propKeys = Object.keys(properties);
      propKeys.forEach((propKey) => {
        const prop = properties[propKey];
        const { type } = prop;
        if(!isNil(prop.type)) scalars.push(toUpper(type));
      });
    }
    return properties;
  });
  const uniqScalars = uniq(scalars)
  return uniqScalars.map((s) => ({
    kind: 'SCALAR',
    name: s,
    description: `It's a ${s}`,
    fields: null,
    inputFields: null,
    interfaces: null,
    enumValues: null,
    possibleTypes: null
  }));
};

const allFiles = getAllFiles('xsd');

let dataObjects = {};

allFiles.forEach((file) => {
  var XML_SCHEMA = fs.readFileSync(file, 'utf8');

  const xs2js = new Xsd2JsonSchema();
   
  const convertedSchemas = xs2js.processAllSchemas({
      schemas: {'xsd': XML_SCHEMA}
  });
  const jsonSchema = convertedSchemas['xsd'].getJsonSchema();

  const { definitions } = jsonSchema;
  
  dataObjects = {
    ...definitions,
    ...dataObjects,
  };
})

const scalars = getScalars(dataObjects);
const keys = Object.keys(dataObjects);
const types = keys.map(key => createType(key, dataObjects))

// const introspection = {
//   data: {
//     __schema: {
//       queryType: {
//         name: 'Account',
//       },
//       mutationType: null,
//       subscriptionType: null,
//       types: [
//         ...getScalars(dataObjects),
//         ...types,
//         ...graphQLTypes,
//       ],
//       directives: [],
//     }
//   }
// }

let schema = `
schema {
  query: Queries
}

"""
This is a base query used for this documentation only, it is not related to IBKR
"""
type Queries {
  Process: Process!
  AcctMgmt: AcctMgmt!
  AcctMgmtRequests: AcctMgmtRequests!
  Errors: Errors!
  Pending_Tasks: Pending_Tasks!
}

`;
types.forEach(type => {
  schema += `${type.graphQLType}`;
})


const schemaObject = buildSchema(schema);

const g = graphql(schemaObject, getIntrospectionQuery()).then(data => {
  const final = JSON.stringify(data, null, 2);  
  fs.writeFile('final.json', final, 'utf8', () => {});
  fs.writeFile('schema.txt', schema, 'utf8', () => {});
}).catch(e => {
  fs.writeFile('schema.txt', schema, 'utf8', () => {});
  console.error(e);
})


