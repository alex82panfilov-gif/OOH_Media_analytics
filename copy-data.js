import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- ИСПРАВЛЕНИЕ ОШИБКИ С ИМЕНЕМ ПАПКИ ---
// Проверяем, как называется папка: "public" или "public " (с пробелом)
let publicFolderName = 'public';
if (!fs.existsSync(path.join(__dirname, 'public')) && fs.existsSync(path.join(__dirname, 'public '))) {
  console.log('⚠️ ОБНАРУЖЕНА ПАПКА С ПРОБЕЛОМ: "public ". Использую её.');
  publicFolderName = 'public ';
}

const srcDir = path.join(__dirname, publicFolderName, 'data');
const destDir = path.join(__dirname, 'dist', 'data');

console.log('--- ЗАПУСК СКРИПТА КОПИРОВАНИЯ ---');
console.log(`📂 Источник: ${srcDir}`);

// 1. Проверяем, существует ли папка public/data
if (!fs.existsSync(srcDir)) {
  console.error(`❌ ОШИБКА: Папка data не найдена внутри ${publicFolderName}!`);
  // Выводим содержимое public, чтобы понять, что там
  if (fs.existsSync(path.join(__dirname, publicFolderName))) {
     console.log(`🔍 Содержимое папки ${publicFolderName}:`, fs.readdirSync(path.join(__dirname, publicFolderName)));
  }
  process.exit(0); 
}

// 2. Создаем папку в dist
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// 3. Копируем файлы
const files = fs.readdirSync(srcDir);
console.log(`📂 Найдено файлов: ${files.length}`);

files.forEach(file => {
  const srcFile = path.join(srcDir, file);
  const destFile = path.join(destDir, file);
  
  if (fs.lstatSync(srcFile).isFile()) {
    fs.copyFileSync(srcFile, destFile);
    // console.log(`✅ ${file}`); // Скрыл, чтобы не засорять логи
  }
});

console.log(`✅ Успешно скопировано ${files.length} файлов.`);
console.log('--- КОПИРОВАНИЕ ЗАВЕРШЕНО ---');
