'use client';

import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface AIScore {
  botName: string;
  score: number;
  avatar: string;
}

interface ScoreChartProps {
  scores: AIScore[];
}

export function ScoreChart({ scores }: ScoreChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // 이전 차트 인스턴스 제거
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    const averageScore = scores.reduce((acc, curr) => acc + curr.score, 0) / scores.length;

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: scores.map(score => score.botName),
        datasets: [
          {
            data: scores.map(score => score.score),
            backgroundColor: '#4e4c3d',
            borderColor: '#2B2D31',
            borderWidth: 1,
            borderRadius: 5,
            barThickness: 40,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            grid: {
              color: '#2B2D31',
            },
            ticks: {
              color: '#B5BAC1',
            },
          },
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: '#B5BAC1',
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: '#2B2D31',
            titleColor: '#FFFFFF',
            bodyColor: '#B5BAC1',
            padding: 12,
            displayColors: false,
            callbacks: {
              title: (items) => {
                const index = items[0].dataIndex;
                return scores[index].botName;
              },
              label: (item) => {
                return `점수: ${item.raw}점`;
              },
            },
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [scores]);

  // 평가 데이터가 없는 경우
  if (!scores || scores.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">AI의 작품 평가</h3>
        <div className="bg-[#2B2D31] rounded-lg p-6 text-center">
          <p className="text-[#B5BAC1]">아직 AI 평가가 진행되지 않았습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-medium">
          AI의 작품 평가 (평균 점수:{' '}
          <span className="text-[#B5BAC1]">
            {(scores.reduce((acc, curr) => acc + curr.score, 0) / scores.length).toFixed(1)}
          </span>
          )
        </h3>
      </div>
      <div className="bg-[#2B2D31] rounded-lg p-6">
        <div className="h-[400px]">
          <canvas ref={chartRef} />
        </div>
      </div>
    </div>
  );
}
