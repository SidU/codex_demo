const fs = require('fs');
const path = require('path');
const readline = require('readline');

const dir = process.argv[2] || path.join(__dirname, '..', 'cards');

if (!fs.existsSync(dir)) {
  console.error(`Directory not found: ${dir}`);
  process.exit(1);
}

const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
if (files.length === 0) {
  console.log('No card files found.');
  process.exit(0);
}

let index = 0;

function load(file) {
  try {
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    const data = JSON.parse(content);
    return {
      question: data.question || '',
      correctAnswer: data.correctAnswer || '',
      aiAnswer: data.aiAnswer || ''
    };
  } catch (err) {
    console.error(`Failed to load ${file}: ${err.message}`);
    return { question: '', correctAnswer: '', aiAnswer: '' };
  }
}

function show() {
  const card = load(files[index]);
  console.log(`\n[${index + 1}/${files.length}] ${files[index]}`);
  console.log(`Question: ${card.question}`);
  console.log(`Correct Answer: ${card.correctAnswer}`);
  console.log(`AI Answer: ${card.aiAnswer}`);
  console.log('\nCommands: (n)ext, (p)revious, (q)uit');
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
show();
rl.on('line', line => {
  const cmd = line.trim().toLowerCase();
  if (cmd === 'n') {
    if (index < files.length - 1) index++;
  } else if (cmd === 'p') {
    if (index > 0) index--;
  } else if (cmd === 'q') {
    rl.close();
    return;
  }
  show();
});
