import { PageLayout } from '@/components/layout/page-layout';
import { prisma } from '@/lib/prisma';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Heart } from 'lucide-react';
import Image from 'next/image';
import { analyzeDrawingPsychology } from '@/lib/gemini';
import { ScoreChart } from '@/components/evaluation/score-chart';
import Link from 'next/link';

async function getDrawing(id: string) {
  try {
    const drawing = await prisma.drawing.findUnique({
      where: { id },
      include: {
        author: true,
        likes: true,
        aiAnalysis: true,
        evaluations: {
          include: {
            bot: true,
          },
        },
      },
    });

    if (!drawing) {
      throw new Error('Drawing not found');
    }

    return drawing;
  } catch (error) {
    console.error('Error fetching drawing:', error);
    throw error;
  }
}

async function getOrCreateAnalysis(drawing: any) {
  if (drawing.aiAnalysis) {
    return drawing.aiAnalysis.content;
  }

  try {
    // Gemini AI로 분석 수행
    const analysis = await analyzeDrawingPsychology(drawing.imageUrl);
    
    // 분석 결과를 데이터베이스에 저장
    await prisma.aIAnalysis.create({
      data: {
        content: analysis,
        drawingId: drawing.id,
      },
    });

    return analysis;
  } catch (error) {
    console.error('Error analyzing drawing:', error);
    return "죄송합니다. 현재 그림 분석을 수행할 수 없습니다. 나중에 다시 시도해주세요.";
  }
}

export default async function AIEvaluationPage({
  params,
}: {
  params: { id: string };
}) {
  try {
    const drawing = await getDrawing(params.id);

    if (!drawing) {
      return <div>그림을 찾을 수 없습니다.</div>;
    }

    console.log('Drawing evaluations:', drawing.evaluations);
    
    const analysis = await getOrCreateAnalysis(drawing);
    
    // AI 평가 점수 데이터 준비
    const scores = drawing.evaluations.map(evaluation => {
      return {
        botName: evaluation.bot.name,
        score: evaluation.score,
        avatar: evaluation.bot.avatar,
      };
    });

    console.log('Prepared scores:', scores);

    return (
      <PageLayout>
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          {/* 그림 */}
          <div className="bg-[#2B2D31] rounded-lg p-4 flex justify-center">
            <div className="relative w-[400px] h-[400px]">
              <Image
                src={drawing.imageUrl}
                alt="Drawing"
                fill
                className="object-contain"
              />
            </div>
          </div>

          {/* 그림 정보 */}
          <div className="bg-[#2B2D31] rounded-lg p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">작품 설명</h2>
                <p className="text-[#B5BAC1]">{drawing.description || '설명이 없습니다.'}</p>
              </div>
              <div className="flex items-center space-x-2 text-[#B5BAC1]">
                <Heart className="w-5 h-5" />
                <span>{drawing.likes.length}</span>
              </div>
            </div>
            
            <div className="border-t border-[#1E1F22] pt-4">
              <div className="flex justify-between text-[#B5BAC1]">
                <div className="flex items-center space-x-2">
                  <div className="relative w-8 h-8">
                    <Image
                      src={drawing.author.image || '/avatars/default.png'}
                      alt={drawing.author.name || '사용자'}
                      fill
                      className="rounded-full object-cover"
                    />
                  </div>
                  <span>{drawing.author.name || '사용자'}</span>
                </div>
                <div>
                  {formatDistanceToNow(new Date(drawing.createdAt), {
                    addSuffix: true,
                    locale: ko,
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 심리박사 AI의 분석 */}
          <div className="bg-[#4e4c3d] rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <div className="relative w-10 h-10 flex-shrink-0">
                <Image
                  src="/ai-avatars/simribaksa.png"
                  alt="심리박사"
                  fill
                  className="rounded-full object-cover"
                />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-medium">심리박사AI의 🎨그림 심리 분석 ✨</h3>
                  <span className="text-sm text-[#B5BAC1]">
                    {formatDistanceToNow(drawing.createdAt, {
                      addSuffix: true,
                      locale: ko,
                    })}
                  </span>
                </div>
                <p className="text-[#B5BAC1] whitespace-pre-wrap">
                  {analysis}
                </p>
              </div>
            </div>
          </div>

          {/* AI 평가 점수 */}
          <ScoreChart scores={scores} />

          {/* AI 봇들의 평가 코멘트 */}
          <div className="space-y-4">
            {drawing.evaluations.map((evaluation) => (
              <div key={evaluation.id} className="bg-[#2B2D31] rounded-lg p-4">
                <div className="flex space-x-4">
                  {/* 봇 프로필 이미지 */}
                  <div className="relative">
                    <div className="w-[80px] h-[80px] relative">
                      <Image
                        src={evaluation.bot.avatar}
                        alt={evaluation.bot.name}
                        fill
                        className="rounded-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#2C2D31] px-3 py-1 rounded-full">
                      <span className="text-[#FFD700] font-bold">{evaluation.score}점</span>
                    </div>
                  </div>

                  {/* 봇 정보와 코멘트 */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-bold text-lg">{evaluation.bot.name}</span>
                      <div className="bg-[#404249] text-xs px-2 py-1 rounded">
                        {evaluation.bot.description}
                      </div>
                    </div>
                    <p className="text-[#B5BAC1]">{evaluation.comment}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PageLayout>
    );
  } catch (error) {
    console.error('Error loading AI evaluation:', error);
    return <div>평가 결과를 불러오는 중 오류가 발생했습니다.</div>;
  }
}
