const fs = require('fs');
const path = require('path');
const Xsd2JsonSchema = require('xsd2jsonschema').Xsd2JsonSchema;
const jsonxml = require('jsontoxml');
const { isNil, get, uniq, split, last, toUpper, indexOf, join, upperCase, pad, toArray } = require('lodash');
const { buildSchema, printSchema, introspectionQuery, buildClientSchema, graphqlSync, getIntrospectionQuery, graphql } = require('graphql');

const { graphQLTypes } = require('./helpers/types');
const{ createType } = require('./helpers/createType');
const { elementsToIgnore, elementsToHardCode } = require('./helpers/genData');
 
const elementsToGenerateJSON = ['Applications'];

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

const getEnumValues = (elementKey) => get(dataObjects[elementKey], 'enum', []);

const getElement = (elementKey, parentPath) => {
  const element = dataObjects[elementKey];
  const elementProperties = get(element, 'properties', get(element, 'allOf[1].properties', null));
  if (isNil(elementProperties)) return {};
  const propertyKeys = Object.keys(elementProperties);
  const attrs = {};
  const children = [];
  propertyKeys.forEach(key => {
    const path = `${parentPath}/${key}`;
    let text = `\n<!-- Path: ${path} -->`;
    let elementTypeName = key;
    if (indexOf(elementsToIgnore, path) === -1) {
      let ref = last(split(get(elementProperties[key], '$ref', null), '/'));
      if (ref === '') ref = last(split(get(elementProperties[key], 'oneOf[0].$ref', null), '/'));
      if (ref && ref !== key) {
        elementTypeName = ref;
      }
      const type = get(elementProperties[key], 'type', null);
      const description = get(elementProperties[key], 'description', false);
      if (description) text += `\n<!-- Description: ${description} -->`;
      const isAttribute = String(key).substr(0,1) === '@' || type !== null;
      const el = getElement(ref, path);
      const typeName = get(el, 'name', false);
      let typeAttrs = {};
      let typeChildren = [];
      if (typeName && typeName !== key) {
        elementTypeName = typeName;
        const typeEl = getElement(typeName, path);
        typeAttrs = typeEl.attrs;
        typeChildren = toArray(typeEl.children);
      }
      if (isAttribute) {
        let attrType = isNil(type) ? ref : pad(upperCase(type), '__');
        if (attrType === '') attrType = upperCase(get(elementProperties[key], 'oneOf[0].type', null))
        const enumValues = getEnumValues(attrType);
        const finalValue = elementsToHardCode[path];
        attrs[key.replace('@', '')] = isNil(finalValue)
          ? `${attrType}${enumValues.length > 0 ? ' : ' : ''}${join(enumValues, '|')}`
          : finalValue;
      } else {
        const refEl = getElement(elementTypeName, path);
        if (elementTypeName === 'AssociatedIndividual') console.log('refEl', refEl);
        text += `\n<!-- Type: ${elementTypeName} -->`;
        const typeDescription = get(elementProperties[elementTypeName], 'description', false);
        if (typeDescription) text += `\n<!-- Type Description: ${typeDescription} -->`;
        let childrenArray = toArray(el.children);
        if (childrenArray.length === 0) childrenArray = toArray(typeChildren);
        if (childrenArray.length === 0) childrenArray = toArray(refEl.children);
        children.push({
          name: key,
          text,
          children: childrenArray,
          attrs: {
            ...el.attrs,
            ...typeAttrs,
            ...refEl.attrs,
          },
        })
      }
    }
  })
  const finalElement = {
    name: elementKey,
    // _path: path,
    // _element: element,
    children,
    attrs,
  }
  return finalElement;
}

elementsToGenerateJSON.forEach(elKey => {
  const elementObject = getElement(elKey, elKey);
  const json = JSON.stringify(elementObject, null, 2);
  const xmlObject = [ elementObject ];
  // we need the xmlObject to be in the correct format. See https://github.com/ken-franken/node-jsontoxml
  const xml = jsonxml(xmlObject, { prettyPrint: true, xmlHeader: true });
  fs.writeFile(`element-json/${elKey}.json`, json, 'utf8', () => {});
  fs.writeFile(`element-xml/${elKey}.xml`, xml, 'utf8', () => {});
});


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

const minSchema = `

`;
