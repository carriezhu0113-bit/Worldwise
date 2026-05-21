// ==================== UTILS ====================
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

let activeRecognition = null;
let activeVoiceButtonId = null;

function getSpeechRecognitionCtor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function setVoiceButtonState(buttonId, isRecording, label = null) {
  if (!buttonId) return;
  const button = document.getElementById(buttonId);
  if (!button) return;
  button.classList.toggle('recording', isRecording);
  button.textContent = label || (isRecording ? '■ 停止录音' : '🎤 语音输入');
}

function stopActiveVoiceInput() {
  if (activeRecognition) {
    activeRecognition.stop();
    activeRecognition = null;
  }
  if (activeVoiceButtonId) {
    setVoiceButtonState(activeVoiceButtonId, false);
    activeVoiceButtonId = null;
  }
}

function normalizeSpeechText(text, lang) {
  let value = (text || '').trim();
  if (lang && lang.startsWith('en')) {
    value = value.replace(/[.,!?]+$/g, '');
  }
  return value;
}

function startVoiceInput(inputId, lang = 'zh-CN', buttonId = null) {
  const RecognitionCtor = getSpeechRecognitionCtor();
  const input = document.getElementById(inputId);
  if (!input) return;

  if (!RecognitionCtor) {
    alert('当前浏览器暂不支持语音输入，建议使用 Chrome 或 Safari。');
    return;
  }

  if (activeRecognition && activeVoiceButtonId === buttonId) {
    stopActiveVoiceInput();
    return;
  }

  stopActiveVoiceInput();

  const recognition = new RecognitionCtor();
  activeRecognition = recognition;
  activeVoiceButtonId = buttonId;
  recognition.lang = lang;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  const originalValue = input.value;
  setVoiceButtonState(buttonId, true);

  recognition.onresult = event => {
    const transcript = Array.from(event.results)
      .map(result => result[0].transcript)
      .join('');
    input.value = normalizeSpeechText(transcript, lang) || originalValue;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  };

  recognition.onerror = () => {
    stopActiveVoiceInput();
  };

  recognition.onend = () => {
    stopActiveVoiceInput();
  };

  recognition.start();
}


// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', async () => {
  await loadVocabData();
  document.getElementById('studentName').addEventListener('keydown', e => {
    if (e.key === 'Enter') studentLogin();
  });
  document.getElementById('teacherPassword').addEventListener('keydown', e => {
    if (e.key === 'Enter') teacherLogin();
  });
  // 预加载语音列表（部分浏览器需要）
  if ('speechSynthesis' in window) {
    speechSynthesis.getVoices();
    speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
  }
  if (!getSpeechRecognitionCtor()) {
    const notes = document.querySelectorAll('.voice-note');
    notes.forEach(note => {
      note.textContent = '当前浏览器不支持语音输入，建议使用 Chrome 或 Safari。';
    });
    const buttons = document.querySelectorAll('.voice-btn');
    buttons.forEach(button => {
      button.disabled = true;
      button.style.opacity = '0.6';
      button.style.cursor = 'not-allowed';
    });
  }
});
