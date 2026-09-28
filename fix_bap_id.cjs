const fs = require('fs');
const p = 'backend/app/api/[...path]/route.js';
let content = fs.readFileSync(p, 'utf8');
content = content.replace(
  "    if (route === 'bap') {\n      await requireAuth(ADMIN_ROLES);\n      const pool = connection();\n      if (id) {",
  "    if (route === 'bap') {\n      await requireAuth(ADMIN_ROLES);\n      const pool = connection();\n      const id = params.get('id');\n      if (id) {"
);
fs.writeFileSync(p, content);
