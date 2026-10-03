const fs = require('fs');
const file = 'src/companyAdmin/pages/InterviewInfoForm.jsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/<label className={.lock text-sm font-semibold text-slate-700 }>/g, '<label className="block text-sm font-semibold text-slate-700">');
fs.writeFileSync(file, content, 'utf8');
