const fs = require('fs');
const content = fs.readFileSync('js/app.js', 'utf8');

let openBraces = 0;
let lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    for (let char of line) {
        if (char === '{') openBraces++;
        if (char === '}') openBraces--;
    }
    if (openBraces < 0) {
        console.log(`Extra closing brace found at line ${i + 1}`);
        openBraces = 0;
    }
}

if (openBraces > 0) {
    console.log(`Unclosed braces remaining: ${openBraces}`);
} else {
    console.log('Braces are balanced');
}
