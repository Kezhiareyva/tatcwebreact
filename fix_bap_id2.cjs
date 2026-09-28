const fs = require('fs');
const lines = fs.readFileSync('backend/app/api/[...path]/route.js', 'utf8').split('\n');
const index = lines.findIndex(l => l.includes("if (route === 'bap')"));
if (index !== -1) {
  // Check if id is already defined
  if (!lines[index+3].includes('const id =')) {
    lines.splice(index + 3, 0, "      const id = params.get('id');");
    fs.writeFileSync('backend/app/api/[...path]/route.js', lines.join('\n'));
    console.log("Fixed!");
  } else {
    console.log("Already fixed");
  }
}
