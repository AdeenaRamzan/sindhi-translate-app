
const API_BASE = '';

const sindhiInput = document.getElementById('sindhi-input');


const fileInput = document.getElementById('file-input');
const translateBtn = document.getElementById('translate-btn');

const sindhiOutput = document.getElementById('sindhi-output');
const urduOutput = document.getElementById('urdu-output');
const englishOutput = document.getElementById('english-output');

const exportButtons = document.querySelectorAll('.export-buttons button');

const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history-btn');

loadHistoryFromLocalStorage();

fileInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const allowed = ['.txt', '.docx'];
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  if (!allowed.includes(ext)) {
    alert('Please select a .txt or .docx file.');
    fileInput.value = '';
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${API_BASE}/api/upload`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    console.log('Upload response:', data);

    if (response.ok) {
      if (data.text && data.text.trim()) {
        sindhiInput.value = data.text;
      } else {
        alert('File uploaded but no text found inside.');
      }
    } else {
      alert(data.error || 'File upload failed');
    }
  } catch (err) {
    console.error(err);
    alert('Error uploading file');
  }
});

translateBtn.addEventListener('click', async () => {
  const text = sindhiInput.value.trim();
  if (!text) {
    alert('Please enter or upload some Sindhi text first.');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, useGoogle: false })
    });

    const data = await response.json();

    if (response.ok) {
      sindhiOutput.textContent = data.sindhi || '';
      urduOutput.textContent = data.urdu || '';
      englishOutput.textContent = data.english || '';

      saveHistoryEntry(data);
    } else {
      alert(data.error || 'Translation failed');
    }
  } catch (err) {
    console.error(err);
    alert('Error calling translation API');
  }
});

exportButtons.forEach((btn) => {
  btn.addEventListener('click', async () => {
    const type = btn.getAttribute('data-export');

    const sindhi = sindhiOutput.textContent.trim();
    const urdu = urduOutput.textContent.trim();
    const english = englishOutput.textContent.trim();

    if (!sindhi && !urdu && !english) {
      alert('Nothing to export. Please translate some text first.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sindhi, urdu, english, type })
      });

      const data = await response.json();

      if (response.ok) {
        const a = document.createElement('a');
        a.href = data.url;
        a.download = '';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        alert(data.error || 'Export failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error calling export API');
    }
  });
});

function saveHistoryEntry(entry) {
  const history = JSON.parse(localStorage.getItem('translationHistory') || '[]');

  history.unshift({
    sindhi: entry.sindhi || '',
    urdu: entry.urdu || '',
    english: entry.english || '',
    timestamp: new Date().toISOString()
  });

  const trimmed = history.slice(0, 20);
  localStorage.setItem('translationHistory', JSON.stringify(trimmed));
  renderHistory(trimmed);
}

function loadHistoryFromLocalStorage() {
  const history = JSON.parse(localStorage.getItem('translationHistory') || '[]');
  renderHistory(history);
}

function renderHistory(history) {
  historyList.innerHTML = '';
  history.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = `${formatDate(item.timestamp)} - ${shorten(item.sindhi)}`;
    li.title = `Sindhi: ${item.sindhi}\nUrdu: ${item.urdu}\nEnglish: ${item.english}`;
    historyList.appendChild(li);
  });
}

function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleString();
}

function shorten(text, maxLen = 50) {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '...';
}

clearHistoryBtn.addEventListener('click', () => {
  if (confirm('Clear translation history?')) {
    localStorage.removeItem('translationHistory');
    historyList.innerHTML = '';
  }
});
