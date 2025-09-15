// База данных детей
const children = [
    { id: "YAKOV2020", name: "Яков Ситдиков" },
    { id: "ARINA2020", name: "Арина Родионовна" },
    { id: "VASYA2020", name: "Вася Пупкин" }
];

let currentPhotos = [];
let currentIndex = 0;
let selectedChild = '';
let originalImageSize = 0;
let optimizedImageSize = 0;

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    showStatus('Выберите фото для оптимизации и сохранения', 'info');
});

function setupEventListeners() {
    // Настройка слайдеров
    const qualitySlider = document.getElementById('qualitySlider');
    const qualityValue = document.getElementById('qualityValue');
    qualitySlider.addEventListener('input', function() {
        qualityValue.textContent = this.value + '%';
        if (currentPhotos.length > 0) {
            updatePreview();
        }
    });

    const sizeSlider = document.getElementById('sizeSlider');
    const sizeValue = document.getElementById('sizeValue');
    sizeSlider.addEventListener('input', function() {
        sizeValue.textContent = this.value + '%';
        if (currentPhotos.length > 0) {
            updatePreview();
        }
    });

    // Выбор формата
    document.getElementById('formatSelect').addEventListener('change', function() {
        if (currentPhotos.length > 0) {
            updatePreview();
        }
    });

    // Выбор ребенка
    document.querySelectorAll('.child-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            selectedChild = this.getAttribute('data-id');
            document.querySelectorAll('.child-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
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

function showCurrentPhoto() {
    if (currentIndex >= currentPhotos.length) {
        showStatus('🎉 Все фото обработаны!', 'success');
        return;
    }

    const file = currentPhotos[currentIndex];
    originalImageSize = file.size;
    updateFileInfo(file);
    
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('photoPreview').src = e.target.result;
        selectedChild = '';
        document.querySelectorAll('.child-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Обновляем предпросмотр с настройками по умолчанию
        setTimeout(updatePreview, 100);
    };
    
    reader.readAsDataURL(file);
}

function updatePreview() {
    if (currentIndex >= currentPhotos.length) return;

    const file = currentPhotos[currentIndex];
    const quality = parseInt(document.getElementById('qualitySlider').value);
    const scale = parseInt(document.getElementById('sizeSlider').value) / 100;
    const format = document.getElementById('formatSelect').value;

    const img = new Image();
    img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Вычисляем новые размеры
        const newWidth = Math.round(img.width * scale);
        const newHeight = Math.round(img.height * scale);
        
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        // Рисуем изображение с новыми размерами
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        
        // Конвертируем в выбранный формат
        let mimeType = 'image/jpeg';
        if (format === 'webp') mimeType = 'image/webp';
        else if (format === 'png') mimeType = 'image/png';
        
        canvas.toBlob(function(blob) {
            optimizedImageSize = blob.size;
            updateComparison();
            document.getElementById('photoPreview').src = URL.createObjectURL(blob);
        }, mimeType, quality / 100);
    };
    
    img.src = URL.createObjectURL(file);
}

function updateFileInfo(file) {
    const fileInfo = document.getElementById('fileInfo');
    const size = formatFileSize(file.size);
    fileInfo.innerHTML = `
        <strong>Фото ${currentIndex + 1} из ${currentPhotos.length}</strong><br>
        Имя: ${file.name}<br>
        Размер: ${size}<br>
        Тип: ${file.type || 'image'}
    `;
}

function updateComparison() {
    document.getElementById('originalSize').textContent = formatFileSize(originalImageSize);
    document.getElementById('newSize').textContent = formatFileSize(optimizedImageSize);
    
    const savings = originalImageSize - optimizedImageSize;
    const percent = (savings / originalImageSize * 100).toFixed(1);
    
    if (savings > 0) {
        document.getElementById('savings').textContent = 
            `Экономия: ${formatFileSize(savings)} (${percent}%)`;
    } else {
        document.getElementById('savings').textContent = '';
    }
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
}

function processAndDownload() {
    if (!selectedChild) {
        showStatus('Сначала выберите ребенка!', 'error');
        return;
    }

    const file = currentPhotos[currentIndex];
    const lessonNumber = document.getElementById('lessonNumber').value;
    const quality = parseInt(document.getElementById('qualitySlider').value);
    const scale = parseInt(document.getElementById('sizeSlider').value) / 100;
    const format = document.getElementById('formatSelect').value;
    const child = children.find(c => c.id === selectedChild);
    
    const img = new Image();
    img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Вычисляем новые размеры
        const newWidth = Math.round(img.width * scale);
        const newHeight = Math.round(img.height * scale);
        
        canvas.width = newWidth;
        canvas.height = newHeight + 60; // Место для текста
        
        // Заливаем белым фон
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Рисуем оригинальное изображение
        ctx.drawImage(img, 0, 60, newWidth, newHeight);
        
        // Добавляем текст с информацией
        ctx.fillStyle = '#2c3e50';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${child.name} - Занятие ${lessonNumber}`, canvas.width/2, 30);
        
        // Конвертируем в выбранный формат
        let mimeType = 'image/jpeg';
        let extension = 'jpg';
        
        if (format === 'webp') {
            mimeType = 'image/webp';
            extension = 'webp';
        } else if (format === 'png') {
            mimeType = 'image/png';
            extension = 'png';
        }
        
        canvas.toBlob(function(blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${child.name}_занятие_${lessonNumber}.${extension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showStatus('✅ Фото оптимизировано и скачано!', 'success');
            
            // Переходим к следующему фото
            currentIndex++;
            updateProgress();
            setTimeout(showCurrentPhoto, 1500);
        }, mimeType, quality / 100);
    };
    
    img.src = URL.createObjectURL(file);
}

function skipPhoto() {
    currentIndex++;
    updateProgress();
    showCurrentPhoto();
}

function updateProgress() {
    const progress = (currentIndex / currentPhotos.length) * 100;
    document.getElementById('progressBar').style.width = progress + '%';
}

function showStatus(message, type = '') {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
}
