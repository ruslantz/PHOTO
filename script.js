// Базы данных детей
let currentDatabase = null;
let children = [];

let currentPhotos = [];
let currentIndex = 0;
let selectedChild = '';
let currentPreviewUrl = null;

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    showStatus('Выберите группу для начала работы', 'info');
});

function setupEventListeners() {
    // Выбор базы данных
    document.querySelectorAll('.db-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const dbName = this.getAttribute('data-db');
            selectDatabase(dbName);
        });
    });

    // Загрузка файлов
    const fileInput = document.getElementById('photoInput');
    fileInput.addEventListener('change', handleFileSelect);
}

function selectDatabase(dbName) {
    currentDatabase = dbName;
    children = databases[dbName];
    
    // Обновляем активную кнопку базы данных
    document.querySelectorAll('.db-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.db-btn[data-db="${dbName}"]`).classList.add('active');
    
    // Обновляем кнопки детей
    updateChildButtons();
    
    // Показываем секцию загрузки фото
    document.querySelector('.upload-section').style.display = 'block';
    document.getElementById('taggerSection').style.display = 'none';
    
    showStatus(`Выбрана группа: ${getDatabaseDisplayName(dbName)}. Теперь выберите фото`, 'success');
}

function getDatabaseDisplayName(dbName) {
    const names = {
        'engineers': 'Инженеры',
        'karate': 'Карате'
    };
    return names[dbName] || dbName;
}

function updateChildButtons() {
    const container = document.getElementById('childButtons');
    container.innerHTML = '';
    
    children.forEach(child => {
        const btn = document.createElement('button');
        btn.className = 'child-btn';
        btn.setAttribute('data-id', child.id);
        btn.textContent = child.name.split(' ')[1]; // Показываем только имя
        btn.addEventListener('click', function() {
            selectedChild = this.getAttribute('data-id');
            document.querySelectorAll('.child-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            showStatus('Нажмите "Сохранить фото"', 'info');
        });
        container.appendChild(btn);
    });
}

function handleFileSelect(event) {
    if (!currentDatabase) {
        showStatus('Сначала выберите группу', 'error');
        return;
    }
    
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    currentPhotos = files;
    currentIndex = 0;
    showTaggerSection();
    showCurrentPhoto();
}

function showTaggerSection() {
    document.getElementById('taggerSection').style.display = 'block';
    updateProgress();
    updatePhotoCounter();
}

async function showCurrentPhoto() {
    // Очищаем предыдущее превью
    if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
        currentPreviewUrl = null;
    }
    
    if (currentIndex >= currentPhotos.length) {
        showStatus('🎉 Все фото обработаны!', 'success');
        document.getElementById('saveBtn').style.display = 'none';
        document.getElementById('nextBtn').style.display = 'none';
        document.getElementById('skipBtn').style.display = 'none';
        return;
    }

    const file = currentPhotos[currentIndex];
    
    try {
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
        
        // Показываем актуальные кнопки
        document.getElementById('saveBtn').style.display = 'inline-block';
        document.getElementById('nextBtn').style.display = 'inline-block';
        document.getElementById('skipBtn').style.display = 'inline-block';
        
        showStatus(`Фото ${currentIndex + 1} из ${currentPhotos.length}. Выберите ребенка и нажмите "Сохранить фото"`, 'info');
        updatePhotoCounter();
        
    } catch (error) {
        console.error('Error showing photo:', error);
        showStatus('Ошибка загрузки фото', 'error');
        // Пропускаем проблемное фото
        setTimeout(nextPhoto, 1000);
    }
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
    if (!selectedChild) {
        showStatus('Сначала выберите ребенка', 'error');
        return;
    }

    const lessonNumber = document.getElementById('lessonNumber').value;
    const file = currentPhotos[currentIndex];
    const child = children.find(c => c.id === selectedChild);
    
    if (!child) {
        showStatus('Ошибка: ребенок не найден', 'error');
        return;
    }

    try {
        showStatus('Сжимаем фото...', 'info');
        
        let processedFile;
        
        // Обрабатываем HEIC
        if (file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic') {
            processedFile = await convertHeicToJpeg(file);
        } else {
            // Сжимаем обычные фото
            processedFile = await compressImage(file);
        }
        
        const fileName = `${selectedChild}_lesson${lessonNumber}.jpg`;
        
        // Скачиваем сжатый файл
        const url = URL.createObjectURL(processedFile);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setTimeout(() => {
            URL.revokeObjectURL(url);
            const originalSize = (file.size / 1024 / 1024).toFixed(2);
            const compressedSize = (processedFile.size / 1024 / 1024).toFixed(2);
            showStatus(`✅ Сохранено: ${fileName} (${originalSize}Мб → ${compressedSize}Мб)`, 'success');
        }, 100);
        
    } catch (error) {
        console.error('Save error:', error);
        showStatus('Ошибка сохранения', 'error');
    }
}

// Функция сжатия изображения
async function compressImage(file, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Вычисляем новые размеры (макс. 1200px по большей стороне)
                let width = img.width;
                let height = img.height;
                const maxSize = 1200;
                
                if (width > height && width > maxSize) {
                    height = (height * maxSize) / width;
                    width = maxSize;
                } else if (height > maxSize) {
                    width = (width * maxSize) / height;
                    height = maxSize;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Рисуем сжатое изображение
                ctx.drawImage(img, 0, 0, width, height);
                
                // Конвертируем в JPEG с качеством 70%
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', quality);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Обновляем функцию конвертации HEIC
async function convertHeicToJpeg(heicFile) {
    const arrayBuffer = await heicFile.arrayBuffer();
    const convertResult = await heicConvert({
        buffer: arrayBuffer,
        format: 'JPEG',
        quality: 0.7 // Добавляем качество для HEIC тоже
    });
    return new Blob([convertResult], { type: 'image/jpeg' });
}

function nextPhoto() {
    currentIndex++;
    updateProgress();
    updatePhotoCounter();
    showCurrentPhoto();
}

function skipPhoto() {
    showStatus('Фото пропущено', 'warning');
    nextPhoto();
}

function updateProgress() {
    const progress = (currentIndex / currentPhotos.length) * 100;
    document.getElementById('progressBar').style.width = progress + '%';
}

function updatePhotoCounter() {
    const counter = document.getElementById('photoCounter');
    if (counter) {
        counter.textContent = `${currentIndex + 1} / ${currentPhotos.length}`;
    }
}

function showStatus(message, type = '') {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
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
    
    document.getElementById('taggerSection').style.display = 'none';
    document.querySelector('.upload-section').style.display = 'block';
    document.getElementById('photoInput').value = '';
    document.getElementById('photoPreview').src = '';
    document.querySelectorAll('.child-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Показываем кнопки обратно
    document.getElementById('saveBtn').style.display = 'inline-block';
    document.getElementById('nextBtn').style.display = 'inline-block';
    document.getElementById('skipBtn').style.display = 'inline-block';
    
    showStatus('Выберите фото для начала работы', 'info');
}
