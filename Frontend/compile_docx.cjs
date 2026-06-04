const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// File paths
const mdPath = path.join(__dirname, '..', 'RAPPORT_PFE_COMPLET.md');
const docPath = path.join(__dirname, '..', 'RAPPORT_PFE_COMPLET.doc');

console.log('--- Démarrage de la compilation du rapport PFE au format Word (.doc) ---');

// 1. Read Markdown content
if (!fs.existsSync(mdPath)) {
  console.error(`Erreur : Le fichier source ${mdPath} est introuvable.`);
  process.exit(1);
}

let markdown = fs.readFileSync(mdPath, 'utf8');

// 2. Perform text replacements for placeholders
console.log('Remplacement des placeholders...');
markdown = markdown.replace(/\[Vos Noms et Prénoms\]/g, 'Marouane Radi & Hamza Kisra');
markdown = markdown.replace(/\[Date\]/g, 'Mai 2026');

// 3. Slice Markdown to start from REMERCIEMENTS
const startIdx = markdown.indexOf('# REMERCIEMENTS');
if (startIdx === -1) {
  console.error('Erreur : Impossible de localiser la section # REMERCIEMENTS.');
  process.exit(1);
}
let mainMarkdown = markdown.substring(startIdx);

// 4. Inject English Abstract right after Résumé Exécutif
console.log('Traduction et injection de l\'Abstract en anglais...');
const resumeTitle = '# RÉSUMÉ EXÉCUTIF';
const introTitle = '# INTRODUCTION GÉNÉRALE';

const resumeIdx = mainMarkdown.indexOf(resumeTitle);
const introIdx = mainMarkdown.indexOf(introTitle);

if (resumeIdx !== -1 && introIdx !== -1) {
  const abstractContent = `
# ABSTRACT

This report presents the final year graduation project (PFE) titled **"Institutional PV Archiving System – OFPPT"**, a modern web platform designed to revolutionize the management and archiving of meeting minutes (Procès-Verbaux) within OFPPT institutions.

Historically, OFPPT relied on manual paper-based archiving for administrative and pedagogical documents. This approach, while functional, presented numerous limitations: difficulties in locating documents, risks of loss or physical damage, lack of traceability, and the absence of advanced search features.

The developed project offers a comprehensive and integrated solution featuring:
- **Secure digital archiving** of passage, intermediate, and final course minutes.
- **Intelligent promotion management** with automated Excel file imports.
- **Dynamic classification system** by cohort (promotion), academic year, and document type.
- **Secure authentication** with role-based access control (RBAC).
- **Advanced search engine** for quick document retrieval.
- **Comprehensive activity logs** for complete auditability and traceability.
- **Modern responsive user interface** accessible from any device.

The platform was built using a modern full-stack web architecture:
- **Robust backend** using Laravel and PHP.
- **Intuitive frontend** with React.js and Tailwind CSS.
- **Secure database** using MySQL.

This project demonstrates how digital technologies can optimize administrative processes and contribute to the digital transformation of educational institutions.

**Keywords:** Digital Archiving, Document Management, PV OFPPT, React.js, Laravel, MySQL, Web Platform

---
`;
  
  mainMarkdown = mainMarkdown.substring(0, introIdx) + abstractContent + mainMarkdown.substring(introIdx);
}

