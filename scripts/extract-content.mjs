import fs from 'fs';
import path from 'path';
import vm from 'vm';

const rootDir = process.cwd();
const questionsOutDir = path.join(rootDir, 'src', 'data', 'questions');
const notesOutDir = path.join(rootDir, 'src', 'data', 'notes');

fs.mkdirSync(questionsOutDir, { recursive: true });
fs.mkdirSync(notesOutDir, { recursive: true });

const unitsMeta = [
  { id: 'unit_01', num: 1, dir: 'Unit_01_Foundations_of_Library_Science', title_hi: 'पुस्तकालय की नींव एवं समाज', title_en: 'Foundations of Library Science', part: 1 },
  { id: 'unit_02', num: 2, dir: 'Unit_02_Library_Management', title_hi: 'पुस्तकालय प्रबंधन एवं संगठन', title_en: 'Library Management', part: 1 },
  { id: 'unit_03', num: 3, dir: 'Unit_03_Classification_and_Cataloguing', title_hi: 'ज्ञान संगठन: वर्गीकरण एवं सूचीकरण', title_en: 'Classification and Cataloguing', part: 1 },
  { id: 'unit_04', num: 4, dir: 'Unit_04_Reference_and_Information_Services', title_hi: 'संदर्भ एवं सूचना सेवाएं', title_en: 'Reference and Information Services', part: 1 },
  { id: 'unit_05', num: 5, dir: 'Unit_05_IT_and_Library_Automation', title_hi: 'सूचना प्रौद्योगिकी, ऑटोमेशन एवं नेटवर्किंग', title_en: 'IT and Library Automation', part: 1 },
  { id: 'unit_06', num: 6, dir: 'Unit_06_Information_Science_and_Standards', title_hi: 'सूचना विज्ञान, शोध एवं मानक', title_en: 'Information Science and Standards', part: 1 },
  { id: 'unit_07', num: 7, dir: 'Unit_07_Bihar_GK_History_and_Culture', title_hi: 'बिहार विशेष: इतिहास, भूगोल, कला व आंदोलन', title_en: 'Bihar GK: History, Geography and Culture', part: 2 },
  { id: 'unit_08', num: 8, dir: 'Unit_08_Polity_Science_and_Current_Affairs', title_hi: 'भारतीय राजव्यवस्था, विज्ञान एवं समसामयिकी', title_en: 'Polity, Science and Current Affairs', part: 2 },
  { id: 'unit_09', num: 9, dir: 'Unit_09_Basic_Computer_Knowledge', title_hi: 'बुनियादी कंप्यूटर ज्ञान एवं सूचना प्रौद्योगिकी', title_en: 'Basic Computer Knowledge', part: 2 },
  { id: 'unit_10', num: 10, dir: 'Unit_10_Reasoning_and_Mental_Ability', title_hi: 'तार्किक क्षमता एवं मानसिक योग्यता', title_en: 'Reasoning and Mental Ability', part: 2 },
];

let totalQuestions = 0;
const allQuestionsList = [];
const manifest = [];

