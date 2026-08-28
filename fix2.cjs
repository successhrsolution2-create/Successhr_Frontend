const fs = require('fs');
const PizZip = require('pizzip');

const content = fs.readFileSync('./public/templates/consent-letter-template.docx');
const zip = new PizZip(content);
let xml = zip.file('word/document.xml').asText();

// A helper function to replace a string that might be interrupted by XML tags.
// For example "MD AZAD KHAN" could be "MD<w:t> AZAD <w:t>KHAN"
function replaceWithTagsIgnored(target, replacement) {
  // create regex: M(?:<[^>]*>)*D(?:<[^>]*>)*...
  const chars = target.split('');
  const regexStr = chars.map(c => c === ' ' ? '(?:<[^>]*>|\\s)*' : c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:<[^>]*>)*').join('');
  const regex = new RegExp(regexStr, 'g');
  xml = xml.replace(regex, replacement);
}

replaceWithTagsIgnored('MD AZAD KHAN', '{candName}');
replaceWithTagsIgnored('Mr. {candName}', '{candName}');
replaceWithTagsIgnored('(Mr. {candName})', '({candName})');

// Now for the amounts:
// "Rs. (% of total CTC)"
// We want to insert {totalAmount} after Rs.
replaceWithTagsIgnored('Rs. (% of total CTC)', 'Rs. {totalAmount} (% of total CTC)');
replaceWithTagsIgnored('Rs. (% of total CTC)', 'Rs. {totalAmount} (% of total CTC)');

replaceWithTagsIgnored('First installment (Before Joining)Rs. (Paid/Pending)', 'First installment (Before Joining) Rs. {firstInstallmentAmount} ({firstInstallmentStatus})');
// Sometimes there's a space after Rs.
replaceWithTagsIgnored('First installment (Before Joining)Rs.  (Paid/Pending)', 'First installment (Before Joining) Rs. {firstInstallmentAmount} ({firstInstallmentStatus})');
replaceWithTagsIgnored('First installment (Before Joining) Rs. (Paid/Pending)', 'First installment (Before Joining) Rs. {firstInstallmentAmount} ({firstInstallmentStatus})');

replaceWithTagsIgnored('Second Installment (In first month salary)Rs. (Paid/Pending)', 'Second Installment (In first month salary) Rs. {secondInstallmentAmount} ({secondInstallmentStatus})');
replaceWithTagsIgnored('Second Installment (In first month salary) Rs. (Paid/Pending)', 'Second Installment (In first month salary) Rs. {secondInstallmentAmount} ({secondInstallmentStatus})');

zip.file('word/document.xml', xml);
const buffer = zip.generate({ type: 'nodebuffer' });
fs.writeFileSync('./public/templates/consent-letter-template.docx', buffer);
console.log('Fixed tags completely');
