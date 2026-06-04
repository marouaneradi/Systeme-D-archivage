const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { marked } = require('marked');

// File paths
const mdPath = path.join(__dirname, '..', 'RAPPORT_PFE_COMPLET.md');
const pdfPath = path.join(__dirname, '..', 'RAPPORT_PFE_COMPLET.pdf');
const tempHtmlPath = path.join(__dirname, 'temp_report.html');

console.log('--- Démarrage de la compilation du rapport PFE ---');

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

// 3. Slice Markdown to start from REMERCIEMENTS (ignoring the draft cover page in Markdown)
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
  
  // Insert abstract before general introduction
  mainMarkdown = mainMarkdown.substring(0, introIdx) + abstractContent + mainMarkdown.substring(introIdx);
}

// 5. Convert Markdown to HTML
console.log('Conversion du Markdown en HTML...');
const mainContentHtml = marked.parse(mainMarkdown);

// 5.5. Read screenshots folder and create mapping
const screenshotsDir = path.join(__dirname, '..', 'screenshots');
const screenshotsMap = {};
if (fs.existsSync(screenshotsDir)) {
  const files = fs.readdirSync(screenshotsDir);
  files.forEach(file => {
    if (file.endsWith('.png')) {
      screenshotsMap[file] = true;
    }
  });
}
console.log('Screenshots disponibles :', Object.keys(screenshotsMap));

