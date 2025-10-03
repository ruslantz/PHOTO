// База данных детей
const children = [
  { id: "AlievaN77", name: "Алиева Николь" },
  { id: "ZhuravlevaE96", name: "Журавлева Ева" },
  { id: "IvanushkinM09", name: "Иванушкин Марк" },
  { id: "KaisinaK55", name: "Кайсина Кира" },
  { id: "KapitonovM17", name: "Капитонов Михаил" },
  { id: "OstapchukA15", name: "Остапчук Арсений" },
  { id: "SalyakinA30", name: "Салякин Алексей" },
  { id: "ShilinM81", name: "Шилин Максим" },
  { id: "AnaevB73", name: "Анаев Борис" },
  { id: "BaranovD88", name: "Баранов Даниил" },
  { id: "DjahayaS42", name: "Джахая Сандро" },
  { id: "ZhuravlevaA51", name: "Журавлева Аврора" },
  { id: "KazaryanA12", name: "Казарян Артемий" },
  { id: "KuznetsovA68", name: "Кузнецов Арсений" },
  { id: "PantileykoA24", name: "Пантилейко Артем" },
  { id: "RutskiyY33", name: "Руцкий Ян" },
  { id: "StepanenkoM65", name: "Степаненко Мия" },
  { id: "ChzhouS77", name: "Чжоу Шуянь" },
  { id: "SavinovaE32", name: "Савинова Елизавета" },
  { id: "ZicinL25", name: "Цыцин Лука" },
  { id: "SavinovI64", name: "Савинов Илья" }
];

let currentPhotos = [];
let currentIndex = 0;
let selectedChild = '';
let currentPreviewUrl = null;
let isProcessing = false; // Флаг для защиты от множественных нажатий

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    showStatus('Выберите фото для начала работы', 'info');
});

function setupEventListeners() {
    // Выбор ребенка
    document.querySelectorAll('.child-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (isProcessing) return; // Защита от множественных нажатий
            
            selectedChild = this.getAttribute('data-id');
            document.querySelectorAll('.child-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Автоматически сохраняем при выборе ребенка
            if (currentPhotos.length > 0) {
                savePhoto();
            }
        });
    });

    // Загрузка файлов
    const fileInput = document.getElementById('photoInput');
    fileInput.addEventListener('change', handleFileSelect);
}

function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    currentPhotos = files;
    currentIndex = 0;
    showTaggerSection();
    showCurrentPhoto();
}

function showTaggerSection() {
    document.getElementById('taggerSection').style.display = 'block';
    document.querySelector('.upload-section').style.display = 'none';
    updateProgress();
}

async function showCurrentPhoto() {
    if (isProcessing) return; // Защита от повторного вызова
    
    // Очищаем предыдущее превью
    if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
        currentPreviewUrl = null;
    }
    
    if (currentIndex >= currentPhotos.length) {
        showStatus('🎉 Все фото обработаны!', 'success');
        
        // Добавляем кнопку для новых фото
        const newSessionBtn = document.createElement('button');
        newSessionBtn.textContent = '📸 Новые фото';
        newSessionBtn.className = 'upload-btn';
        newSessionBtn.style.marginTop = '10px';
        newSessionBtn.onclick = function() {
            resetSession();
        };
        
        const statusDiv = document.getElementById('status');
        if (!statusDiv.querySelector('.upload-btn')) {
            statusDiv.appendChild(newSessionBtn);
        }
        return;
    }

    const file = currentPhotos[currentIndex];
    
    try {
        isProcessing = true;
        
        // Проверяем формат файла
        if (file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic') {
            // Конвертируем HEIC в JPEG для превью
            showStatus('Конвертируем HEIC...', 'info');
            const jpegBlob = await convertHeicToJpeg(file);
            currentPreviewUrl = URL.createObjectURL(jpegBlob);
            document.getElementById('photoPreview').src = currentPreviewUrl;
        } else {
            // Для обычных форматов
            const dataUrl = await readFileAsDataURL(file);
            document.getElementById('photoPreview').src = dataUrl;
        }
        
        selectedChild = '';
        document.querySelectorAll('.child-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        showStatus('Выберите ребенка - фото сохранится автоматически', 'info');
        
    } catch (error) {
        console.error('Error showing photo:', error);
        showStatus('Ошибка загрузки фото', 'error');
        // Пропускаем проблемное фото
        currentIndex++;
        updateProgress();
        setTimeout(() => {
            isProcessing = false;
            showCurrentPhoto();
        }, 500);
        return;
    }
    
    isProcessing = false;
}

