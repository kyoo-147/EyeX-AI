// # !/usr/bin/env python3
// # -*- encoding: utf-8 -*-
// # Copyright EyeX-AI. All Rights Reserved.
// # NaVin AIF Technology
// # MIT License  (https://opensource.org/licenses/MIT)
"use client";

import { Id, ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useRef, useState, useEffect } from "react";
import type { FormEvent } from "react";

import { ChatMessageBubble } from "@/components/ChatMessageBubble";
import { ChatWindowMessage } from '@/schema/ChatWindowMessage';
import "app/globals.css";
import React from 'react';

// import video from "./intro_vid.mp4";

// import { ReactMic } from 'react-mic';

// import Image from 'next/image'

// import logo from 'public/images/logo_com.png'; // Thay đổi đường dẫn đến logo của bạn

// import React from 'react';
// import logo from 'app/logo_com.png'; // Thay đổi đường dẫn đến logo của bạn
// import './Header.css'; // Tạo một tệp CSS mới cho phần Header nếu cần

// function Header() {
//   return (
//     <div className="header">
//       <image src={logo} alt="Logo" className="logo" />
//       {/* <img src="path/to/logo.png" alt="Logo" class="logo" /> */}
//       <h1 className="product-name">Tên Sản Phẩm</h1>
//     </div>
//   );
// }

// export default Header;


