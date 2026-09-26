const fs = require('fs');
let code = fs.readFileSync('src/candidate/pages/admin/Candidates/CandidatesList.jsx', 'utf8');

if (!code.includes('atsSearch')) {
  code = code.replace(
    "const [search, setSearch] = useState('')",
    "const [search, setSearch] = useState('')\n  const [atsSearch, setAtsSearch] = useState('')"
  );
  
  code = code.replace(
    "search: search.trim() || undefined,",
    "search: search.trim() || undefined,\n          atsSearch: atsSearch.trim() || undefined,"
  );

  code = code.replace(
    "}, [candidateFilters, dateRange, page, pageSize, search, tileFilter, visitDateRange])",
    "}, [candidateFilters, dateRange, page, pageSize, search, atsSearch, tileFilter, visitDateRange])"
  );
  
  code = code.replace(
    "}, [candidateFilters, search, dateRange, pageSize, tileFilter, visitDateRange])",
    "}, [candidateFilters, search, atsSearch, dateRange, pageSize, tileFilter, visitDateRange])"
  );
  
  code = code.replace(
    "setSearch('')",
    "setSearch('')\n    setAtsSearch('')"
  );

  const searchInputRegex = /<input\s+value=\{search\}\s+onChange=\{\(event\) => setSearch\(event\.target\.value\)\}\s+placeholder="Search by ID, name, mobile, email, skills".*?\/>/s;
  
  const searchInputMatch = code.match(searchInputRegex);
  if (searchInputMatch) {
    const atsInput = searchInputMatch[0].replace(/search/g, 'atsSearch').replace(/setSearch/g, 'setAtsSearch').replace('Search by ID, name, mobile, email, skills', 'ATS Skill Scan (Deep Resume Search)');
    code = code.replace(searchInputRegex, searchInputMatch[0] + '\n' + atsInput);
  } else {
    console.log("Could not find search input regex");
  }

  // To make it fit side by side, let's change grid layout slightly if needed
  code = code.replace(
    'className="grid gap-2 xl:grid-cols-[minmax(0,1.25fr)_repeat(4,minmax(0,1fr))]"',
    'className="grid gap-2 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1.25fr)_repeat(4,minmax(0,1fr))]"'
  );
  
  fs.writeFileSync('src/candidate/pages/admin/Candidates/CandidatesList.jsx', code);
  console.log('Frontend ATS search added');
} else {
  console.log('Already added');
}
