# Sindhi Translation Web App

A web application where users enter Sindhi text (or upload a `.txt` / `.docx` file) and get instant translations in **Urdu** and **English**, with options to export results as **PDF**, **Excel**, or **Text**.

---

## Features

- Textarea to type or paste Sindhi text.
- Optional file upload for Sindhi content (`.txt`, `.docx`).
- Automatic translation to:
  - Sindhi (original)
  - Urdu
  - English
- Export translations as:
  - PDF
  - Excel (`.xlsx`)
  - Plain text (`.txt`)
- Translation history stored locally in the browser.
- Responsive, dark-themed UI that works on desktop and mobile.

---

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript  
- **Backend:** Node.js, Express  
- **Translation:** Google Cloud Translation API  
- **Exports:**  
  - `pdfkit` for PDF generation  
  - `exceljs` for Excel files  
- **Other Libraries:** `multer`, `mammoth`, `dotenv`, `axios`

---

## Project Structure

- `index.html` – Main page layout (input, results, history, export buttons).
- `styles.css` – Styling and responsive layout.
- `app.js` – Frontend logic (calling backend APIs, handling uploads, exports, history).
- `server.js` – Express server, translation routes, upload handling, export generation.
- `uploads/` – Temporary uploaded files (ignored in git).
- `exports/` – Generated export files (PDF / Excel / TXT).
- `.env` – Environment variables (not committed to git).

---

## Setup
### 1. Clone and install
git clone https://github.com/AdeenaRamzan/sindhi-translate-app.git
cd sindhi-translate-app
npm install

---


### 2. Configure environment variables
Create a file named `.env` in the project root:


### 3. Fonts for PDFs (optional but recommended)

- Create a `fonts/` folder.  
- Download `Amiri-Regular.ttf` (or any Urdu/Sindhi‑supporting font) and place it inside `fonts/`.

---

## Run
node server.js

Open in browser:
http://localhost:3000


---

## How to Use

1. Enter or paste Sindhi text in the input box **or** upload a `.txt` / `.docx` file.  
2. Click **“Translate & Show”** to see Sindhi, Urdu, and English panels filled.  
3. Use export buttons to download the results as **PDF**, **Excel**, or **Text**.  
4. View previous translations in the **History** section; click **“Clear History”** to remove them from local storage.

---

## Project Structure

- `index.html` – UI layout  
- `styles.css` – Styling and layout  
- `app.js` – Frontend logic (API calls, uploads, exports, history)  
- `server.js` – Express server, translation, upload, and export routes  
- `uploads/` – Temporary uploaded files  
- `exports/` – Generated export files  
- `.env` – Environment configuration (not committed)

---

## Future Improvements

- Sindhi speech‑to‑text input  
- Offline/PWA support  
- User authentication and saved profiles

---

## Live Demo
https://sindhi-translate-app-timj-git-main-adeenaramzans-projects.vercel.app/