export function ChatWindow(props: {
  placeholder?: string;
}) {
  const { placeholder } = props;
  const [messages, setMessages] = useState<ChatWindowMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPDF, setSelectedPDF] = useState<File | null>(null);
  const [readyToChat, setReadyToChat] = useState(false);
  const [browserOnly, setBrowserOnly] = useState(false);
  const initProgressToastId = useRef<Id | null>(null);
  const titleText = browserOnly ? "EyeX-AI: Sáng tạo, Học hỏi. Tri thức của bạn, Sức mạnh của chúng tôi" : "EyeX-AI: Mở ra thế giới tri thức mới, sự sáng tạo không giới hạn!";
  const emoji = browserOnly ? "🌀" : "🧿";

  const worker = useRef<Worker | null>(null);
  

  async function queryStore(messages: ChatWindowMessage[]) {
    if (!worker.current) {
      throw new Error("Worker chưa sẵn sàng.");
    }
    return new ReadableStream({
      start(controller) {
        if (!worker.current) {
          controller.close();
          return;
        }
        // Config copied from:
        // https://github.com/mlc-ai/web-llm/blob/eaaff6a7730b6403810bb4fd2bbc4af113c36050/examples/simple-chat/src/gh-config.js
        const webLLMConfig = {
          temperature: 0.1,
          modelRecord: {
            "model_url": "https://huggingface.co/mlc-ai/phi-2-q4f32_1-MLC/resolve/main/",
            "local_id": "Phi2-q4f32_1",
            "model_lib_url": "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/phi-2/phi-2-q4f32_1-ctx2k-webgpu.wasm",
            "vram_required_MB": 4032.48,
            "low_resource_required": false,
          },
          // {
          //   "model_url": "https://huggingface.co/mlc-ai/phi-2-q0f16-MLC/resolve/main/",
          //   "local_id": "Phi2-q0f16",
          //   "model_lib_url": "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/phi-2/phi-2-q0f16-ctx2k-webgpu.wasm",
          //   "vram_required_MB": 11079.47,
          //   "low_resource_required": false,
          //   "required_features": ["shader-f16"],
          // },
        };
        // call api mistral local
        const ollamaConfig = {
          baseUrl: "http://localhost:11434",
          temperature: 0.3,
          model: "mistral",
        };
        const payload: Record<string, any> = {
          messages,
          modelProvider: browserOnly ? "webllm" : "ollama",
          modelConfig: browserOnly ? webLLMConfig : ollamaConfig,
        };
        if (
          process.env.NEXT_PUBLIC_LANGCHAIN_TRACING_V2 === "true" &&
          process.env.NEXT_PUBLIC_LANGCHAIN_API_KEY !== undefined
        ) {
          console.warn(
            "[EYEX-AI CẢNH BÁO]: Bạn đã đặt khóa API LangChain của mình một cách công khai. Điều này chỉ nên được thực hiện trong quá trình phát triển cục bộ - hãy nhớ xóa nó trước khi triển khai!"
          );
          payload.DEV_LANGCHAIN_TRACING = {
            LANGCHAIN_TRACING_V2: "true",
            LANGCHAIN_API_KEY: process.env.NEXT_PUBLIC_LANGCHAIN_API_KEY,
            LANGCHAIN_PROJECT: process.env.NEXT_PUBLIC_LANGCHAIN_PROJECT,
          };
        }
        worker.current?.postMessage(payload);
        const onMessageReceived = async (e: any) => {
          switch (e.data.type) {
            case "log":
              console.log(e.data);
              break;
            case "init_progress":
              if (initProgressToastId.current === null) {
                initProgressToastId.current = toast(
                  "[EyeX-AI THÔNG BÁO]: Tôi đang tải trọng lượng mô hình... Quá trình này có thể mất một lúc, xin vui lòng chờ đợi!",
                  {
                    progress: e.data.data.progress,
                    theme: "light"
                  }
                );
              } else {
                if (e.data.data.progress === 1) {
                  await new Promise((resolve) => setTimeout(resolve, 2000));
                }
                toast.update(initProgressToastId.current, { progress: e.data.data.progress });
              }
              break
            case "chunk":
              controller.enqueue(e.data.data);
              break;
            case "error":
              worker.current?.removeEventListener("message", onMessageReceived);
              console.log(e.data.error);
              const error = new Error(e.data.error);
              controller.error(error);
              break;
            case "complete":
              worker.current?.removeEventListener("message", onMessageReceived);
              controller.close();
              break;
          }
        };
        worker.current?.addEventListener("message", onMessageReceived);
      },
    });

  }

  async function sendMessage(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (isLoading || !input) {
      return;
    }

    const initialInput = input;
    const initialMessages = [...messages];
    const newMessages = [...initialMessages, { role: "human" as const, content: input }];

    setMessages(newMessages)
    setIsLoading(true);
    setInput("");

    try {
      const stream = await queryStore(newMessages);
      const reader = stream.getReader();

      let chunk = await reader.read();

      const aiResponseMessage: ChatWindowMessage = {
        content: "",
        role: "ai" as const,
      };

      setMessages([...newMessages, aiResponseMessage]);

      while (!chunk.done) {
        aiResponseMessage.content = aiResponseMessage.content + chunk.value;
        setMessages([...newMessages, aiResponseMessage]);
        chunk = await reader.read();
      }

      setIsLoading(false);
    } catch (e: any) {
      setMessages(initialMessages);
      setIsLoading(false);
      setInput(initialInput);
      toast(`[EyeX-AI CẢNH BÁO]: Tôi đã xảy ra sự cố khi truy vấn tệp PDF của bạn: ${e.message}`, {
        theme: "light",
      });
    }
  }

  // 
  useEffect(() => {
    if (!worker.current) {
      // call worker
      worker.current = new Worker(new URL('../app/worker.ts', import.meta.url), {
        type: 'module',
      });
      setIsLoading(false);
    }
  }, []);

  async function embedPDF (e: FormEvent<HTMLFormElement>) {
    console.log(e);
    console.log(selectedPDF);
    e.preventDefault();
    // const reader = new FileReader();
    if (selectedPDF === null) {
      toast(`[EyeX-AI THÔNG BÁO[: Bạn phải chọn một tập tin để nhúng.`, {
        theme: "light",
      });
      return;
    }
    
    setIsLoading(true);
    worker.current?.postMessage({ pdf: selectedPDF });

    const onMessageReceived = (e: any) => {
      switch (e.data.type) {
        case "log":
          console.log(e.data);
          break;
        case "error":
          worker.current?.removeEventListener("message", onMessageReceived);
          setIsLoading(false);
          console.log(e.data.error);
          toast(`[EyeX-AI CẢNH BÁO]: Tôi đã xảy ra sự cố khi nhúng tệp PDF của bạn: ${e.data.error}`, {
            theme: "light",
          });
          break;
        case "complete":
          worker.current?.removeEventListener("message", onMessageReceived);
          setIsLoading(false);
          setReadyToChat(true);
          toast(`[EyeX-AI Thông báo]: Quá trình nhúng thành công! Hãy đặt câu hỏi cho tôi ngay nào.`, {
            theme: "light",
          });
          break;
      }
    };
    worker.current?.addEventListener("message", onMessageReceived);
  }

  

