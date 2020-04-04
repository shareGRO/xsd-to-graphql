const fs = require('fs');
const path = require('path');
const Xsd2JsonSchema = require('xsd2jsonschema').Xsd2JsonSchema;
const { isNil, get, uniq, split, last, toUpper } = require('lodash');

const { graphQLTypes } = require('./graphql/types');
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

const isAttr = (prop) => String(prop).substr(0,1) === '@';

const getFields = (properties) => {
  if (isNil(properties) ) return null;
  // console.log('properties', properties);
  const propKeys = Object.keys(properties);
  const fields = propKeys.map((key) => {
    const isAttribute = isAttr(key);
    const description = get(properties[key], 'description', null);
    const ref = last(split(get(properties[key], '$ref', null), '/'));
    const name = isAttribute ? key.substr(1, key.length) : key;

    const typeName = ref !== '' ? ref : get(properties[key], 'type', name);

    const type = isAttribute ? {
      kind: 'OBJECT',
      name: typeName,
     } : {
      kind: 'OBJECT',
      name: typeName,
     };
    
    return {
      name,
      isAttribute,
      description,
      type,
      args: [],
      isDeprecated: false,
      deprecationReason: null,
      // debug: properties,
    }
  })
  return fields;
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
    ...dataObjects,
    ...definitions,
  };
})

const scalars = getScalars(dataObjects);
const keys = Object.keys(dataObjects);
const types = keys.map((key) => {
  const {
    description,
    type,
    properties,
  } = dataObjects[key];

  return {
    kind: toUpper(type), // there is something wrong here
    name: key,
    description,
    fields: getFields(properties),
    interfaces: [],
    enumValues: null,
    possibleTypes: null,
    // debugData: dataObjects[key],
  }
  
  return dataObjects[key];
})

const introspection = {
  data: {
    __schema: {
      queryType: {
        name: 'Account',
      },
      mutationType: null,
      subscriptionType: null,
      types: [
        ...getScalars(dataObjects),
        ...types,
        ...graphQLTypes,
      ],
      directives: [],
    }
  }
}

const final = JSON.stringify(introspection, null, 2);

// console.log(JSON.stringify(allDefinitions, null, 2));

fs.writeFile('final.json', final, 'utf8', () => {});

	// var result = jgeXml.parse(xml,function(state,token) {
	// 	//...
	// });