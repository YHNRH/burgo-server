# Burgo Voice Assistant Server

Сервер для умной колонки на базе ESP32. Обрабатывает голосовые команды, выполняет сценарии (погода, время, управление умным домом) и возвращает голосовой ответ через TTS.

## 🚀 Возможности

- Приём аудио с колонки (WAV, 16 кГц, моно)
- Распознавание речи через **Google Speech Recognition** (Python-скрипт)
- Гибкие сценарии, определяемые в `scenarios.json` (регулярные выражения)
- Выполнение действий:
  - Запрос погоды (OpenWeatherMap)
  - Текущее время
  - Управление MQTT-устройствами (свет, розетки)
  - Легко расширяется новыми типами
- Синтез речи через **RHVoice** (локально) с последующим ресемплингом через FFmpeg
- Поддержка UDP-поиска ESP-устройств в локальной сети
- Сохранение загруженных аудио (для отладки)
- Простая база данных MySQL для хранения имён устройств

## 📦 Требования

- Node.js 18+
- Python 3.9+ с модулем `speech_recognition`
- MySQL сервер
- RHVoice и FFmpeg (установлены в системе)
- (Опционально) MQTT-брокер для умного дома

## 🔧 Установка и настройка

### 1. Клонирование репозитория
```bash
git clone https://github.com/yourname/voice-assistant-server.git
cd voice-assistant-server
```
### 2. Установка Node.js зависимостей
```bash
npm install
```
### 3. Настройка Python-окружения для STT
```bash

python3 -m venv venv
source venv/bin/activate
pip install SpeechRecognition
deactivate
```
Скрипт speech.py должен лежать в корне проекта.
### 4. Установка системных пакетов (Ubuntu/Debian)
```bash

sudo apt update
sudo apt install rhvoice rhvoice-russian ffmpeg mysql-server
```
### 5. Создание базы данных MySQL
```sql

CREATE DATABASE burgo;
CREATE USER 'user'@'localhost' IDENTIFIED BY 'secret';
GRANT ALL PRIVILEGES ON burgo.* TO 'user'@'localhost';
FLUSH PRIVILEGES;
```
### 6. Конфигурация

Скопируйте .env.example в .env и укажите свои ключи:
```text

OPENWEATHER_API_KEY=your_key_here
```
При необходимости отредактируйте файл config/constants.js (порты, пути, частота TTS).
### 7. Настройка сценариев

В файле scenarios.json определите свои команды. Пример уже включён в репозиторий.
▶️ Запуск
```bash

node server.js
```
Сервер будет слушать порт 3001 (HTTP) и порт 41235 (UDP для обнаружения устройств).

Для продакшена рекомендуется использовать pm2:
```bash

npm install -g pm2
pm2 start server.js --name voice-assistant
pm2 save
```
📡 API Endpoints
| Метод | Путь | Описание |
|---|---|---|
|POST|	/api/command|	Принимает WAV-файл, возвращает WAV-ответ
|POST|	/api/upload|	Сохраняет WAV-файл в папку uploads/
|POST|	/api/upload_raw|	Сохраняет RAW PCM в uploads/
|GET|	/api/getudp|	Возвращает список ESP-устройств, найденных по UDP
|GET|	/api/switchstate|	Переключает реле на устройстве (параметры Id, RELAY)
|POST|	/api/updatedevice|	Обновляет имя устройства в БД
|GET|	/api/sounds/*.mp3|	Отдаёт звуковые файлы из папки sounds/

🧠 Структура проекта
```text

.
├── config/               # Конфигурационные файлы
│   ├── constants.js      # Порты, пути, настройки TTS
│   ├── database.js       # Подключение к MySQL
│   └── scenarios.js      # Загрузка сценариев из JSON
├── routes/               # Обработчики маршрутов
│   ├── devices.js        # /api/getudp, /api/switchstate, /api/updatedevice
│   ├── audio.js          # /api/upload, /api/upload_raw, /api/sounds
│   └── command.js        # /api/command
├── services/             # Бизнес-логика
│   ├── stt.js            # Распознавание речи
│   ├── tts.js            # Генерация речи + ресемплинг
│   ├── scenarioExecutor.js # Выполнение сценариев
│   └── udpDiscovery.js   # UDP-поиск устройств
├── utils/                # Вспомогательные функции
│   ├── logger.js         # Логирование
│   └── fileUtils.js      # Работа с временными файлами
├── temp/                 # Временные аудиофайлы (создаётся автоматически)
├── uploads/              # Сохранённые записи
├── sounds/               # Статические звуки (для /api/sounds)
├── server.js             # Главный файл
├── scenarios.json        # Сценарии команд
├── speech.py             # Python-скрипт распознавания
└── .env                  # Переменные окружения
```
🐛 Отладка

Все логи пишутся в консоль и (опционально) в файл logs/app.log.

Загруженные аудио сохраняются в uploads/ – можно прослушать, что именно было отправлено.

Временные файлы автоматически удаляются после обработки.
