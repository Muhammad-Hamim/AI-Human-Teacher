const ThinkingAnimation = () => {
  return (
    <div>
      <div className="flex justify-center my-4">
        <div className="flex gap-1 items-center bg-gray-800/50 px-4 py-2 rounded-full">
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse delay-150"></div>
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse delay-300"></div>
          <span className="text-xs text-indigo-300 ml-2">Thinking...</span>
        </div>
      </div>
    </div>
  );
};

export default ThinkingAnimation;
