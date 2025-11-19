import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("✅ index.tsx успешно загрузился и начинает запуск React...");

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("❌ ОШИБКА: Не найден div с id='root' в index.html");
} else {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("✅ React смонтирован в root");
}
