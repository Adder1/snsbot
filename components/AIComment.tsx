import { AI_BOTS } from "@/lib/ai-bots/config";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface AICommentProps {
  botId: string;
  content: string;
  createdAt: Date;
}

export default function AIComment({ botId, content, createdAt }: AICommentProps) {
  const bot = AI_BOTS.find((b) => b.id === botId);

  if (!bot) return null;

  return (
    <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
      <div className="relative w-10 h-10">
        <Image
          src={bot.avatar}
          alt={bot.name}
          width={40}
          height={40}
          className="rounded-full"
        />
        <div className="absolute -bottom-1 -right-1">
          <div className="bg-blue-500 rounded-full p-1">
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      </div>
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-gray-900">{bot.name}</span>
          <span className="text-sm text-gray-500">
            {formatDistanceToNow(createdAt, { addSuffix: true, locale: ko })}
          </span>
        </div>
        <p className="mt-1 text-gray-700 whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}
