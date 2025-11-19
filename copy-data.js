import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Получаем текущую директорию
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, 'public', 'data');
const destDir = path.join(__dirname, 'dist', 'data');

console.log('--- ЗАПУСК СКРИПТА КОПИРОВАНИЯ ---');

// 1. Проверяем, существует ли папка public/data
if (!fs.existsSync(srcDir)) {
  console.error(`❌ ОШИБКА: Папка ${srcDir} не найдена!`);
  console.log('🔍 Содержимое корня:', fs.readdirSync(__dirname));
  if (fs.existsSync(path.join(__dirname, 'public'))) {
     console.log('🔍 Содержимое public:', fs.readdirSync(path.join(__dirname, 'public')));
  }
  process.exit(0); // Не ломаем билд, просто выходим
}

// 2. Создаем папку в dist
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// 3. Копируем файлы
const files = fs.readdirSync(srcDir);
console.log(`📂 Найдено файлов для копирования: ${files.length}`);

files.forEach(file => {
  const srcFile = path.join(srcDir, file);
  const destFile = path.join(destDir, file);
  
  // Копируем только файлы (parquet)
  if (fs.lstatSync(srcFile).isFile()) {
    fs.copyFileSync(srcFile, destFile);
    console.log(`✅ Скопирован: ${file}`);
  }
});

console.log('--- КОПИРОВАНИЕ ЗАВЕРШЕНО ---');
