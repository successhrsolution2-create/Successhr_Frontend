const fs = require('fs');
const PizZip = require('pizzip');

const content = fs.readFileSync('./public/templates/interview-letter-template.docx');
const zip = new PizZip(content);
let xml = zip.file('word/document.xml').asText();

// Replace the exact run containing 'be 100%' with 'be {chargePercent}'
xml = xml.split('<w:t>be 100%</w:t>').join('<w:t>be {chargePercent}</w:t>');

zip.file('word/document.xml', xml);
const buffer = zip.generate({ type: 'nodebuffer' });
fs.writeFileSync('./public/templates/interview-letter-template.docx', buffer);

// Verify
const verify = new PizZip(fs.readFileSync('./public/templates/interview-letter-template.docx'));
const verifyXml = verify.file('word/document.xml').asText();
console.log('Has chargePercent tag:', verifyXml.includes('{chargePercent}'));
console.log('Has old 100%:', verifyXml.includes('be 100%'));