for (const unit of unitsMeta) {
  const unitPath = path.join(rootDir, unit.dir);
  if (!fs.existsSync(unitPath)) {
    console.warn(`Unit path not found: ${unitPath}`);
    continue;
  }

  const testsDir = path.join(unitPath, 'Tests');
  const notesDir = path.join(unitPath, 'Study_Notes');

  const unitManifest = {
    ...unit,
    subUnits: []
  };

  if (fs.existsSync(testsDir)) {
    const testFiles = fs.readdirSync(testsDir).filter(f => f.endsWith('.html')).sort();
    
    for (const testFile of testFiles) {
      const match = testFile.match(/SubUnit_(\d+\.\d+)_Quiz\.html/i);
      const subUnitNum = match ? match[1] : testFile;
      const htmlContent = fs.readFileSync(path.join(testsDir, testFile), 'utf-8');

      const startMarker = 'const questions = [';
      const startIndex = htmlContent.indexOf(startMarker);
      if (startIndex === -1) {
        console.error(`Questions array not found in ${testFile}`);
        continue;
      }

      let endIndex = htmlContent.indexOf('let current', startIndex);
      if (endIndex === -1) {
        endIndex = htmlContent.indexOf('function loadQuestion', startIndex);
      }
      if (endIndex === -1) {
        console.error(`End delimiter not found in ${testFile}`);
        continue;
      }

      const rawCode = htmlContent.substring(startIndex, endIndex).trim();
      const code = rawCode.replace('const questions =', 'questions =');

      const sandbox = {};
      vm.createContext(sandbox);
      vm.runInContext(code, sandbox);

      const rawQuestions = sandbox.questions || [];
      totalQuestions += rawQuestions.length;

      // Extract titles
      let title_hi = `उप-इकाई ${subUnitNum}`;
      let title_en = `SubUnit ${subUnitNum}`;
      const titleMatch = htmlContent.match(/<div class="header-title">[\s\S]*?<h1>(.*?)<\/h1>[\s\S]*?<p>(.*?)<\/p>/i);
      if (titleMatch) {
        title_hi = titleMatch[1].replace(/<[^>]+>/g, '').trim();
        title_en = titleMatch[2].replace(/<[^>]+>/g, '').trim();
      }

      // Normalize questions to strict uniform schema
      const enrichedQuestions = rawQuestions.map((q, idx) => {
        const id = q.id || q.num || (idx + 1);
        
        let options_hi = [];
        let options_en = [];
        let options = [];

        if (Array.isArray(q.options_hi) && Array.isArray(q.options_en)) {
          options_hi = q.options_hi;
          options_en = q.options_en;
          options = options_hi.map((hi, i) => ({ hi, en: options_en[i] || hi }));
        } else if (Array.isArray(q.options)) {
          options = q.options;
          options_hi = q.options.map(opt => typeof opt === 'string' ? opt : opt.hi);
          options_en = q.options.map(opt => typeof opt === 'string' ? opt : opt.en);
        }

        const exp_hi = q.exp_hi || q.explanation_hi || '';
        const exp_en = q.exp_en || q.explanation_en || '';

        return {
          globalId: `u${unit.num}_sub${subUnitNum.replace('.', '_')}_q${idx + 1}`,
          id: id,
          num: id,
          unitId: unit.id,
          unitNum: unit.num,
          subUnitNum: subUnitNum,
          unitTitle_hi: unit.title_hi,
          unitTitle_en: unit.title_en,
          subUnitTitle_hi: title_hi,
          subUnitTitle_en: title_en,
          q_hi: q.q_hi,
          q_en: q.q_en,
          options_hi,
          options_en,
          options,
          correct: q.correct,
          exp_hi,
          exp_en
        };
      });

      allQuestionsList.push(...enrichedQuestions);

      const subUnitFileName = `subunit_${subUnitNum.replace('.', '_')}_questions.json`;
      fs.writeFileSync(
        path.join(questionsOutDir, subUnitFileName),
        JSON.stringify(enrichedQuestions, null, 2),
        'utf-8'
      );

      // Markdown study notes copy
      if (fs.existsSync(notesDir)) {
        const noteFiles = fs.readdirSync(notesDir).filter(f => f.includes(`SubUnit_${subUnitNum}`));
        if (noteFiles.length > 0) {
          const noteFileName = noteFiles[0];
          const noteContent = fs.readFileSync(path.join(notesDir, noteFileName), 'utf-8');
          fs.writeFileSync(path.join(notesOutDir, `${subUnitNum}.md`), noteContent, 'utf-8');
        }
      }

      unitManifest.subUnits.push({
        subUnitNum,
        title_hi,
        title_en,
        questionsCount: enrichedQuestions.length,
        jsonFile: subUnitFileName,
        noteFile: `${subUnitNum}.md`
      });

      console.log(`✓ SubUnit ${subUnitNum}: Extracted & normalized ${enrichedQuestions.length} questions`);
    }
  }

  manifest.push(unitManifest);
}

fs.writeFileSync(
  path.join(questionsOutDir, 'all_questions.json'),
  JSON.stringify(allQuestionsList, null, 2),
  'utf-8'
);

fs.writeFileSync(
  path.join(rootDir, 'src', 'data', 'manifest.json'),
  JSON.stringify(manifest, null, 2),
  'utf-8'
);

console.log(`\n🎉 Extracted and normalized a total of ${totalQuestions} questions across ${manifest.length} units!`);
