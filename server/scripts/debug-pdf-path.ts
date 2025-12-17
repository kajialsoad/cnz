
import fs from 'fs';
import path from 'path';

// Try to find the file by listing dir
const dir = 'f:/claen_app_bangladesh';
try {
    const files = fs.readdirSync(dir);
    const pdfFile = files.find(f => f.includes('.pdf') && f.includes('November 2025'));
    console.log("Found PDF file:", pdfFile);

    if (pdfFile) {
        const fullPath = path.join(dir, pdfFile);
        console.log("Reading file at:", fullPath);
        const stats = fs.statSync(fullPath);
        console.log("File size:", stats.size);
    }
} catch (e) {
    console.error("Error listing dir:", e);
}
