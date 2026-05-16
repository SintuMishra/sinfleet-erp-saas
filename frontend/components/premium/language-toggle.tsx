import { Button } from "@/components/ui/button";

export function LanguageToggle() {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 p-1">
      <Button type="button" size="default" className="h-9 px-3 text-sm">English</Button>
      <Button type="button" variant="ghost" className="h-9 px-3 text-sm text-slate-200 hover:bg-white/10 hover:text-white">Hindi</Button>
    </div>
  );
}