// Функция для чтения файла как DataURL с Promise
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
    });
}

// Функция конвертации HEIC в JPEG
async function convertHeicToJpeg(heicFile) {
    const arrayBuffer = await heicFile.arrayBuffer();
    const convertResult = await heicConvert({
        buffer: arrayBuffer,
        format: 'JPEG',
        quality: 0.8
    });
    return new Blob([convertResult], { type: 'image/jpeg' });
}

async function savePhoto() {
    if (isProcessing) return; // Защита от множественных нажатий
    
    isProcessing = true;
    
    const lessonNumber = document.getElementById('lessonNumber').value;
    const file = currentPhotos[currentIndex];
    const child = children.find(c => c.id === selectedChild);
    
    if (!child) {
        showStatus('Ошибка: ребенок не найден', 'error');
        isProcessing = false;
        return;
    }

    // Создаем имя файла
    let extension = file.name.split('.').pop();
    let fileToSave = file;
    
    // Если HEIC, конвертируем в JPEG при сохранении
    if (file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic') {
        try {
            fileToSave = await convertHeicToJpeg(file);
            extension = 'jpg';
        } catch (error) {
            showStatus('Ошибка конвертации HEIC', 'error');
            isProcessing = false;
            return;
        }
    }
    
    const fileName = `${selectedChild}.${extension}`;
    
    try {
        // Скачиваем файл
        const url = URL.createObjectURL(fileToSave);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Даем время на скачивание перед очисткой
        setTimeout(() => {
            URL.revokeObjectURL(url);
            
            showStatus(`✅ Сохранено: ${fileName}`, 'success');
            
            // Переходим к следующему фото
            currentIndex++;
            updateProgress();
            
            setTimeout(() => {
                isProcessing = false;
                showCurrentPhoto();
            }, 300);
        }, 100);
        
    } catch (error) {
        console.error('Save error:', error);
        showStatus('Ошибка сохранения', 'error');
        isProcessing = false;
    }
}

function skipPhoto() {
    if (isProcessing) return; // Защита от множественных нажатий
    
    isProcessing = true;
    
    // Очищаем превью
    if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
        currentPreviewUrl = null;
    }
    
    currentIndex++;
    updateProgress();
    
    setTimeout(() => {
        isProcessing = false;
        showCurrentPhoto();
    }, 300);
}

function updateProgress() {
    const progress = (currentIndex / currentPhotos.length) * 100;
    document.getElementById('progressBar').style.width = progress + '%';
}

function showStatus(message, type = '') {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    
    // Удаляем старые кнопки если есть
    const oldBtn = statusDiv.querySelector('button');
    if (oldBtn && !message.includes('🎉')) {
        oldBtn.remove();
    }
}

function resetSession() {
    // Очищаем все состояния
    if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
        currentPreviewUrl = null;
    }
    
    currentPhotos = [];
    currentIndex = 0;
    selectedChild = '';
    isProcessing = false;
    
    document.getElementById('taggerSection').style.display = 'none';
    document.querySelector('.upload-section').style.display = 'block';
    document.getElementById('photoInput').value = '';
    document.getElementById('photoPreview').src = '';
    document.querySelectorAll('.child-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    showStatus('Выберите фото для начала работы', 'info');
}