// 6. Define HTML Template
const htmlTemplate = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Système d'Archivage Institutionnel des PV – OFPPT</title>
  
  <!-- Screenshots Context -->
  <script>
    window.existingScreenshots = ${JSON.stringify(screenshotsMap)};
    window.screenshotsDir = "${screenshotsDir.replace(/\\/g, '/')}";
  </script>
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
  
  <!-- Paged.js Config (Disable auto) -->
  <script>
    window.PagedConfig = { auto: false };
  </script>
  <!-- Paged.js Polyfill -->
  <script src="https://unpkg.com/pagedjs/dist/paged.polyfill.js"></script>
  
  <!-- Mermaid.js via cdnjs to bypass tracking prevention -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/mermaid/10.9.0/mermaid.min.js"></script>

  <style>
    /* ----------------------------------------------------
       DESIGN SYSTEM & PRINT PAGE CONFIGURATION (Paged.js)
       ---------------------------------------------------- */
    
    @page {
      size: A4;
      margin: 25mm 20mm 20mm 20mm;
      @bottom-right {
        content: counter(page);
        font-family: 'Inter', sans-serif;
        font-size: 8.5pt;
        font-weight: 500;
        color: #64748b;
      }
      @bottom-left {
        content: "Développement Digital – Option Fullstack";
        font-family: 'Inter', sans-serif;
        font-size: 8pt;
        color: #64748b;
      }
      @top-center {
        content: "Système d’Archivage Institutionnel des PV – OFPPT";
        font-family: 'Inter', sans-serif;
        font-size: 8pt;
        color: #64748b;
        border-bottom: 0.5px solid #cbd5e1;
        padding-bottom: 8px;
        width: 100%;
      }
    }

    /* Named page for Cover (No margins, no headers/footers) */
    @page cover {
      margin: 0;
      @top-center { content: none; }
      @bottom-left { content: none; }
      @bottom-right { content: none; }
    }

    /* Named page for Front Matter (Roman numerals, no top header) */
    @page front-matter {
      margin: 25mm 20mm 20mm 20mm;
      @top-center { content: none; }
      @bottom-left { content: none; }
      @bottom-right {
        content: counter(page, lower-roman);
        font-family: 'Inter', sans-serif;
        font-size: 8.5pt;
        color: #64748b;
      }
    }

    .cover-page {
      page: cover;
      height: 297mm;
      box-sizing: border-box;
      padding: 25mm 20mm 20mm 20mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background-color: white;
    }

    .front-matter-page {
      page: front-matter;
    }

    .main-content-page {
      page: main; /* Back to standard page layout */
    }

    .page-break {
      page-break-before: always;
      break-before: page;
    }

    /* Reset page counter handled dynamically via JavaScript */

    /* Disable physical page counter and duplicate text pseudo-elements on margin boxes */
    .pagedjs_margin-content::after,
    .pagedjs_margin-content::before {
      content: none !important;
    }

    /* ----------------------------------------------------
       TYPOGRAPHY & CONTENT STYLING
       ---------------------------------------------------- */
    
    body {
      font-family: 'Lora', Georgia, serif;
      font-size: 11pt;
      line-height: 1.65;
      color: #1e293b;
    }

    h1, h2, h3, h4, h5, h6 {
      font-family: 'Inter', sans-serif;
      color: #0f172a;
      page-break-after: avoid;
      break-after: avoid;
    }

    h1 {
      font-size: 20pt;
      font-weight: 800;
      margin-top: 0;
      margin-bottom: 22px;
      color: #0f172a;
      border-bottom: 2px solid #0d9488; /* Teal Accent */
      padding-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    h2 {
      font-size: 14pt;
      font-weight: 700;
      margin-top: 35px;
      margin-bottom: 15px;
      color: #1e3a8a; /* Deep Navy Blue */
      border-left: 3px solid #1e3a8a;
      padding-left: 10px;
    }

    h3 {
      font-size: 11.5pt;
      font-weight: 600;
      margin-top: 25px;
      margin-bottom: 10px;
      color: #0f766e; /* Dark Teal */
    }

    p {
      text-align: justify;
      text-justify: inter-word;
      margin-top: 0;
      margin-bottom: 14pt;
    }

    /* Lists styling */
    ul, ol {
      margin-top: 0;
      margin-bottom: 14pt;
      padding-left: 20px;
    }
    
    li {
      margin-bottom: 6px;
      text-align: justify;
    }

    /* Code & Diagrams */
    code {
      font-family: 'Fira Code', 'Courier New', Courier, monospace;
      background-color: #f1f5f9;
      color: #0f172a;
      padding: 2px 5px;
      border-radius: 4px;
      font-size: 9pt;
      font-weight: 500;
    }

    pre {
      background-color: #f8fafc;
      border-left: 4px solid #0d9488;
      border-right: 1px solid #e2e8f0;
      border-top: 1px solid #e2e8f0;
      border-bottom: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 15px;
      overflow: auto;
      font-family: 'Fira Code', Consolas, monospace;
      font-size: 8.5pt;
      line-height: 1.5;
      margin: 20px 0;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    pre code {
      background-color: transparent;
      padding: 0;
      font-size: 8.5pt;
      color: #334155;
    }

    /* ----------------------------------------------------
       COVER PAGE DETAILS
       ---------------------------------------------------- */
    
    .cover-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 15px;
    }
    .cover-logo {
      height: 48px;
      object-fit: contain;
    }
    .cover-institution {
      text-align: right;
      font-family: 'Inter', sans-serif;
    }
    .inst-ofppt {
      font-weight: 800;
      font-size: 10pt;
      color: #0f172a;
    }
    .inst-ista {
      font-size: 8.5pt;
      color: #475569;
      margin-top: 2px;
      font-weight: 500;
    }
    .cover-body {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      margin: 40px 0;
    }
    .project-tag {
      font-family: 'Inter', sans-serif;
      font-weight: 800;
      font-size: 12pt;
      letter-spacing: 2px;
      color: #0d9488;
      margin-bottom: 25px;
    }
    .project-title-container {
      border: 3px double #0f172a;
      padding: 35px 25px;
      margin-bottom: 30px;
      background-color: #f8fafc;
      border-radius: 8px;
      width: 100%;
      box-sizing: border-box;
    }
    .project-title {
      font-family: 'Inter', sans-serif;
      font-weight: 800;
      font-size: 23pt;
      line-height: 1.35;
      color: #0f172a;
      margin: 0 0 15px 0;
      border-bottom: none !important;
      padding-bottom: 0 !important;
      text-transform: none;
      letter-spacing: normal;
    }
    .project-subtitle {
      font-family: 'Inter', sans-serif;
      font-size: 12.5pt;
      color: #475569;
      font-style: italic;
      font-weight: 500;
    }
    .filiere-container {
      font-family: 'Inter', sans-serif;
      font-size: 12pt;
      margin-top: 15px;
    }
    .filiere-label {
      font-weight: 700;
      color: #0f172a;
    }
    .filiere-value {
      color: #0d9488;
      font-weight: 700;
    }
    .cover-footer {
      display: flex;
      justify-content: space-between;
      margin-top: auto;
      border-top: 1px solid #cbd5e1;
      padding-top: 20px;
      margin-bottom: 35px;
    }
    .footer-column {
      width: 48%;
      font-family: 'Inter', sans-serif;
    }
    .footer-column:first-child {
      text-align: left;
    }
    .footer-column:last-child {
      text-align: right;
    }
    .column-title {
      font-weight: 700;
      font-size: 9.5pt;
      color: #64748b;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .student-name, .supervisor-name {
      font-size: 11pt;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 5px;
    }
    .supervisor-name {
      margin-bottom: 8px;
    }
    .role-desc {
      font-weight: 400;
      font-size: 9pt;
      color: #64748b;
    }
    .cover-year {
      text-align: center;
      font-family: 'Inter', sans-serif;
      font-weight: 700;
      font-size: 11pt;
      color: #0f172a;
      border-top: 2px solid #0f172a;
      padding-top: 12px;
    }

    /* ----------------------------------------------------
       TABLE OF CONTENTS & LISTS STYLING
       ---------------------------------------------------- */
    
    .toc-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .toc-item {
      margin-bottom: 10px;
      page-break-inside: avoid;
    }
    .toc-level-1 {
      font-weight: 700;
      margin-top: 20px;
      font-size: 11.5pt;
    }
    .toc-level-2 {
      margin-left: 20px;
      font-weight: 500;
      font-size: 10.5pt;
    }
    .toc-level-3 {
      margin-left: 40px;
      font-weight: 400;
      font-size: 9.5pt;
      color: #475569;
    }
    .toc-link {
      display: flex;
      align-items: flex-end;
      text-decoration: none;
      color: inherit;
    }
    .toc-title {
      background: white;
      padding-right: 5px;
      z-index: 1;
    }
    .toc-dots {
      flex-grow: 1;
      border-bottom: 1px dotted #94a3b8;
      margin: 0 5px 4px 5px;
      min-width: 20px;
    }
    .toc-link::after {
      content: none !important;
    }

    /* ----------------------------------------------------
       FIGURES AND TABLES STYLING
       ---------------------------------------------------- */
    
    .report-figure {
      margin: 30px auto;
      page-break-inside: avoid;
      break-inside: avoid;
      text-align: center;
      width: 95%;
    }
    .figure-placeholder {
      border: 2px dashed #cbd5e1;
      background-color: #f8fafc;
      border-radius: 8px;
      padding: 35px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 180px;
      box-sizing: border-box;
    }
    .placeholder-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: #64748b;
    }
    .placeholder-icon {
      width: 44px;
      height: 44px;
      stroke: #94a3b8;
      margin-bottom: 12px;
    }
    .placeholder-label {
      font-family: 'Inter', sans-serif;
      font-weight: 700;
      font-size: 10pt;
      color: #1e293b;
      margin-bottom: 4px;
    }
    .placeholder-desc {
      font-family: 'Inter', sans-serif;
      font-size: 9pt;
      color: #64748b;
      text-align: center;
      max-width: 400px;
    }
    figcaption {
      margin-top: 12px;
      font-family: 'Inter', sans-serif;
      font-size: 9.5pt;
      color: #475569;
      font-style: italic;
    }
    .fig-title {
      font-weight: 700;
      color: #0d9488;
    }

    /* Tables */
    .report-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 9.5pt;
    }
    .report-table th {
      background-color: #0f172a;
      color: white;
      font-family: 'Inter', sans-serif;
      font-weight: 700;
      padding: 10px 14px;
      border: 1px solid #1e293b;
      text-align: left;
    }
    .report-table td {
      padding: 9px 14px;
      border: 1px solid #e2e8f0;
      line-height: 1.5;
    }
    .report-table tr:nth-child(even) {
      background-color: #f8fafc;
    }
    .table-caption {
      font-family: 'Inter', sans-serif;
      font-size: 9.5pt;
      color: #475569;
      font-style: italic;
      margin-bottom: 10px;
      text-align: left;
    }
    .tbl-title {
      font-weight: 700;
      color: #0f172a;
    }
    .table-wrapper {
      margin: 30px 0;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .no-items {
      font-family: 'Inter', sans-serif;
      font-style: italic;
      color: #64748b;
      font-size: 10pt;
    }
  </style>
</head>
<body>

  <!-- PAGE DE GARDE -->
  <div class="cover-page">
    <div class="cover-header">
      <img class="cover-logo" src="file:///c:/Users/radim/OneDrive/Desktop/Systeme-d'archivage/Frontend/src/assets/Ofppt-logo-horizontal.png" alt="OFPPT Logo">
      <div class="cover-institution">
        <div class="inst-ofppt">Office de la Formation Professionnelle et de la Promotion du Travail</div>
        <div class="inst-ista">Institut Spécialisé de Technologie Appliquée de Ouarzazate</div>
      </div>
    </div>
    
    <div class="cover-body">
      <div class="project-tag">PROJET DE FIN D'ÉTUDES (PFE)</div>
      <div class="project-title-container">
        <h1 class="project-title">Système d’Archivage Institutionnel des PV – OFPPT</h1>
        <div class="project-subtitle">Plateforme Web Moderne pour la Gestion et l’Archivage des Procès-Verbaux</div>
      </div>
      <div class="filiere-container">
        <span class="filiere-label">Filière :</span>
        <span class="filiere-value">Développement Digital – Option Fullstack</span>
      </div>
    </div>
    
    <div class="cover-footer">
      <div class="footer-column">
        <div class="column-title">Réalisé par :</div>
        <div class="student-name">Marouane Radi</div>
        <div class="student-name">Hamza Kisra</div>
      </div>
      
      <div class="footer-column">
        <div class="column-title">Sous la direction de :</div>
        <div class="supervisor-name">M. Ilyas Nasiri <span class="role-desc">(Encadrant Technique)</span></div>
        <div class="supervisor-name">M. Said Gahi <span class="role-desc">(Encadrant Pédagogique)</span></div>
      </div>
    </div>
    
    <div class="cover-year">
      Année Universitaire : 2025/2026
    </div>
  </div>

  <!-- REPORT MAIN CONTENT -->
  <div id="content">
    ${mainContentHtml}
  </div>

  <!-- Paged.js Dynamic Handler -->
  <script>
    class ReportHandler extends Paged.Handler {
      constructor(chunker, polisher, caller) {
        super(chunker, polisher, caller);
      }

      beforeParsed(content) {
        // 1. Group all elements under their respective H1 headings into separate page sections
        const contentDiv = content.querySelector('#content');
        if (contentDiv) {
          const children = Array.from(contentDiv.children);
          let currentSection = null;
          let isFirstSection = true;
          
          children.forEach(child => {
            if (child.tagName === 'H1') {
              const title = child.textContent.toUpperCase();
              
              if (title.includes('REMERCIEMENTS') || title.includes('DÉDICACE') || 
                  title.includes('RÉSUMÉ') || title.includes('ABSTRACT')) {
                currentSection = document.createElement('div');
                currentSection.className = 'front-matter-page front-matter-section' + (isFirstSection ? '' : ' page-break');
                isFirstSection = false;
                contentDiv.appendChild(currentSection);
              } else {
                // If this is the start of the main content (e.g. INTRODUCTION GÉNÉRALE)
                // and we haven't inserted the TOC/LOF/LOT lists yet, let's insert them now!
                if (!content.querySelector('#toc-section')) {
                  // Create Table of Contents Section
                  const tocSec = document.createElement('div');
                  tocSec.id = 'toc-section';
                  tocSec.className = 'front-matter-page front-matter-exclude page-break';
                  tocSec.innerHTML = '<h1>Table des matières</h1><div id="toc-container"></div>';
                  contentDiv.appendChild(tocSec);

                  // Create List of Figures Section
                  const lofSec = document.createElement('div');
                  lofSec.id = 'lof-section';
                  lofSec.className = 'front-matter-page front-matter-exclude page-break';
                  lofSec.innerHTML = '<h1>Liste des figures</h1><div id="lof-container"></div>';
                  contentDiv.appendChild(lofSec);

                  // Create List of Tables Section
                  const lotSec = document.createElement('div');
                  lotSec.id = 'lot-section';
                  lotSec.className = 'front-matter-page front-matter-exclude page-break';
                  lotSec.innerHTML = '<h1>Liste des tableaux</h1><div id="lot-container"></div>';
                  contentDiv.appendChild(lotSec);
                }

                currentSection = document.createElement('div');
                currentSection.className = 'main-content-page main-content-section page-break';
                if (title.includes('INTRODUCTION GÉNÉRALE')) {
                  currentSection.id = 'first-main-section';
                }
                contentDiv.appendChild(currentSection);
              }
            }
            
            if (currentSection) {
              currentSection.appendChild(child);
            } else {
              child.remove(); // Remove stray elements before the first H1
            }
          });
        }

        // 2. Generate unique IDs for all headings (excluding front matter lists)
        const headings = content.querySelectorAll('h1, h2, h3');
        headings.forEach((heading, index) => {
          if (heading.closest('.cover-page') || heading.closest('.front-matter-exclude')) {
            return;
          }
          if (!heading.id) {
            heading.id = 'heading-' + index;
          }
        });

        // 3. Generate Table of Contents
        const tocContainer = content.querySelector('#toc-container');
        if (tocContainer) {
          const tocList = document.createElement('ul');
          tocList.className = 'toc-list';
          
          headings.forEach(heading => {
            if (heading.closest('.cover-page') || heading.closest('.front-matter-exclude')) return;
            
            const level = parseInt(heading.tagName.substring(1));
            if (level > 3) return; // Only H1, H2, H3
            
            const li = document.createElement('li');
            li.className = \`toc-item toc-level-\${level}\`;
            
            const a = document.createElement('a');
            a.href = \`#\${heading.id}\`;
            a.className = 'toc-link';
            
            const titleSpan = document.createElement('span');
            titleSpan.className = 'toc-title';
            titleSpan.textContent = heading.textContent;
            
            const dotsSpan = document.createElement('span');
            dotsSpan.className = 'toc-dots';
            
            a.appendChild(titleSpan);
            a.appendChild(dotsSpan);
            li.appendChild(a);
            tocList.appendChild(li);
          });
          
          tocContainer.appendChild(tocList);
        }

        // 4. Process Figures (replace placeholders like *[CAPTURE D'ÉCRAN - ...]*)
        const paragraphs = content.querySelectorAll('p');
        let figCounter = 1;
        const figuresList = [];

        paragraphs.forEach(p => {
          const text = p.textContent;
          const match = text.match(/\\*?\\[CAPTURE D'ÉCRAN\\s*-\\s*([^\\]]+)\\]\\*?/i) || 
                        text.match(/\\*?\\[CAPTURE D'ÉCRAN DÉTAILLÉE\\]\\*?/i) ||
                        text.match(/\\*?\\[CAPTURES D'ÉCRAN\\s*-\\s*([^\\]]+)\\]\\*?/i);
                        
          if (match) {
            let desc = match[1] ? match[1].trim() : "";
            
            // If it's a generic [CAPTURE D'ÉCRAN DÉTAILLÉE], deduce it from parent heading
            if (!desc || desc.toUpperCase() === "DÉTAILLÉE") {
              let heading = p.previousElementSibling;
              while (heading && !heading.tagName.match(/^H[1-6]$/)) {
                heading = heading.previousElementSibling;
              }
              desc = heading ? heading.textContent.trim() : "Détails de l'interface";
            }
            
            const figId = \`fig-\${figCounter}\`;
            const figure = document.createElement('figure');
            figure.className = 'report-figure';
            figure.id = figId;
            
            // Map the description to the best screenshot filename
            let filename = "";
            const cleanDesc = desc.toLowerCase();
            if (cleanDesc.includes("connexion") || cleanDesc.includes("login")) {
              filename = "login.png";
            } else if (cleanDesc.includes("dashboard") || cleanDesc.includes("principal") || cleanDesc.includes("tableau de bord")) {
              filename = "dashboard.png";
            } else if (cleanDesc.includes("import excel")) {
              filename = "import_excel.png";
            } else if (cleanDesc.includes("promotions")) {
              filename = "promotions.png";
            } else if (cleanDesc.includes("création pv") || cleanDesc.includes("formulaire création pv")) {
              filename = "create_pv.png";
            } else if (cleanDesc.includes("détails d'un procès-verbal") || cleanDesc.includes("détails d'un pv") || cleanDesc.includes("détail")) {
              filename = "pv_detail.png";
            } else if (cleanDesc.includes("historique") && cleanDesc.includes("versions")) {
              filename = "pv_history.png";
            } else if (cleanDesc.includes("recherche avancée")) {
              filename = "search.png";
            } else if (cleanDesc.includes("résultats de recherche")) {
              filename = "search_results.png";
            } else if (cleanDesc.includes("journal d'activités") || cleanDesc.includes("journal d'audit") || cleanDesc.includes("audit") || cleanDesc.includes("activités récentes")) {
              filename = "audit_log.png";
            } else if (cleanDesc.includes("rapport d'audit")) {
              filename = "audit_report.png";
            } else if (cleanDesc.includes("utilisateurs")) {
              filename = "users.png";
            } else if (cleanDesc.includes("création utilisateur")) {
              filename = "create_user.png";
            } else if (cleanDesc.includes("desktop")) {
              filename = "desktop.png";
            } else if (cleanDesc.includes("tablet")) {
              filename = "tablet.png";
            } else if (cleanDesc.includes("mobile")) {
              filename = "mobile.png";
            } else if (cleanDesc.includes("liste des procès-verbaux") || cleanDesc.includes("liste des pv")) {
              filename = "pv_list.png";
            }

            // Fallback map if needed (e.g. if we have create_pv but it doesn't exist, use pv_list.png)
            if (filename === "create_pv.png" && !window.existingScreenshots[filename]) {
              filename = "pv_list.png";
            }
            
            const fileExists = false; // Forced to false to keep all screenshot placeholders empty in the PDF
            
            if (fileExists) {
              const imgUrl = \`file:///\${window.screenshotsDir}/\${filename}\`;
              const imgEl = document.createElement('img');
              imgEl.src = imgUrl;
              imgEl.alt = desc;
              imgEl.style.maxWidth = "100%";
              imgEl.style.maxHeight = "380px";
              imgEl.style.objectFit = "contain";
              imgEl.style.display = "block";
              imgEl.style.margin = "10px auto";
              imgEl.style.border = "1.5px solid #cbd5e1";
              imgEl.style.borderRadius = "6px";
              imgEl.style.boxShadow = "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)";
              figure.appendChild(imgEl);
            } else {
              const placeholderDiv = document.createElement('div');
              placeholderDiv.className = 'figure-placeholder';
              placeholderDiv.innerHTML = \`
                <div class="placeholder-content">
                  <svg class="placeholder-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span class="placeholder-label">Capture d'écran de l'application</span>
                  <span class="placeholder-desc">\${desc} (Fichier attendu : \${filename || 'non mappé'})</span>
                </div>
              \`;
              figure.appendChild(placeholderDiv);
            }
            
            const figcaption = document.createElement('figcaption');
            figcaption.innerHTML = \`<span class="fig-title">Figure \${figCounter} :</span> \${desc}\`;
            figure.appendChild(figcaption);
            
            p.replaceWith(figure);
            
            figuresList.push({ id: figId, title: \`Figure \${figCounter} : \${desc}\` });
            figCounter++;
          }
        });

        // Generate List of Figures
        const lofContainer = content.querySelector('#lof-container');
        if (lofContainer) {
          if (figuresList.length === 0) {
            lofContainer.innerHTML = '<p class="no-items">Aucune figure répertoriée.</p>';
          } else {
            const lofList = document.createElement('ul');
            lofList.className = 'toc-list lof-list';
            figuresList.forEach(fig => {
              const li = document.createElement('li');
              li.className = 'toc-item toc-level-1';
              
              const a = document.createElement('a');
              a.href = \`#\${fig.id}\`;
              a.className = 'toc-link';
              
              const titleSpan = document.createElement('span');
              titleSpan.className = 'toc-title';
              titleSpan.textContent = fig.title;
              
              const dotsSpan = document.createElement('span');
              dotsSpan.className = 'toc-dots';
              
              a.appendChild(titleSpan);
              a.appendChild(dotsSpan);
              li.appendChild(a);
              lofList.appendChild(li);
            });
            lofContainer.appendChild(lofList);
          }
        }

        // 5. Process Tables
        const tables = content.querySelectorAll('table');
        let tableCounter = 1;
        const tablesList = [];
        
        tables.forEach(table => {
          const tableId = \`table-\${tableCounter}\`;
          table.id = tableId;
          table.className = 'report-table';
          
          const wrapper = document.createElement('div');
          wrapper.className = 'table-wrapper';
          table.parentNode.insertBefore(wrapper, table);
          wrapper.appendChild(table);
          
          let title = "Dictionnaire de données - Structure de table";
          const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim());
          
          if (headers.includes('Métrique')) {
            title = "Indicateurs de performance de la plateforme";
          } else if (headers.includes('Rôle')) {
            title = "Matrice des rôles et permissions";
          } else if (headers.includes('Attaque')) {
            title = "Matrice des menaces de sécurité et mitigations";
          } else if (headers.includes('Promotion') || headers.includes('Créneau')) {
            title = "Format d'importation des promotions Excel";
          } else {
            let prev = wrapper.previousElementSibling;
            if (prev && prev.tagName.match(/^H[1-6]$/)) {
              title = prev.textContent;
            } else if (prev && prev.tagName === 'P') {
              title = prev.textContent.substring(0, 60) + '...';
            }
          }
          
          const caption = document.createElement('div');
          caption.className = 'table-caption';
          caption.innerHTML = \`<span class="tbl-title">Tableau \${tableCounter} :</span> \${title}\`;
          wrapper.insertBefore(caption, table);
          
          tablesList.push({ id: tableId, title: \`Tableau \${tableCounter} : \${title}\` });
          tableCounter++;
        });

        // Generate List of Tables
        const lotContainer = content.querySelector('#lot-container');
        if (lotContainer) {
          if (tablesList.length === 0) {
            lotContainer.innerHTML = '<p class="no-items">Aucun tableau répertorié.</p>';
          } else {
            const lotList = document.createElement('ul');
            lotList.className = 'toc-list lot-list';
            tablesList.forEach(tbl => {
              const li = document.createElement('li');
              li.className = 'toc-item toc-level-1';
              
              const a = document.createElement('a');
              a.href = \`#\${tbl.id}\`;
              a.className = 'toc-link';
              
              const titleSpan = document.createElement('span');
              titleSpan.className = 'toc-title';
              titleSpan.textContent = tbl.title;
              
              const dotsSpan = document.createElement('span');
              dotsSpan.className = 'toc-dots';
              
              a.appendChild(titleSpan);
              a.appendChild(dotsSpan);
              li.appendChild(a);
              lotList.appendChild(li);
            });
            lotContainer.appendChild(lotList);
          }
        }
      }

      afterRendered(pages) {
        function toRoman(num) {
          const romanMap = [
            { value: 10, symbol: 'x' },
            { value: 9, symbol: 'ix' },
            { value: 5, symbol: 'v' },
            { value: 4, symbol: 'iv' },
            { value: 1, symbol: 'i' }
          ];
          let result = '';
          let n = num;
          for (const { value, symbol } of romanMap) {
            while (n >= value) {
              result += symbol;
              n -= value;
            }
          }
          return result;
        }

        // Compute logical page numbers and update margin boxes
        let arabicCount = 1;
        let romanCount = 1;

        pages.forEach((page) => {
          const element = page.element;
          const isCover = element.querySelector('.cover-page');
          const isFrontMatter = element.querySelector('.front-matter-page');
          const isMainContent = element.querySelector('.main-content-page');

          let logicalPage = "";
          if (isCover) {
            logicalPage = "";
          } else if (isFrontMatter) {
            logicalPage = toRoman(romanCount);
            romanCount++;
          } else if (isMainContent) {
            logicalPage = arabicCount.toString();
            arabicCount++;
          }

          element.setAttribute('data-logical-page', logicalPage);

          // Update bottom-right page number and other margin contents
          const setMarginContent = (marginClass, text) => {
            const marginBox = element.querySelector(marginClass + ' .pagedjs_margin-content');
            if (marginBox) {
              marginBox.textContent = text;
            } else {
              const container = element.querySelector(marginClass);
              if (container) {
                container.innerHTML = \`<div class="pagedjs_margin-content"><span>\${text}</span></div>\`;
              }
            }
          };

          if (isCover) {
            setMarginContent('.pagedjs_margin-bottom-right', '');
            setMarginContent('.pagedjs_margin-bottom-left', '');
            setMarginContent('.pagedjs_margin-top-center', '');
          } else if (isFrontMatter) {
            setMarginContent('.pagedjs_margin-bottom-right', logicalPage);
            setMarginContent('.pagedjs_margin-bottom-left', '');
            setMarginContent('.pagedjs_margin-top-center', '');
          } else if (isMainContent) {
            setMarginContent('.pagedjs_margin-bottom-right', logicalPage);
            setMarginContent('.pagedjs_margin-bottom-left', 'Développement Digital – Option Fullstack');
            setMarginContent('.pagedjs_margin-top-center', 'Système d’Archivage Institutionnel des PV – OFPPT');
          }
        });

        // Now update all Table of Contents and list links
        const tocLinks = document.querySelectorAll('.toc-link');
        tocLinks.forEach(link => {
          const href = link.getAttribute('href');
          if (href && href.startsWith('#')) {
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
              const targetPage = targetElement.closest('.pagedjs_page');
              if (targetPage) {
                const logicalPageNum = targetPage.getAttribute('data-logical-page');
                
                // Find or create page number span
                let pageSpan = link.querySelector('.toc-page-num');
                if (!pageSpan) {
                  pageSpan = document.createElement('span');
                  pageSpan.className = 'toc-page-num';
                  pageSpan.style.fontVariantNumeric = 'tabular-nums';
                  pageSpan.style.fontWeight = 'bold';
                  pageSpan.style.paddingLeft = '5px';
                  pageSpan.style.background = 'white';
                  pageSpan.style.zIndex = '1';
                  link.appendChild(pageSpan);
                }
                pageSpan.textContent = logicalPageNum || "";
              }
            }
          }
        });

        document.body.classList.add('rendering-complete');
        console.log("Paged.js finished rendering " + pages.length + " pages.");
      }
    }
    Paged.registerHandlers(ReportHandler);

    document.addEventListener("DOMContentLoaded", async function() {
      // 1. Prepare mermaid divs
      const mermaidCodes = document.querySelectorAll('pre code.language-mermaid');
      mermaidCodes.forEach((codeBlock) => {
        const div = document.createElement('div');
        div.className = 'mermaid';
        div.textContent = codeBlock.textContent;
        div.style.textAlign = 'center';
        div.style.margin = '25px 0';
        codeBlock.parentNode.replaceWith(div);
      });

      // 2. Configure and run Mermaid
      mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        themeVariables: {
          primaryColor: '#f8fafc',
          primaryBorderColor: '#0d9488',
          primaryTextColor: '#0f172a',
          lineColor: '#64748b',
          fontFamily: 'Inter, sans-serif'
        }
      });
      
      try {
        await mermaid.run();
      } catch (err) {
        console.error("Mermaid error:", err);
      }

      // 3. Run Paged.js after SVGs are generated
      window.PagedPolyfill.preview();
    });
  </script>

</body>
</html>
`;

// 7. Write HTML to temporary file
console.log('Création du fichier HTML temporaire...');
fs.writeFileSync(tempHtmlPath, htmlTemplate, 'utf8');

// 8. Print using Puppeteer with Microsoft Edge Headless
async function generatePDF() {
  console.log('Lancement du navigateur headless Microsoft Edge...');
  
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Redirect console logs from page to terminal for debugging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    
    const fileUrl = 'file:///' + tempHtmlPath.replace(/\\/g, '/');
    console.log(`Navigation vers : ${fileUrl}`);
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });
    
    console.log('Attente de la fin de la mise en page de Paged.js...');
    await page.waitForSelector('.rendering-complete', { timeout: 120000 });
    
    console.log('Génération et exportation du PDF...');
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      }
    });
    
    console.log(`PDF généré avec succès et enregistré à : ${pdfPath}`);
  } catch (error) {
    console.error('Erreur lors de la génération du PDF :', error);
  } finally {
    await browser.close();
    // Clean up temporary HTML file
    try {
      fs.unlinkSync(tempHtmlPath);
      console.log('Nettoyage : Fichier HTML temporaire supprimé.');
    } catch (e) {
      console.warn('Impossible de supprimer le fichier temporaire :', e.message);
    }
  }
}

generatePDF();
