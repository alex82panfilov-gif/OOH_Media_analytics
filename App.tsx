import React from 'react';

const App: React.FC = () => {
  console.log("App started!"); // Это должно появиться в консоли

  return (
    <div className="p-10 bg-blue-100 min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-blue-800 mb-4">
        Приложение работает!
      </h1>
      <p className="text-lg text-gray-700">
        React запустился. Проблема была в логике загрузки данных.
      </p>
      <button 
        className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
        onClick={() => alert("Кнопка работает")}
      >
        Нажми меня
      </button>
    </div>
  );
};

export default App;
