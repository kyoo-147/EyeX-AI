// # !/usr/bin/env python3
// # -*- encoding: utf-8 -*-
// # Copyright EyeX-AI. All Rights Reserved.
// # NaVin AIF Technology
// # MIT License  (https://opensource.org/licenses/MIT)
import "./globals.css";
import { Public_Sans } from "next/font/google";

import { Navbar } from "@/components/Navbar";

const publicSans = Public_Sans({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>EyeX-AI</title>
        <link rel="shortcut icon" href="/images/favicon.ico" />
        <meta
          name="description"
          content="Tạo model AI LLM chatbot từ bất kỳ tài liệu nào!"
        />
        <meta
          property="og:title"
          content="Trò chuyện hoàn toàn trong trình duyệt qua tài liệu"
        />
        <meta
          property="og:description"
          content="Tải lên một bản PDF rồi đặt câu hỏi về nó - mà không cần một yêu cầu từ xa nào!"
        />
        <meta property="og:image" content="/images/final_home.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Trò chuyện hoàn toàn trong trình duyệt qua tài liệu"
        />
        <meta
          name="twitter:description"
          content="Tải lên một bản PDF rồi đặt câu hỏi về nó - mà không cần một yêu cầu từ xa nào!"
        />
        <meta name="twitter:image" content="/images/final_home.png" />
      </head>
      <body className={publicSans.className}>
        <div className="flex flex-col p-4 md:p-12 h-[100vh]">{children}</div>
        {/* <div className="logo"></div> */}

      </body>
    </html>
  );
}
