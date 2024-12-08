export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-200px)]">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-4 border-[#2A4137] border-t-[#98B0A8] rounded-full animate-spin" />
        <span className="text-[#98B0A8]">로딩 중...</span>
      </div>
    </div>
  );
} 