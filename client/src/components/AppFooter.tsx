import { Clock3 } from "lucide-react";

export default function AppFooter() {
  return (
    <footer className="border-t-[3px] border-[#17324d] bg-[#17324d] py-8 text-[#fff7e7]">
      <div className="container flex flex-col justify-between gap-4 text-sm font-bold md:flex-row md:items-center">
        <p>아이안심 · 간단한 자녀 위치 공유 서비스 데모</p>
        <p className="flex items-center gap-2 text-[#d9e5df]">
          <Clock3 className="h-4 w-4" /> 실제 위치 추적은 사용자 동의와 보안 설계가 필요합니다.
        </p>
      </div>
    </footer>
  );
}
