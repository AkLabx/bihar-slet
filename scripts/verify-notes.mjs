import fs from 'fs';
import path from 'path';

const EXPECTED_IDS = [
  '1.1', '1.2', '1.3', '1.4', '2.1', '2.2', '2.3', '2.4',
  '3.1', '3.2', '4.1', '4.2', '4.3', '4.4',
  '5.1', '5.2', '5.3', '5.4', '6.1', '6.2',
  '7.1', '7.2', '7.3', '8.1', '8.2', '8.3', '9.1', '9.2', '10.1', '10.2'
];

const WORKER_MAP = {
  '1.1': 'worker-unit1-2', '1.2': 'worker-unit1-2', '1.3': 'worker-unit1-2', '1.4': 'worker-unit1-2',
  '2.1': 'worker-unit1-2', '2.2': 'worker-unit1-2', '2.3': 'worker-unit1-2', '2.4': 'worker-unit1-2',
  '3.1': 'worker-unit3-4', '3.2': 'worker-unit3-4',
  '4.1': 'worker-unit3-4', '4.2': 'worker-unit3-4', '4.3': 'worker-unit3-4', '4.4': 'worker-unit3-4',
  '5.1': 'worker-unit5-6', '5.2': 'worker-unit5-6', '5.3': 'worker-unit5-6', '5.4': 'worker-unit5-6',
  '6.1': 'worker-unit5-6', '6.2': 'worker-unit5-6',
  '7.1': 'worker-unit7-10', '7.2': 'worker-unit7-10', '7.3': 'worker-unit7-10',
  '8.1': 'worker-unit7-10', '8.2': 'worker-unit7-10', '8.3': 'worker-unit7-10',
  '9.1': 'worker-unit7-10', '9.2': 'worker-unit7-10',
  '10.1': 'worker-unit7-10', '10.2': 'worker-unit7-10'
};

const DIRS = ['en', 'hi', 'bilingual'];
const baseDir = path.resolve('src/data/notes');

let allPassed = true;
const summary = {
  missingFiles: {},
  devanagariViolations: [],
  fileCounts: {}
};

for (const dir of DIRS) {
  summary.missingFiles[dir] = [];
  const targetDir = path.join(baseDir, dir);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  let count = 0;
  for (const id of EXPECTED_IDS) {
    const filename = `${id}.md`;
    const filePath = path.join(targetDir, filename);
    if (!fs.existsSync(filePath)) {
      summary.missingFiles[dir].push(filename);
      allPassed = false;
    } else {
      count++;
    }
  }
  summary.fileCounts[dir] = count;
}

// Check Devanagari in en/*.md
const enDir = path.join(baseDir, 'en');
const devanagariRegex = /[\u0900-\u097F]/;

for (const id of EXPECTED_IDS) {
  const filePath = path.join(enDir, `${id}.md`);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const violationsInFile = [];

    lines.forEach((line, index) => {
      if (devanagariRegex.test(line)) {
        violationsInFile.push({
          lineNum: index + 1,
          snippet: line.trim().slice(0, 80)
        });
      }
    });

    if (violationsInFile.length > 0) {
      allPassed = false;
      summary.devanagariViolations.push({
        file: `src/data/notes/en/${id}.md`,
        subUnit: id,
        worker: WORKER_MAP[id],
        violations: violationsInFile
      });
    }
  }
}

console.log(JSON.stringify({ allPassed, summary }, null, 2));
