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
    const fileName = `${selectedChild}_занятие${lessonNumber}.${extension}`;
    
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
