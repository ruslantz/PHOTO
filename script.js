// База данных детей
const children = [
    { id: "YAKOV2020", name: "Яков Ситдиков" },
    { id: "ARINA2020", name: "Арина Родионовна" },
    { id: "VASYA2020", name: "Вася Пупкин" }
];

let currentPhotos = [];
let currentIndex = 0;
let selectedChild = '';

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    showStatus('Выберите фото для начала работы', 'info');
});

function setupEventListeners() {
    // Выбор ребенка
    document.querySelectorAll('.child-btn').forEach(btn => {
        btn.addEventListener('click', function() {
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

function showCurrentPhoto() {
    if (currentIndex >= currentPhotos.length) {
        showStatus('🎉 Все фото обработаны!', 'success');
        return;
    }

    const file = currentPhotos[currentIndex];
       
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('photoPreview').src = e.target.result;
        selectedChild = '';
        document.querySelectorAll('.child-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        showStatus('Выберите ребенка - фото сохранится автоматически', 'info');
    };
    
    reader.readAsDataURL(file);
}

function savePhoto() {
    const lessonNumber = document.getElementById('lessonNumber').value;
    const file = currentPhotos[currentIndex];
    const child = children.find(c => c.id === selectedChild);
    
    if (!child) {
        showStatus('Ошибка: ребенок не найден', 'error');
        return;
    }

    // Создаем имя файла
    const extension = file.name.split('.').pop();
    const fileName = `${child.name}_занятие${lessonNumber}.${extension}`;
    
    // Скачиваем файл
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showStatus(`✅ Сохранено: ${fileName}`, 'success');
    
    // Переходим к следующему фото
    currentIndex++;
    updateProgress();
    setTimeout(showCurrentPhoto, 1000);
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
