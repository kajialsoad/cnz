
import fs from 'fs';
import pdf from 'pdf-parse';
import path from 'path';

const dir = 'f:/claen_app_bangladesh';

async function extractPdf() {
    try {
        const files = fs.readdirSync(dir);
        const pdfFile = files.find(f => f.includes('.pdf') && f.includes('November 2025'));

        if (!pdfFile) {
            console.error("PDF file not found");
            return;
        }

        const fullPath = path.join(dir, pdfFile);
        console.log("Reading file:", fullPath);

        const dataBuffer = fs.readFileSync(fullPath);
        const data = await pdf(dataBuffer);

        console.log("PDF TEXT START");
        console.log(data.text);
        console.log("PDF TEXT END");

    } catch (error) {
        console.error("Error processing PDF:", error);
    }
}

extractPdf();
