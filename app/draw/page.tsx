"use client";

import { useState, useRef, useEffect } from 'react';
import { PageLayout } from '@/components/layout/page-layout';
import { useRouter } from 'next/navigation';
import { submitDrawing } from '@/lib/api/drawings';
import { useSession } from 'next-auth/react';

interface DrawAction {
  type: 'path' | 'line' | 'rectangle' | 'circle' | 'text';
  points: { x: number; y: number }[];
  color: string;
  size: number;
  text?: string;
}

export default function DrawPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<'pencil' | 'line' | 'rectangle' | 'circle' | 'text'>('pencil');
  const [actions, setActions] = useState<DrawAction[]>([]);
  const [redoActions, setRedoActions] = useState<DrawAction[]>([]);
  const [currentAction, setCurrentAction] = useState<DrawAction | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 512;
    canvas.height = 512;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctxRef.current = ctx;
    
    // 초기 흰색 배경
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setCurrentAction({
      type: currentTool === 'pencil' ? 'path' : currentTool,
      points: [{ x, y }],
      color: color,
      size: brushSize
    });
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentAction || !ctxRef.current || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = ctxRef.current;
    ctx.strokeStyle = currentAction.color;
    ctx.lineWidth = currentAction.size;

    if (currentTool === 'pencil') {
      ctx.beginPath();
      ctx.moveTo(currentAction.points[currentAction.points.length - 1].x, currentAction.points[currentAction.points.length - 1].y);
      ctx.lineTo(x, y);
      ctx.stroke();
      setCurrentAction({
        ...currentAction,
        points: [...currentAction.points, { x, y }]
      });
    } else {
      // 임시 그리기 (미리보기)
      redrawCanvas();
      ctx.beginPath();
      const startPoint = currentAction.points[0];
      
      if (currentTool === 'line') {
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(x, y);
      } else if (currentTool === 'rectangle') {
        ctx.strokeRect(
          startPoint.x,
          startPoint.y,
          x - startPoint.x,
          y - startPoint.y
        );
      } else if (currentTool === 'circle') {
        const radius = Math.sqrt(
          Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2)
        );
        ctx.beginPath();
        ctx.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI);
      }
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing || !currentAction) return;
    setIsDrawing(false);
    setActions([...actions, currentAction]);
    setRedoActions([]);
  };

  const redrawCanvas = () => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    // Clear canvas with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Redraw all actions
    actions.forEach(action => {
      ctx.strokeStyle = action.color;
      ctx.lineWidth = action.size;
      ctx.beginPath();

      if (action.type === 'path') {
        action.points.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
      } else if (action.type === 'line') {
        const start = action.points[0];
        const end = action.points[action.points.length - 1];
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
      } else if (action.type === 'rectangle') {
        const start = action.points[0];
        const end = action.points[action.points.length - 1];
        ctx.strokeRect(
          start.x,
          start.y,
          end.x - start.x,
          end.y - start.y
        );
      } else if (action.type === 'circle') {
        const center = action.points[0];
        const end = action.points[action.points.length - 1];
        const radius = Math.sqrt(
          Math.pow(end.x - center.x, 2) + Math.pow(end.y - center.y, 2)
        );
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
      }
      ctx.stroke();
    });
  };

  const handleUndo = () => {
    if (actions.length === 0) return;
    const lastAction = actions[actions.length - 1];
    setActions(actions.slice(0, -1));
    setRedoActions([...redoActions, lastAction]);
    redrawCanvas();
  };

  const handleRedo = () => {
    if (redoActions.length === 0) return;
    const actionToRedo = redoActions[redoActions.length - 1];
    setRedoActions(redoActions.slice(0, -1));
    setActions([...actions, actionToRedo]);
    redrawCanvas();
  };

  const handleClear = () => {
    setActions([]);
    setRedoActions([]);
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSubmit = async () => {
    if (!session?.user?.id || !canvasRef.current || isSubmitting) {
      console.error('Submit failed: ', {
        hasSession: !!session,
        hasUserId: !!session?.user?.id,
        hasCanvas: !!canvasRef.current,
        isSubmitting
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const canvas = canvasRef.current;
      const imageData = canvas.toDataURL('image/png');
      
      // 그림 제출
      const result = await submitDrawing({
        imageData,
        description,
        userId: session.user.id
      });

      // 일일 미션 처리
      await fetch('/api/daily-mission/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missionType: 'draw' })
      });

      console.log('Drawing submitted successfully:', result);
      router.push('/drawing');
    } catch (error) {
      console.error('Failed to submit drawing:', error);
      if (error instanceof Error) {
        alert(`그림 제출에 실패했습니다: ${error.message}`);
      } else {
        alert('그림 제출에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout>
      <div className="flex flex-col items-center space-y-4">
        {/* 캔버스 영역 */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="w-[512px] h-[512px] bg-white rounded-lg shadow-lg"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
          <span className="absolute bottom-2 left-2 text-xs text-gray-400">@SNS Bot</span>
        </div>

        {/* 그리기 도구 */}
        <div className="bg-[#2B2D31] rounded-lg p-2 flex items-center space-x-2">
          <button 
            className={`p-2 rounded hover:bg-[#404249] transition-colors ${currentTool === 'pencil' ? 'bg-[#1E1F22]' : ''}`}
            onClick={() => setCurrentTool('pencil')}
          >
            <span className="text-[#B5BAC1]">✏️</span>
          </button>
          <button className="p-2 rounded hover:bg-[#404249] transition-colors">
            <span className="text-[#B5BAC1]">🔄</span>
          </button>
          <button 
            className="p-2 rounded hover:bg-[#404249] transition-colors"
            onClick={handleClear}
          >
            <span className="text-[#B5BAC1]">🗑️</span>
          </button>
          <button 
            className="p-2 rounded hover:bg-[#404249] transition-colors"
            onClick={handleUndo}
          >
            <span className="text-[#B5BAC1]">↩️</span>
          </button>
          <button 
            className="p-2 rounded hover:bg-[#404249] transition-colors"
            onClick={handleRedo}
          >
            <span className="text-[#B5BAC1]">↪️</span>
          </button>
          <button className="p-2 rounded hover:bg-[#404249] transition-colors">
            <span className="text-[#B5BAC1]">🔄</span>
          </button>
          <button className="p-2 rounded hover:bg-[#404249] transition-colors">
            <span className="text-[#B5BAC1]">🎯</span>
          </button>
          
          {/* 구분선 */}
          <div className="h-8 w-px bg-[#404249]"></div>
          
          {/* 브러시 크기 조절 */}
          <input 
            type="range" 
            min="1" 
            max="100" 
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-24 accent-blue-500"
          />
          
          {/* 도형 도구들 */}
          <button 
            className={`p-2 rounded hover:bg-[#404249] transition-colors ${currentTool === 'line' ? 'bg-[#1E1F22]' : ''}`}
            onClick={() => setCurrentTool('line')}
          >
            <span className="text-[#B5BAC1]">／</span>
          </button>
          <button 
            className={`p-2 rounded hover:bg-[#404249] transition-colors ${currentTool === 'rectangle' ? 'bg-[#1E1F22]' : ''}`}
            onClick={() => setCurrentTool('rectangle')}
          >
            <span className="text-[#B5BAC1]">□</span>
          </button>
          <button 
            className={`p-2 rounded hover:bg-[#404249] transition-colors ${currentTool === 'circle' ? 'bg-[#1E1F22]' : ''}`}
            onClick={() => setCurrentTool('circle')}
          >
            <span className="text-[#B5BAC1]">○</span>
          </button>
          <button 
            className={`p-2 rounded hover:bg-[#404249] transition-colors ${currentTool === 'text' ? 'bg-[#1E1F22]' : ''}`}
            onClick={() => setCurrentTool('text')}
          >
            <span className="text-[#B5BAC1]">💬</span>
          </button>

          {/* Color Picker */}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer"
          />
        </div>

        {/* 하단 입력창 */}
        <div className="w-[600px] flex">
          <input
            type="text"
            placeholder="작품 설명"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="flex-1 bg-[#2B2D31] text-[#B5BAC1] rounded-l px-4 py-2 focus:outline-none"
          />
          <button 
            className={`bg-[#404249] text-[#B5BAC1] px-4 py-2 rounded-r hover:bg-[#4F545C] transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? '제출 중...' : '출품하기'}
          </button>
        </div>
      </div>
    </PageLayout>
  );
}
