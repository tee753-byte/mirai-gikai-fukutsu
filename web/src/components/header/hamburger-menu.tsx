"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { policyLinks } from "@/components/layouts/footer/footer.config";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RubyToggle } from "@/lib/rubyful";
import { HAMBURGER_NAV_LINKS } from "./nav-links";

export function HamburgerMenu() {
  /*
   * 開いているかを自分で持つ。
   *
   * ヘッダーはレイアウトに置かれていて画面を移動しても作り直されないため、
   * メニュー内のリンクを押しても開いたままになり、移動先のページに
   * かぶさり続けていた。リンクを押した時点で閉じる。
   */
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          aria-label="メニューを開く"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <nav aria-label="メニュー" className="flex flex-col gap-1">
          {HAMBURGER_NAV_LINKS.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium text-mirai-text hover:bg-mirai-surface-muted"
            >
              <Icon className="h-4 w-4 text-mirai-text-secondary" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="my-2 border-t border-border" />

        <div className="px-2 py-1">
          <RubyToggle />
        </div>

        <div className="my-2 border-t border-border" />

        <nav
          aria-label="ポリシー"
          className="flex flex-col gap-1 px-2 pb-1 text-xs text-mirai-text-secondary"
        >
          {policyLinks
            .filter((policy) => !policy.external)
            .map((policy) => (
              <Link
                key={policy.href}
                href={policy.href}
                onClick={() => setOpen(false)}
                className="py-1 hover:text-mirai-text"
              >
                {policy.label}
              </Link>
            ))}
        </nav>
      </PopoverContent>
    </Popover>
  );
}
