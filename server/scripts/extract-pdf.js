
const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

const dir = 'f:/claen_app_bangladesh';
const outputPath = path.join(__dirname, 'pdf-output.txt');

async function extractPdf() {
    try {
        const files = fs.readdirSync(dir);
        const pdfFile = files.find(f => f.includes('.pdf') && f.includes('November 2025'));

        if (!pdfFile) {
            fs.writeFileSync(outputPath, "ERROR: PDF file not found");
            return;
        }

        const fullPath = path.join(dir, pdfFile);
        const dataBuffer = fs.readFileSync(fullPath);

        const data = await pdf(dataBuffer);
        fs.writeFileSync(outputPath, data.text);
        console.log("Success! Text extracted.");

    } catch (error) {
        fs.writeFileSync(outputPath, "ERROR General: " + error.message);
        console.error("Error processing PDF:", error);
    }
}

extractPdf();
