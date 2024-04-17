// # !/usr/bin/env python3
// # -*- encoding: utf-8 -*-
// # Copyright EyeX-AI. All Rights Reserved.
// # NaVin AIF Technology
// # MIT License  (https://opensource.org/licenses/MIT)
"use client";

import { usePathname } from 'next/navigation';

export function Navbar() {
  const pathname = usePathname();
  return (
    <nav className="mb-4">
      <a className={`mr-4 ${pathname === "/" ? "text-white border-b" : ""}`} href="/">Trò chuyện</a>
      <a className={`mr-4 ${pathname === "/structured_output" ? "text-white border-b" : ""}`} href="/structured_output">Cấu trúc đầu ra</a>
      <a className={`mr-4 ${pathname === "/agents" ? "text-white border-b" : ""}`} href="/agents">Đặc vụ</a>
      <a className={`mr-4 ${pathname === "/retrieval" ? "text-white border-b" : ""}`} href="/retrieval">Truy xuất</a>
      <a className={`mr-4 ${pathname === "/retrieval_agents" ? "text-white border-b" : ""}`} href="/retrieval_agents">Tác nhân truy xuất</a>
    </nav>
  );
}

