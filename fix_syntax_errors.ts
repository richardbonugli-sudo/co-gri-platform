import * as fs from 'fs';

const content = fs.readFileSync('src/data/companySpecificExposures.ts', 'utf-8');

// Fix the issue: country names with apostrophes need to be escaped
const fixed = content
  .replace(/{ country: '([^']*)'([^']*)', percentage:/g, (match, before, after) => {
    // If there's an apostrophe in the country name, escape it
    return `{ country: '${before}\\'${after}', percentage:`;
  })
  .replace(/{ country: "([^"]*)"([^"]*)", percentage:/g, (match, before, after) => {
    // Handle double quotes too
    return `{ country: "${before}\\"${after}", percentage:`;
  });

fs.writeFileSync('src/data/companySpecificExposures.ts', fixed);
console.log('Fixed apostrophe escaping issues');