const handleMicrophoneClick = () => {
  // Implement microphone recording logic here
  console.log('Microphone clicked');
};

  const choosePDFComponent = (
    <>
      <div className="p-4 md:p-8 rounded bg-[#25252d] w-full max-h-[85%] overflow-hidden flex flex-col">
        
      {/* <video
  className="absolute top-0 left-0 w-full h-full"
  src="https://archive.org/download/intro_vid/intro_vid.mp4"
  // controls
  autoPlay
  loop
  muted
  playsInline
  style={{ objectFit: 'cover' }} // Sử dụng style để thiết lập object-fit
  // poster="logo_com.png"
></video>
         */}

        <h1 className="text-3xl md:text-4xl mb-2 ml-auto mr-auto">
          {emoji} EyeX-AI: {browserOnly ? "Sáng tạo, Học hỏi. Tri thức của bạn, Sức mạnh của chúng tôi" : "Mở ra thế giới tri thức mới, sự sáng tạo không giới hạn!"} 
        </h1>
        <div className="my-4 rounded border p-2 ml-auto mr-auto">
          <label htmlFor="one">
            <input id="one" type="checkbox" checked={browserOnly} onChange={(e) => setBrowserOnly(e.target.checked)}/>
            Chế độ chỉ dành cho trình duyệt
          </label>
        </div>
        <ul>
          <li className="text-l">
            {/* 🏡 */}
            <span className="inline-block ml-2">
              Mô hình trò chuyện cùng trợ lý EyeX-AI cung cấp khả năng triển khai tài liệu hoàn toàn trên {browserOnly ? "cục bộ của trình duyệt" : "cục bộ"}!
              {/* Yes, it&apos;s another LLM-powered chat over documents implementation... but this one is entirely {browserOnly ? "local in your browser" : "local"}! */}
            </span>
          </li>
          <li className="hidden text-l md:block">
            {/* 🌐 */}
            <span className="ml-2">
              Kho lưu trữ và nhúng hoàn toàn chạy trong trình duyệt của bạn mà không cần thiết lập.
              {/* The vector store (<a target="_blank" href="https://github.com/tantaraio/voy">Voy</a>) and embeddings (<a target="_blank" href="https://huggingface.co/docs/transformers.js/index">Transformers.js</a>) are served via Vercel Edge function and run fully in the browser with no setup required. */}
            </span>
          </li>
          {browserOnly 
            ? (
              <li>
                {/* ⚙️ */}
                <span className="inline-block ml-2">
                  Mô hình LLM mặc định dựa trên cấu trúc Phi-2 <a href="https://webllm.mlc.ai/">WebLLM</a>.
                  Tại lần đầu tiên khởi động, ứng dụng sẽ tự động tải trọng số xuống và lưu trữ chúng trong trình duyệt của bạn.
                </span>
              </li>
            ) 
            : (
                <li>
                  {/* ⚙️ */}
                  <span className="inline-block ml-2">
                    Mô hình LLM mặc định dựa trên cấu trúc Mistral-7B do Ollama chạy cục bộ. Bạn sẽ cần cài đặt <a target="_blank" href="https://ollama.ai">ứng dụng máy tính để bàn Ollama</a> và chạy các lệnh sau để cấp quyền truy cập vào mô hình chạy cục bộ:
                    <br/>
                    <pre className="inline-flex px-2 py-1 my-2 rounded">$ OLLAMA_ORIGINS=https://eyex_ai.vercel.app OLLAMA_HOST=127.0.0.1:11434 ollama serve
                    </pre>
                    <br/>
                    Sau đó, tại một terminal thứ hai:
                    <br/>
                    <pre className="inline-flex px-2 py-1 my-2 rounded">$ OLLAMA_HOST=127.0.0.1:11434 ollama pull mistral</pre>
                  </span>
                </li>
              )
          }
          {browserOnly && (
              <li>
                {/* 🏋️ */}
                <span className="ml-2">
                Kích thước bộ não có thể chiếm vài GB nên có thể sẽ mất một chút thời gian. Hãy chắc chắn rằng bạn có kết nối internet tốt!
                </span>
              </li>
          )}
          <li>
            {/* 🧠 */}
            <span className="inline-block ml-2">
              Các bộ não xử lý mặc định được chọn với tiêu chuẩn cơ bản. Để nhận nội dung xử lý chất lượng cao hơn và tùy chỉnh cảm xúc, bạn có thể thay đổi trong chương trình của chúng tôi.
              {/* The default embeddings are <pre className="inline-flex px-2 py-1 my-2 rounded">&quot;Xenova/all-MiniLM-L6-v2&quot;</pre>. For higher-quality embeddings on machines that can handle it, switch to <pre className="inline-flex px-2 py-1 my-2 rounded">nomic-ai/nomic-embed-text-v1</pre> in <pre className="inline-flex px-2 py-1 my-2 rounded">app/worker.ts</pre>. */}
            </span>
          </li>

          <li className="hidden text-l md:block">
            {/* 🦜 */}
            <span className="ml-2">
              Xin chân thành cảm ơn
              <a target="_blank" href="https://js.langchain.com"> LangChain.js</a> đã xử lý sự phối hợp và gắn kết mọi thứ lại với nhau!
            </span>
          </li>
          <li className="text-l">
            {/* © */}
            <span className="ml-2">
              Xin chân thành cảm ơn mã nguồn mở - bạn có thể xem mã nguồn và
              tùy chỉnh, triển khai phiên bản của riêng bạn{" "}
              <a
                href="https://github.com/langchain-ai/langchain-nextjs-template"
                target="_blank"
              >
                từ kho lưu trữ
              </a>
              !
            </span>
          </li>
          <li className="text-l">
            {/* 🔘 */}
            <span className="inline-block ml-2">
              Hãy gửi tệp PDF cho EyeX-AI, tinh chỉnh và đặt câu hỏi cho chúng! Để đảm bảo riêng tư, hãy tắt Network và Internet của bạn{browserOnly && " sau khi tải xuống mô hình ban đầu"}.
            </span>
          </li>

          {/* <li className="text-l">
            <span className="ml-2">
              EyeX-AI có thể phạm sai lầm, chúng tôi vẫn đang cố gắng để cải tiến.
            </span>
          </li> */}

          <li className="text-l" style={{ position: 'fixed', bottom: '0', left: '0', width: '100%', textAlign: 'center' }}>
              <span className="ml-4">
                  EyeX-AI có thể phạm sai lầm, chúng tôi vẫn đang cố gắng để cải thiện.
              </span>
          </li>


          <li className="text-l">
            <span className="ml-2">
              NaVin AIF ©2021-2024
            </span>
          </li>

          


        </ul>
          
      

      </div>
      <form onSubmit={embedPDF} className="mt-4 flex text-white justify-between items-center w-full">
        {/* <input id="file_input" type="file" accept="pdf" className="text-white" onChange={(e) => e.target.files ? setSelectedPDF(e.target.files[0]) : null}></input> */}
        <label htmlFor="file_input" className="mt-4 flex text-white justify-between items-center w-ful h-10  bg-green-700 text-white px-8 py-4 rounded cursor-pointer text-center">
          Chọn tệp PDF
        </label>
          <input id="file_input" type="file" accept="pdf" className="hidden" onChange={(e) => e.target.files ? setSelectedPDF(e.target.files[0]) : null} />

        <button type="submit" className="shrink-0 px-8 py-4 bg-green-700 rounded w-30">
          <div role="status" className={`${isLoading ? "" : "hidden"} flex justify-center`}>
            <svg aria-hidden="true" className="w-6 h-6 text-white animate-spin dark:text-white fill-green-500" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
            </svg>
            <span className="sr-only">Loading...</span>
          </div>
          <span className={isLoading ? "hidden" : ""}>Nhúng tệp</span>
        </button>
      </form>

      {/* <section class="h-[calc(100vh-140px)] min-h-[600px] bg-[color:var(--gray-900)] -mt-64 md:-mt-80 relative flex items-center" id="overview">
        <video class="absolute top-0 left-0 w-full h-full object-cover" src="https://cdn.openai.com/tmp/s/paper-planes.mp4" autoplay="" loop="" muted="" playsinline=""></video>
        <div class="absolute top-0 right-0 bottom-0 left-0 pointer-events-none bg-[rgba(0,0,0,0.45)]"></div>
        <div class="container relative pt-spacing-7 pb-spacing-9 text-center text-[color:var(--gray-000)] font-sans">
          <h1 class="sr-only">Sora</h1>
          <h2 class="f-display-2 w-10/12 mx-auto text-balance"> Creating video from text </h2>
          <p class="f-subhead-1 w-10/12 max-w-[670px] mx-auto mt-spacing-4"> Sora is an AI model that can create realistic and imaginative scenes from text instructions. </p>
          <a class="bg-[rgba(0,0,0,0.2)] backdrop-blur-md text-[color:var(--gray-000)] rounded-full f-body-1 mt-spacing-4 flex items-center py-[13px] px-16 mx-auto w-fit hover:bg-[rgba(255,255,255,0.2)]" href="/research/video-generation-models-as-world-simulators"> Read technical report </a>
          <div class="absolute text-[color:var(--gray-000)] bottom-16 max-w-[380px] left-1/2 -translate-x-1/2 text-center pb-spacing-4 w-10/12 f-ui-1"> All videos on this page were generated directly by Sora without modification. </div>
          </div>
          <button class="items-center gap-x-8 absolute right-24 bottom-[36px] rounded-full leading-none px-16 bg-[rgba(0,0,0,0.2)] backdrop-blur-md text-[color:var(--gray-000)] h-[44px] f-body-1 hover:bg-[rgba(255,255,255,0.2)] hidden md:flex">
            <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" class="a-icon--pause400 relative" style="width:16px;height:16px;" data-new="" data-v-e1bdab2c="">
              <g data-v-e1bdab2c="" fill="currentColor">
                <rect x="9.81" y="2" width="1.38" height="12"></rect>
                <rect x="4.81" y="2" width="1.38" height="12"></rect>
                </g>
                </svg>
                <span>Pause</span>
                </button>
                </section> */}

{/* <div className="relative"> */}
      <video
      className="absolute top-0 left-0 w-full h-full object-cover"
      src="https://archive.org/download/intro_vid/intro_vid.mp4"
      autoPlay
      loop
      muted
      playsInline
      style={{ clipPath: 'inset(0 0 10% 0)' , zIndex: -1 }} // Đặt zIndex để đảm bảo video ở phía sau các phần tử khác
    />
    {/* <button className="items-center gap-x-8 absolute right-24 bottom-[36px] rounded-full leading-none px-16 bg-[rgba(0,0,0,0.2)] backdrop-blur-md text-[color:var(--gray-000)] h-[44px] f-body-1 hover:bg-[rgba(255,255,255,0.2)] hidden md:flex">
    <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="a-icon--pause400 relative" style={{ width: '16px', height: '16px' }}>
      <g fill="currentColor">
        <rect x="9.81" y="2" width="1.38" height="12"></rect>
        <rect x="4.81" y="2" width="1.38" height="12"></rect>
      </g>
    </svg>
    <span>Pause</span>
  </button> */}
  {/* </div> */}

    </>
  );

  const chatInterfaceComponent = (
    <>
      <div className="flex flex-col-reverse w-full mb-4 overflow-auto grow">
        {messages.length > 0 ? (
          [...messages]
            .reverse()
            .map((m, i) => (
              <ChatMessageBubble
                key={i}
                message={m}
                aiEmoji={emoji}
                onRemovePressed={() => setMessages(
                  (previousMessages) => {
                    const displayOrderedMessages = previousMessages.reverse();
                    return [...displayOrderedMessages.slice(0, i), ...displayOrderedMessages.slice(i + 1)].reverse();
                  }
                )}
              ></ChatMessageBubble>
            ))
        ) : (
          ""
        )}
      </div>

      <form onSubmit={sendMessage} className="flex w-full flex-col">
        <div className="flex w-full mt-4"> 
          <input
            className="grow mr-8 p-4 rounded"
            value={input}
            // color="secondary"
            // focused
            placeholder={placeholder ?? "What would it be like to become a pirate king?"}
            onChange={(e) => setInput(e.target.value)}
            // variant="standard"
          />
          {/* <Image src="public/micro-phone.png" alt="Microphone" width={20} height={20} /> */}
          {/* <button className="send-button">Gửi</button> */}
          
          <button type="submit" className="shrink-0 px-8 py-4 text-white bg-green-600 rounded w-28">
            <div role="status" className={`${isLoading ? "" : "hidden"} flex justify-center`}>
              <svg aria-hidden="true" className="w-6 h-6 text-white animate-spin dark:text-white fill-green-500" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                  <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
              </svg>
              <span className="sr-only">Loading...</span>
            </div>
            <span className={isLoading ? "hidden" : ""}>Gửi</span>
          </button>
          
        </div>
      </form>


      
    </>
  );
  

  return (
    
    <div className={`flex flex-col text-white items-center p-4 md:p-8 rounded grow overflow-hidden ${(readyToChat ? "border" : "")}`}>
      {/* đang chỉnh sửa  */}
     {/* <video id="backgroundVideo" autoplay muted loop playsInline> */}
      {/* <source src="components/intro_vid.mp4" type="video/mp4" /> */}
    {/* </video> */}
    {/* <video controls  width="100%" className="videoPlayer" src="https://archive.org/download/intro_vid/intro_vid.mp4"></video> */}
    {/* <video className="absolute top-0 left-0 w-full h-full object-fit" src="https://archive.org/download/intro_vid/intro_vid.mp4" autoplay loop muted playsinline></video> */}
    {/* <video className="videoPlayer" src="video/intro_vid.mp4" autoPlay loop playsInline /> */}
      <h2 className={`${readyToChat ? "" : "hidden"} text-2xl`}>{emoji} {titleText}</h2>
      {readyToChat
        ? chatInterfaceComponent
        : choosePDFComponent}
      <ToastContainer/>      
    </div>
  );
}