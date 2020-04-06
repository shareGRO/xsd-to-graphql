const { isNil, get, uniq, split, last, toUpper, isArray, capitalize } = require('lodash');

const isAttr = (prop) => String(prop).substr(0,1) === '@';

const getFields = (properties) => {
  if (isNil(properties) ) return null;
  const propKeys = Object.keys(properties);
  const fields = propKeys.map((key) => {
    const isAttribute = isAttr(key);
    const description = get(properties[key], 'description', null);
    const ref = last(split(get(properties[key], '$ref', null), '/'));
    const name = isAttribute ? key.substr(1, key.length) : key;

    let typeName = ref !== '' ? ref : capitalize(get(properties[key], 'type', name));
    if (!isNil(properties[key].oneOf)) {
      const ref = last(split(get(properties[key], 'oneOf[0].$ref', null), '/'));
      const type = get(properties[key], 'oneOf[0].type', null);
      typeName = isNil(type) ? ref : capitalize(type)
    } else if (!isNil(properties[key].allOf)) {
      console.log('properties[key].allOf', properties[key].allOf);
      const ref = last(split(get(properties[key], 'allOf[0].$ref', null), '/'));
      const type = get(properties[key], 'allOf[0].type', null);
      typeName = isNil(type) ? ref : capitalize(type)
    }

    if (typeName === 'Integer') typeName = 'Int';
    if (typeName === 'Number') typeName = 'Float';
    if (typeName === '') typeName = 'Int';

    const type = isAttribute ? {
      kind: 'OBJECT',
      name: typeName,
     } : {
      kind: 'OBJECT',
      name: typeName,
     };
    
    return {
      name,
      typeName,
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

module.exports.createType = (key, data) => {
  const {
    description,
    type,
    properties,
    enum: enumValues,
  } = data[key];

  if (key === 'Customer_Type') {
    console.log('data[key]', data[key]);
    console.log('enumValues', enumValues);
  }

  let kind = isNil(properties) ? toUpper(type) : 'OBJECT';
  // if (kind === 'STRING') kind = 'SCALAR';

  const fields = getFields(properties);
  // console.log('fields', fields);

  let graphQLTypeFields = '';
  if(isArray(fields)) fields.forEach(field => {
    graphQLTypeFields += `  ${field.name}: ${field.typeName}
`
  })

  let graphQLType = `type ${key} {
  id: String!
}
  `;
  if (isArray(fields)) {
    graphQLType = `type ${key} {
  ${graphQLTypeFields}}
`;
  } else {
    const ref = last(split(get(data[key], 'allOf[0].$ref', null), '/'));
    if (ref !== '') graphQLType = `type ${key} {
  content: ${ref}!
}
`;
}
    if (isArray(enumValues)){
      let values = '';
      Customer
      graphQLType = `enum ${key} {
  VALUE
}
`;
}

 // console.log('graphQLType', graphQLType);

  return {
    kind, // there is something wrong here
    name: key,
    description,
    fields,
    interfaces: [],
    enumValues: null,
    possibleTypes: null,
    args: [],
    graphQLType,
    debugData: {
      key,
      data
    },
  }
}