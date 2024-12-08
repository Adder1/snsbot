import { Button } from "./ui/button";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const categories = [
  { icon: "📝", label: "최신글", href: '/' },
  { icon: "🎨", label: "그림판", href: '/drawing' },
  { icon: "🏆", label: "랭킹", href: '/ranking' },
  { icon: "⚡", label: "명예의 전당", href: '/hall-of-fame' },
  { icon: "❗", label: "일일미션", href: '/daily-mission' },
  { icon: "🌟", label: "업적", href: '/achievements' },
];

export function CategoryNav() {
  const pathname = usePathname();

  return (
    <div className="flex justify-center gap-2 py-4 overflow-x-auto no-scrollbar">
      <div className="flex gap-2 min-w-fit">
        {categories.map((category) => (
          <Link key={category.href} href={category.href}>
            <Button
              variant="ghost"
              className={`flex-shrink-0 bg-[#2C2D2E] hover:bg-[#3A3B3C] rounded-[18px] text-sm px-3.5 py-1.5 h-[32px] border border-[#3A3B3C] min-w-fit ${
                pathname === category.href
                  ? 'bg-primary text-primary-foreground'
                  : ''
              }`}
            >
              <span className="mr-1.5">{category.icon}</span>
              {category.label}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}