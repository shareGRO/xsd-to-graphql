const { isNil, get, uniq, split, last, toUpper, isArray, capitalize, toArray, indexOf } = require('lodash');

const isAttr = (prop) => String(prop).substr(0,1) === '@';

const getFields = (properties, required) => {
  if (isNil(properties) ) return null;
  const propKeys = Object.keys(properties);
  const fields = propKeys.map((key) => {
    const isAttribute = isAttr(key);
    const isRequired = indexOf(required, key) > -1;
    const description = get(properties[key], 'description', null);
    const ref = last(split(get(properties[key], '$ref', null), '/'));
    const name = isAttribute ? key.substr(1, key.length) : key;

    let typeName = ref !== '' ? ref : capitalize(get(properties[key], 'type', name));
    if (!isNil(properties[key].oneOf)) {
      const ref1 = last(split(get(properties[key], 'oneOf[0].$ref', null), '/'));
      const type1 = get(properties[key], 'oneOf[0].type', null);
      const typeName1 = isNil(type1) ? ref1 : capitalize(type1);
      const ref2 = last(split(get(properties[key], 'oneOf[1].$ref', null), '/'));
      const type2 = get(properties[key], 'oneOf[1].type', null);
      const typeName2 = isNil(type2) ? ref2 : capitalize(type2);
      if (typeName2 === 'Array') {
        typeName = `${typeName1}`;
      } else {
        typeName = `${typeName1}`;
      }
    } else if (!isNil(properties[key].allOf)) {
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
      isRequired,
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
    required,
  } = data[key];

  console.log('data[key]', data[key]);

  let kind = isNil(properties) ? toUpper(type) : 'OBJECT';
  // if (kind === 'STRING') kind = 'SCALAR';

  const fields = getFields(properties, toArray(required));

  let graphQLTypeFields = '';
  if(isArray(fields)) fields.forEach(field => {
    const requiredString = field.isRequired ? '!' : '';

    if (!isNil(field.description)) graphQLTypeFields += `"""
${field.description}
"""
`;
    graphQLTypeFields += `  ${field.name}: ${field.typeName}${requiredString}
`
  })

  let graphQLType = `"""
${description}
"""
type ${key} {
  id: String!
}
  `;
  if (isArray(fields)) {
    graphQLType = `"""
${description}
"""
type ${key} {
  ${graphQLTypeFields}}
`;
  } else {
    const ref = last(split(get(data[key], 'allOf[0].$ref', null), '/'));
    if (ref !== '') graphQLType = `"""
${description}
"""
type ${key} {
  content: ${ref}!
}
`;
}
    if (isArray(enumValues)){
      let values = '';
      enumValues.forEach((value, index) => {
        values += `  ${value}
`;
      })
      graphQLType = `"""
${description} - Accepted Values: ${enumValues.join(', ')}
"""
enum ${key} {
VALUES
}`;
}

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