// 5. Replace screenshot placeholders in markdown with stylized HTML divs before parsing
console.log('Traitement et stylisation des captures d\'écran...');
mainMarkdown = mainMarkdown.replace(/(\*?\[CAPTURE D'ÉCRAN\s*-\s*([^\]]+)\]\*?)/gi, (match, p1, p2) => {
  return `
<div style="border: 2px dashed #0d9488; background-color: #f0fdfa; padding: 15px; text-align: center; margin: 15px 0; border-radius: 6px;">
  <strong style="color: #0d9488; font-size: 11pt; font-family: Arial, sans-serif;">[CAPTURE D'ÉCRAN - ${p2}]</strong><br/>
  <span style="color: #64748b; font-size: 9pt; font-family: Arial, sans-serif; font-style: italic;">Aperçu visuel de l'interface utilisateur de l'application</span>
</div>
`;
});

// 6. Convert Markdown to HTML
console.log('Conversion du Markdown en HTML...');
let bodyHtml = marked.parse(mainMarkdown);

// Add class to first h1 to prevent leading blank page in Word
bodyHtml = bodyHtml.replace('<h1>REMERCIEMENTS</h1>', '<h1 class="first-h1">REMERCIEMENTS</h1>');

// 7. Assemble complete HTML content for Word import
const completeHtml = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>Rapport PFE Complet - Système d'Archivage OFPPT</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page {
      size: A4;
      margin: 2.5cm 2cm 2cm 2cm;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #000000;
    }
    h1 {
      page-break-before: always;
      color: #0f172a;
      font-family: 'Arial', sans-serif;
      font-size: 18pt;
      font-weight: bold;
      border-bottom: 2px solid #0d9488;
      padding-bottom: 5px;
      margin-top: 30px;
      margin-bottom: 15px;
    }
    .first-h1 {
      page-break-before: avoid !important;
    }
    h2 {
      color: #0f172a;
      font-family: 'Arial', sans-serif;
      font-size: 14pt;
      font-weight: bold;
      margin-top: 25px;
      margin-bottom: 10px;
    }
    h3 {
      color: #1e293b;
      font-family: 'Arial', sans-serif;
      font-size: 12pt;
      font-weight: bold;
      margin-top: 20px;
      margin-bottom: 8px;
    }
    p {
      margin-bottom: 12px;
      text-align: justify;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 10pt;
    }
    th {
      background-color: #0f172a;
      color: #ffffff;
      font-family: 'Arial', sans-serif;
      font-weight: bold;
      padding: 8px 12px;
      border: 1px solid #1e293b;
      text-align: left;
    }
    td {
      padding: 8px 12px;
      border: 1px solid #cbd5e1;
    }
    ul, ol {
      margin-bottom: 12px;
      padding-left: 20px;
    }
    li {
      margin-bottom: 5px;
    }
    code {
      font-family: 'Consolas', monospace;
      background-color: #f1f5f9;
      padding: 2px 4px;
      border-radius: 4px;
      font-size: 9.5pt;
    }
    pre {
      font-family: 'Consolas', monospace;
      background-color: #f8fafc;
      padding: 12px;
      border-left: 4px solid #475569;
      margin: 15px 0;
      border-radius: 4px;
      font-size: 9.5pt;
      white-space: pre-wrap;
    }
    blockquote {
      border-left: 4px solid #0d9488;
      background-color: #f0fdfa;
      padding: 10px 15px;
      margin: 15px 0;
      font-style: italic;
    }
  </style>
</head>
<body>

  <!-- PAGE DE GARDE -->
  <div style="text-align: center; padding: 40px 0; font-family: Arial, sans-serif;">
    <p style="color: #0f172a; font-size: 16pt; font-weight: bold; margin-bottom: 5px; text-transform: uppercase;">
      Office de la Formation Professionnelle et de la Promotion du Travail
    </p>
    <p style="color: #475569; font-size: 12pt; margin-bottom: 40px;">
      Institut Spécialisé de Technologie Appliquée de Ouarzazate
    </p>
    
    <hr style="border: 1px solid #cbd5e1; margin-bottom: 50px;" />
    
    <p style="color: #0d9488; font-size: 11pt; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 15px; font-weight: bold;">
      PROJET DE FIN D'ÉTUDES (PFE)
    </p>
    <p style="color: #0f172a; font-size: 22pt; font-weight: bold; margin-bottom: 10px; line-height: 1.2;">
      Système d’Archivage Institutionnel des PV – OFPPT
    </p>
    <p style="color: #64748b; font-size: 12pt; font-style: italic; margin-bottom: 80px;">
      Plateforme Fullstack de Numérisation, d’Indexation et de Sécurisation des Procès-Verbaux
    </p>
    
    <div style="margin-top: 50px; margin-bottom: 50px; text-align: left; font-size: 11pt; color: #1e293b; line-height: 1.6;">
      <p style="margin-bottom: 15px;">
        <strong style="color: #0d9488;">Réalisé par :</strong><br/>
        • <strong>Marouane Radi</strong><br/>
        • <strong>Hamza Kisra</strong>
      </p>
      <p style="margin-top: 20px;">
        <strong style="color: #0d9488;">Sous la supervision de :</strong><br/>
        • M. <strong>Ilyas Nasiri</strong> (Conseiller Technique)<br/>
        • M. <strong>Said Gahi</strong> (Conseiller Pédagogique)
      </p>
    </div>
    
    <hr style="border: 1px solid #cbd5e1; margin-top: 80px; margin-bottom: 20px;" />
    
    <p style="color: #475569; font-size: 11pt; font-weight: bold;">
      Filière : Développement Digital – Option Fullstack (2ème année)
    </p>
    <p style="color: #64748b; font-size: 10pt; margin-top: 5px;">
      Année Académique : 2025/2026
    </p>
  </div>
  
  <br style="page-break-after: always; break-after: page;" />

  <!-- CORPS DU RAPPORT -->
  ${bodyHtml}

</body>
</html>
`;

// 8. Write the file with .doc extension
console.log('Écriture du fichier Word (.doc)...');
fs.writeFileSync(docPath, completeHtml, 'utf8');

// Also remove the broken .docx file to avoid confusion
const brokenDocxPath = path.join(__dirname, '..', 'RAPPORT_PFE_COMPLET.docx');
if (fs.existsSync(brokenDocxPath)) {
  fs.unlinkSync(brokenDocxPath);
}

console.log(`Document Word généré avec succès et enregistré à : ${docPath}`);
