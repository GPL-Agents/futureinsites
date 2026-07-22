const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const { PDFParse } = require('pdf-parse');

async function main() {
  const dir = path.join(__dirname, '..', 'knowledge');

  // Extract docx files
  for (const f of ['greg_career_narrative.docx', 'Greg_Loeffelholz_AI_Resume.docx']) {
    const buf = fs.readFileSync(path.join(dir, f));
    const result = await mammoth.extractRawText({ buffer: buf });
    const txt = result.value;
    const outName = f.replace(/\.docx$/, '.txt');
    fs.writeFileSync(path.join(dir, outName), txt, 'utf-8');
    console.log(`${f} -> ${outName}: ${txt.length} chars`);
  }

  // Extract PDF
  const pdfBuf = fs.readFileSync(path.join(dir, 'Greg_Loeffelholz.Resume.pdf'));
  const pdfData = await PDFParse(pdfBuf);
  fs.writeFileSync(path.join(dir, 'Greg_Loeffelholz.Resume.txt'), pdfData.text, 'utf-8');
  console.log(`Greg_Loeffelholz.Resume.pdf -> txt: ${pdfData.text.length} chars`);
}

main().catch(e => console.error(e));
