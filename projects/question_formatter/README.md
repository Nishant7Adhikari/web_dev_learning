Here is a comprehensive, professional-grade documentation manual for **ExamDB Ultimate**. This document is designed to serve as a User Guide, Technical Reference, and Developer Handbook.

***

# ExamDB Ultimate — Official Documentation & User Guide

**Version:** 2.0 (Stable)  
**Release Date:** January 31, 2026  
**License:** MIT / Academic Open Source  
**Maintainer:** ExamDB Development Team  

---

## Table of Contents

1.  [Executive Summary](#1-executive-summary)
2.  [Getting Started](#2-getting-started)
    *   [System Requirements](#system-requirements)
    *   [Installation & Deployment](#installation--deployment)
3.  [User Interface Overview](#3-user-interface-overview)
    *   [The Workspace](#the-workspace)
    *   [The Configuration Panel](#the-configuration-panel)
    *   [Navigation & Controls](#navigation--controls)
4.  [Core Workflows](#4-core-workflows)
    *   [Creating an Exam Paper](#creating-an-exam-paper)
    *   [Structuring Sections](#structuring-sections)
    *   [Rich Text Editing](#rich-text-editing)
5.  [The Math Studio (Advanced Feature)](#5-the-math-studio-advanced-feature)
    *   [Overview](#overview)
    *   [Live Preview Engine](#live-preview-engine)
    *   [Symbol Palettes](#symbol-palettes)
    *   [Matrix Generation](#matrix-generation)
    *   [Digital Logic & Boolean Algebra](#digital-logic--boolean-algebra)
6.  [LaTeX Reference Guide](#6-latex-reference-guide)
    *   [General Syntax](#general-syntax)
    *   [Calculus & Analysis](#calculus--analysis)
    *   [Linear Algebra](#linear-algebra)
    *   [Set Theory & Logic](#set-theory--logic)
7.  [Data Management](#7-data-management)
    *   [JSON Schema Specification](#json-schema-specification)
    *   [Import/Export Logic](#importexport-logic)
    *   [Local Storage Persistence](#local-storage-persistence)
8.  [Technical Architecture](#8-technical-architecture)
    *   [DOM Structure](#dom-structure)
    *   [State Management](#state-management)
    *   [External Libraries](#external-libraries)
    *   [CSS & Print Optimization](#css--print-optimization)
9.  [Developer Guide (Customization)](#9-developer-guide-customization)
    *   [Adding New Math Symbols](#adding-new-math-symbols)
    *   [Styling & Branding](#styling--branding)
10. [Troubleshooting & FAQ](#10-troubleshooting--faq)

---

## 1. Executive Summary

**ExamDB Ultimate** is a single-file, client-side academic typesetting environment designed specifically for universities and educational institutions. Unlike standard word processors (Microsoft Word, Google Docs) which struggle with complex mathematical notation, or raw LaTeX editors (Overleaf) which have a steep learning curve, ExamDB bridges the gap.

It provides a **WYSIWYG (What You See Is What You Get)** interface for structure and text, combined with a powerful **Math Studio** for rendering complex scientific notation using the KaTeX engine.

### Key Capabilities
*   **Zero-Install Architecture:** Runs entirely in the browser via a single HTML file.
*   **Academic Formatting:** Enforces standard university paper layouts (Margins, Headers, Marks).
*   **Math Studio:** A dedicated IDE for writing Logic Gates, Matrices, and Calculus formulas with live preview.
*   **Print-Perfect PDF:** CSS print media queries ensure the output is indistinguishable from professionally typeset LaTeX documents.
*   **Data Portability:** Full JSON import/export capabilities for archiving and sharing.

---

## 2. Getting Started

### System Requirements
ExamDB Ultimate is built on modern web standards (ES6+, HTML5).

| Component | Requirement | Recommended |
| :--- | :--- | :--- |
| **Operating System** | Windows, macOS, Linux, Android, iOS | Desktop OS for best editing experience |
| **Browser** | Chrome 90+, Firefox 88+, Safari 14+, Edge | Chrome or Edge (Chromium based) |
| **Internet** | Required for CDN loading (First Run) | Offline capable if assets are cached locally |
| **Display** | 1024x768 minimum resolution | 1920x1080 (Full HD) |

### Installation & Deployment

#### Method A: The "Local File" (Easiest)
1.  Download the `index.html` file containing the source code.
2.  Save it to a folder on your computer (e.g., `Documents/ExamDB`).
3.  Double-click `index.html` to open it in your default web browser.
4.  **Note:** No server (Apache/Nginx/Node.js) is required.

#### Method B: Static Web Host
For institutions wishing to host it for all faculty:
1.  Upload `index.html` to any static file host (GitHub Pages, Netlify, Vercel, or internal University FTP).
2.  Share the URL with staff.
3.  Since the app is client-side, it will not consume server CPU resources.

#### Method C: Offline Deployment
To use ExamDB without an internet connection:
1.  Download the `.js` and `.css` files referenced in the `<head>` tag (Tailwind, Quill, KaTeX, Highlight.js, FontAwesome).
2.  Change the CDN links in the HTML to point to your local relative paths (e.g., `src="./js/quill.min.js"`).

---

## 3. User Interface Overview

The interface is divided into three logical zones: The **Header/Toolbar**, the **Configuration Sidebar**, and the **Document Canvas**.

### The Workspace
The central area mimics an A4 sheet of paper.
*   **Paper Dimensions:** 210mm x 297mm (Standard A4).
*   **Visual Feedback:** The sheet casts a shadow to distinguish it from the gray background.
*   **Margins:** Pre-calculated margins ensure content is not cut off during printing.

### The Configuration Panel
Located on the left (toggled via the "Settings" button), this panel controls global metadata.

| Field | Description | Example |
| :--- | :--- | :--- |
| **Institution** | The main university name. | *Harvard University* |
| **Faculty/Inst** | Specific department or faculty. | *Faculty of Sciences* |
| **Course** | Name of the subject. | *Discrete Structures* |
| **Code** | Course identifier. | *CSC-202* |
| **Year/Time** | Academic Year and Exam Duration. | *2026 / 3 Hours* |
| **Marks** | Total Marks / Pass Marks. | *100 / 40* |

**Behavior:** Changing any value here instantly updates the document header via DOM manipulation.

### Navigation & Controls
*   **Top Bar:** Contains Global Actions (Settings, Export, Print).
*   **Floating Action Button (FAB):** A blue `+` button in the bottom right for quickly adding new Question Sections.
*   **Section Controls:** Hovering over a section reveals the Trash icon (Delete Section).
*   **Question Controls:** Hovering over a question reveals Edit/Delete buttons.

---

## 4. Core Workflows

### Creating an Exam Paper
1.  **Initialize:** Open the app. The default state is an empty canvas.
2.  **Configure:** Open Settings. Fill in the University Name, Subject, Code, and Marks.
3.  **Add Structure:** Click the FAB (`+`) to add your first Section (e.g., "Group A").
4.  **Add Questions:** Click "Add Question" inside the section.
5.  **Refine:** Edit the questions using the Rich Text Editor.
6.  **Finalize:** Click "Print" to save as PDF.

### Structuring Sections
Exam papers are hierarchical. ExamDB uses a two-level hierarchy:
1.  **Section (Group):** Represents a category of questions (e.g., "Objective Type", "Long Answer").
    *   *Editable Title:* Click the title (e.g., "Group A") to rename it inline.
    *   *Editable Instruction:* Click the subtitle to change instructions (e.g., "Attempt any 5").
2.  **Questions:** Individual items within a section.

### Rich Text Editing
When you edit a question, the **Modal Editor** appears. This uses the Quill.js engine.

**Toolbar capabilities:**
*   **Text Styling:** Bold, Italic, Underline, Strikethrough.
*   **Scripting:** Subscript ($x_i$) and Superscript ($x^2$).
*   **Lists:** Ordered (1, 2, 3) and Bullet lists.
*   **Code Blocks:** Syntax highlighted blocks for CS exams (Python, C++, Java).
*   **Formula:** Opens the Math Studio (See Section 5).

---

## 5. The Math Studio (Advanced Feature)

The Math Studio is the core differentiator of ExamDB Ultimate. It allows the insertion of professional LaTeX without requiring the user to be a LaTeX expert.

### Overview
Access the Math Studio by clicking the **$\Sigma$ (Formula)** button in the editor toolbar. A modal window will open with a dark input area and a live white preview box.

### Live Preview Engine
As you type in the text area, the **KaTeX** engine compiles the string in real-time (~50ms latency).
*   **Error Handling:** If the syntax is invalid, the preview text turns red and displays the error message, aiding debugging.
*   **Rendering:** The output in the preview box is exactly 1:1 what will appear on the printed paper.

### Symbol Palettes
The studio is organized into tabs to prevent symbol overload:

#### 1. General Tab
Contains standard arithmetic and algebra symbols.
*   Fractions: `\frac{a}{b}`
*   Roots: `\sqrt{x}`
*   Inequalities: `\le`, `\ge`, `\neq`

#### 2. Digital Logic Tab (Specialized)
Designed for Computer Engineering and Electronics exams.
*   **Overline (NOT Gate):** `\overline{A}`. *Smart Feature:* If you select text `A+B` and click this, it wraps it: `\overline{A+B}`.
*   **XOR:** `\oplus` ($\oplus$)
*   **Implication:** `\rightarrow` ($\rightarrow$)

#### 3. Calculus Tab
For advanced mathematics.
*   **Integrals:** `\int_{a}^{b}`
*   **Summation:** `\sum_{i=0}^{n}`
*   **Limits:** `\lim_{x \to \infty}`

### Matrix Generation
Writing Matrix LaTeX manually is tedious (`\begin{pmatrix} a & b \\ c & d \end{pmatrix}`).
The **Matrix Tab** provides a GUI generator:
1.  Select Rows (e.g., 3).
2.  Select Cols (e.g., 3).
3.  Select Type:
    *   `pmatrix`: Parentheses ( Standard Matrix )
    *   `bmatrix`: Brackets [ Array ]
    *   `vmatrix`: Pipes | Determinant |
4.  Click **Generate**.
5.  The code is inserted into the editor, populated with placeholders ($x_{00}, x_{01}...$).

---

## 6. LaTeX Reference Guide

While the buttons help, power users can type directly. Below is a reference of supported commands in ExamDB.

### General Syntax
*   **Inline Math:** In the main text flow.
*   **Display Math:** On its own line (centered).

### Calculus & Analysis

| Description | LaTeX Code | Output | Notes |
| :--- | :--- | :--- | :--- |
| **Fraction** | `\frac{num}{den}` | $\frac{num}{den}$ | Nests infinitely. |
| **Power** | `x^{2y}` | $x^{2y}$ | Use `{}` for multi-char exponents. |
| **Subscript** | `x_{i,j}` | $x_{i,j}$ | Use `{}` for multi-char indices. |
| **Square Root** | `\sqrt{x}` | $\sqrt{x}$ | Auto-expands height. |
| **N-th Root** | `\sqrt[3]{x}` | $\sqrt[3]{x}$ | Cube root, etc. |
| **Definite Integral** | `\int_{0}^{\pi} \sin x dx` | $\int_{0}^{\pi} \sin x dx$ | Limits align right. |
| **Summation** | `\sum_{n=1}^{\infty} \frac{1}{n}` | $\sum_{n=1}^{\infty} \frac{1}{n}$ | Limits above/below in display mode. |
| **Limit** | `\lim_{x \to 0}` | $\lim_{x \to 0}$ | |
| **Partial Derivative** | `\frac{\partial f}{\partial x}` | $\frac{\partial f}{\partial x}$ | |

### Linear Algebra

| Description | LaTeX Code | Output |
| :--- | :--- | :--- |
| **Vector** | `\vec{v}` | $\vec{v}$ |
| **Dot Product** | `\vec{a} \cdot \vec{b}` | $\vec{a} \cdot \vec{b}$ |
| **Cross Product** | `\vec{a} \times \vec{b}` | $\vec{a} \times \vec{b}$ |
| **Norm** | `\| \vec{x} \|` | $\| \vec{x} \|$ |
| **Matrix (2x2)** | `\begin{pmatrix} 1 & 0 \\ 0 & 1 \end{pmatrix}` | Identity Matrix |

### Set Theory & Logic

| Description | LaTeX Code | Output |
| :--- | :--- | :--- |
| **Union** | `A \cup B` | $A \cup B$ |
| **Intersection** | `A \cap B` | $A \cap B$ |
| **Subset** | `A \subset B` | $A \subset B$ |
| **Element Of** | `x \in A` | $x \in A$ |
| **Not Element** | `x \notin A` | $x \notin A$ |
| **Empty Set** | `\emptyset` | $\emptyset$ |
| **For All** | `\forall x` | $\forall x$ |
| **Exists** | `\exists y` | $\exists y$ |
| **Therefore** | `\therefore` | $\therefore$ |
| **Boolean NOT** | `\overline{A + B}` | $\overline{A + B}$ |

### Greek Letters (Common)
| Alpha | Beta | Gamma | Delta | Theta | Lambda | Pi | Sigma | Omega |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `\alpha` | `\beta` | `\gamma` | `\delta` | `\theta` | `\lambda` | `\pi` | `\sigma` | `\omega` |
| $\alpha$ | $\beta$ | $\gamma$ | $\delta$ | $\theta$ | $\lambda$ | $\pi$ | $\sigma$ | $\omega$ |
| **Caps** | | `\Gamma` | `\Delta` | `\Theta` | `\Lambda` | `\Pi` | `\Sigma` | `\Omega` |

---

## 7. Data Management

ExamDB allows you to save your work and resume later, or share templates with colleagues.

### JSON Schema Specification
The application exports a single `.json` file. This is the structure developers need to know if they want to programmatically generate exams.

```json
{
  "meta": {
    "conf-uni": "Harvard University",
    "conf-inst": "Department of Physics",
    "conf-sub": "Quantum Mechanics",
    "conf-code": "PHY-401",
    "conf-year": "2026",
    "conf-time": "3 Hrs",
    "conf-fm": "100"
  },
  "data": [
    {
      "id": "sec-1706692345123",
      "title": "Group A",
      "instruction": "Answer all questions.",
      "questions": [
        {
          "html": "<p>Define Heisenberg's Uncertainty Principle.</p>",
          "marks": "5"
        },
        {
          "html": "<p>Calculate the eigenvalue of... <span class=\"ql-formula\" data-value=\"\\hat{H}\\psi\">...</span></p>",
          "marks": "10"
        }
      ]
    }
  ]
}
```

### Import/Export Logic
*   **Export:** Uses `URL.createObjectURL` to generate a client-side Blob. Triggers a browser download of `ExamDB_[Code].json`.
*   **Import:** Uses `FileReader` API. It validates:
    1.  Parse JSON.
    2.  Check for `meta` keys.
    3.  Check for `data` array.
    *If validation fails, the user receives an alert, and the current state is NOT overwritten.*

### Local Storage Persistence
(Optional implementation note)
The app currently focuses on file-based Import/Export for data sanctity. However, developers can enable auto-save by uncommenting the `localStorage` lines in the `saveConfig` method.

---

## 8. Technical Architecture

### DOM Structure
The application is a Single Page Application (SPA) but does **not** use React, Vue, or Angular. It uses Vanilla JavaScript with direct DOM manipulation.
*   **Reasoning:** Maximum performance, zero build steps, zero dependency hell.
*   **Pattern:** State-Driven Rendering.
    *   State is held in `app.data`.
    *   Changes to state trigger `app.renderSections()`.
    *   This ensures the UI is always in sync with the data.

### State Management
The `app` object serves as the singleton controller.

```javascript
const app = {
    data: { ... },   // The "Model"
    state: { ... },  // Transient UI state (active modal, current selection)
    init: () => { ... },
    render: () => { ... },
    // Actions
    addSection: () => { ... },
    saveQuestion: () => { ... }
}
```

### External Libraries
We utilize CDNs for libraries that are too complex to write from scratch.
1.  **Tailwind CSS:** For utility-first styling. Used for layout, spacing, typography, and responsive design.
2.  **Quill.js:** A powerful Rich Text Editor. We use it because it handles HTML generation cleanly and supports "Embeds" (which we use for formulas).
3.  **KaTeX:** The fastest math rendering engine on the web. It renders to HTML/CSS (not Canvas), ensuring text is selectable and prints perfectly at high DPI.
4.  **Highlight.js:** Automatically detects code languages and colorizes them.
5.  **FontAwesome:** For UI icons (Trash, Pen, Print, etc.).

### CSS & Print Optimization
Printing is the primary output of this application.
*   **`@media print`:** This CSS block is critical.
    *   It hides the Sidebar, Floating Buttons, and Modals (`display: none !important`).
    *   It resets the background to white.
    *   It removes box-shadows from the paper.
    *   It sets margins to match the printer's printable area.
    *   **Page Breaks:** The class `question-item` has `page-break-inside: avoid`. This prevents a question from being sliced in half across two pages.

---

## 9. Developer Guide (Customization)

### Adding New Math Symbols
To add a new symbol to the Math Studio, you do not need to edit HTML. You modify the `app.symbols` object in the JavaScript.

**Steps:**
1.  Locate the `symbols` object in the `<script>` tag.
2.  Choose the category (e.g., `calculus`).
3.  Add an object to the array:

```javascript
{ 
    tex: '\\mycommand', 
    label: 'My Symbol', 
    template: '\\mycommand{}' // Optional: controls cursor placement
}
```

*   `tex`: The LaTeX code used for the *preview* icon.
*   `label`: Tooltip text.
*   `template`: What is actually inserted into the text box. If it contains `{}`, the cursor will be placed inside the brackets automatically.

### Styling & Branding
*   **Colors:** Search for `bg-blue-600` or `text-blue-900` in the HTML to change the primary brand color.
*   **Fonts:** The paper uses `Tinos` (a Times New Roman alternative). To change this, modify the `.paper-font` CSS class and import a new font from Google Fonts in the `<head>`.
*   **Logo:** The logo is currently a FontAwesome icon (`fa-square-root-variable`). Replace the `<i>` tag in the `<header>` with an `<img>` tag to use a University crest.

---

## 10. Troubleshooting & FAQ

### Common Issues

**Q: The Math formulas are not rendering in the PDF.**
*   **A:** Ensure you are using "Print to PDF" in Chrome or Edge. Ensure "Background Graphics" is checked in the print dialog (though KaTeX usually renders without it). Wait for the live preview to finish rendering before hitting print.

**Q: I cannot edit the text inside the Math formula after inserting it.**
*   **A:** In the main document, formulas are treated as "objects". You cannot type inside them directly. **Double-click** the formula to open it back up in the Math Studio for editing.

**Q: My code blocks look plain.**
*   **A:** Ensure you have an internet connection to load the `Highlight.js` CSS theme. If you are offline, the code will still be monospaced but won't have colors.

**Q: How do I create a new line in the Editor?**
*   **A:** Press `Enter` for a new paragraph. Press `Shift+Enter` for a soft line break.

**Q: The "Print" button cuts off the header.**
*   **A:** In your printer settings, set "Margins" to "Default" or "None". The application handles the whitespace internally. If you add browser margins on top of app margins, content may shift.

**Q: Can I use this on Mobile?**
*   **A:** Yes. The UI is responsive. The sidebar becomes a slide-out drawer on small screens. However, typing complex LaTeX on a phone keyboard is not recommended for long sessions.

### Error Messages

*   **"Invalid JSON file":** You tried to import a file that wasn't created by ExamDB, or the file is corrupted.
*   **"KaTeX Parse Error":** You typed invalid LaTeX in the Math Studio (e.g., `\frac{a}` missing the second bracket). Check the syntax guide.

---

## License
**ExamDB Ultimate** is released under the **MIT License**.
*   You are free to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the software.
*   You are free to deploy this at your university without paying fees.

*Designed with academic integrity in mind.*