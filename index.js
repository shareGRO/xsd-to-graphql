const fs = require('fs');
const path = require('path');
const Xsd2JsonSchema = require('xsd2jsonschema').Xsd2JsonSchema;
 
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

const allFiles = getAllFiles('xsd');

let allDefinitions = {};

allFiles.forEach((file) => {
  var XML_SCHEMA = fs.readFileSync(file, 'utf8');

  const xs2js = new Xsd2JsonSchema();
   
  const convertedSchemas = xs2js.processAllSchemas({
      schemas: {'hello_world.xsd': XML_SCHEMA}
  });
  const jsonSchema = convertedSchemas['hello_world.xsd'].getJsonSchema();

  const { definitions } = jsonSchema;
  
  allDefinitions = {
    ...allDefinitions,
    ...definitions,
  };
})

// console.log('allDefinitions', allDefinitions);

console.log('OrderValueLimits', allDefinitions['OrderValueLimits']);

const final = JSON.stringify(allDefinitions, null, 2);

// console.log(JSON.stringify(allDefinitions, null, 2));

fs.writeFile('final.json', final, 'utf8', () => {});

	// var result = jgeXml.parse(xml,function(state,token) {
	// 	//...
	// });