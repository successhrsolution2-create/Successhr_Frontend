const fs = require('fs');
const PizZip = require('pizzip');

const content = fs.readFileSync('./public/templates/consent-letter-template.docx');
const zip = new PizZip(content);
let xml = zip.file('word/document.xml').asText();

// 1. Candidate Name
xml = xml.replace(/MD AZAD KHAN/g, '{candName}');
xml = xml.split('<w:t>Mr.</w:t><w:t xml:space="preserve"> {candName}</w:t>').join('<w:t>{candName}</w:t>');
xml = xml.split('<w:t>Mr.</w:t><w:t> {candName}</w:t>').join('<w:t>{candName}</w:t>');
xml = xml.split('<w:t>(Mr. </w:t><w:t>{candName}</w:t>').join('<w:t>({candName}</w:t>');

// Fix Date (if not already fixed)
xml = xml.replace(/07\/05\/2026/g, '{date}');

// The underline area (Selected and joining at...)
// Let's replace any consecutive underscores that are > 5 with {underlineInfo}
// Ensure we don't duplicate {underlineInfo} if we already ran it
xml = xml.replace(/_{5,}/g, '{underlineInfo}');
xml = xml.replace(/{underlineInfo}{underlineInfo}/g, '{underlineInfo}');

// For the blanks:
// Rs. _______ (% of total CTC)
// Rs. _______ (Paid/Pending)

// Let's replace 'Rs. ' followed by anything up to ' (% of total CTC)'
// Actually, it's easier to just strip them out manually if they are empty blanks.
// Wait, the user said: "not take all inf that undeline blank plz take it when creation of document"
// In the xml it might be: Rs. </w:t>.... <w:t>(% of total CTC)

// Instead of guessing, let's just dump the text around "CTC" and "Paid/Pending" to another file so I can see it exactly.
fs.writeFileSync('xml-dump.txt', xml);

// Let's find index of 'CTC'
const idx = xml.indexOf('CTC');
if(idx !== -1) {
  console.log('CTC MATCH:', xml.substring(idx - 100, idx + 100));
}
// Let's find index of 'Paid/Pending'
const idx2 = xml.indexOf('Paid/Pending');
if(idx2 !== -1) {
  console.log('Paid/Pending 1:', xml.substring(idx2 - 100, idx2 + 100));
}

zip.file('word/document.xml', xml);
const buffer = zip.generate({ type: 'nodebuffer' });
fs.writeFileSync('./public/templates/consent-letter-template.docx', buffer);
console.log('Saved docx with candName');
