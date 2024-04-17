# EyeX-AI

EyeX-AI là một model AI có thể tận dụng sức mạnh những kiến thức từ các khung của model khác, đọc nội dung của tài liệu, hiểu nó, RAG,... Tất cả diễn ra tại cục bộ và thậm chí không cần kết nối internet.

![](/public/images/final_eyex.gif)

Về cơ bản, nó không hề có bất cứ tệp model nào, EyeX là một ứng dụng được xây dựng dựa trên Next.js với khả năng đọc nội dung của tệp PDF, tài liệu của bạn sau đó nhờ [LangChain.js](https://js.langchain.com) chia nhỏ nó, thêm nó vào kho lưu trữ vectơ và
thực hiện RAG,... tất cả đều diễn ra tại local.

Khách hàng có thể truy cập thử nghiệm tại địa chỉ của chúng tôi: [EyeX-AI](https://eyex-ai.vercel.app)

Người dùng có thể chọn một trong các tùy chọn bên dưới để chạy suy luận:

## Setup
Bạn chỉ cần clone repo này và cài đặt các phần phụ thuộc cần thiết bằng `yarn`.
Đoạn mã minh họa sau:
```bash
git clone https://github.com/kyoo-147/EyeX-AI.git
cd eyex-ai
yarn install
# optional
yarn run dev
```
### Chế độ suy luận qua trình duyệt
Options 1: [WebLLM](https://webllm.mlc.ai/). Mô hình được sử dụng là tham số nhỏ 2,7B [Phi-2](https://huggingface.co/microsoft/phi-2). Bạn chỉ cần tải lên bản PDF của bạn và bắt đầu cuộc trò chuyện với chúng tôi!
* Lưu ý: Đối với lần đầu, ứng dụng sẽ tải xuống và lưu trọng số mô hình vào bộ nhớ đệm. Quá trình này có thể mất một ít thời gian, xin hãy kiên nhẫn và đảm bảo một kết nói thật tốt.

### Suy luận tại máy chủ cục bộ của bạn
Options 2: Sử dụng sự hỗ trợ của [Ollama local](https://ollama.ai) nhờ vào sự tiện dụng và đa dạng, hiệu suất cao. Người dùng sẽ chỉ cần tải xuống và thiết lập các yêu cầu đơn giản, nhập các lệnh sau để thiết lập các biến cục bộ cho phép truy cập máy chủ Ollama đang hoạt động:
### Linux
```bash
$ OLLAMA_ORIGINS=https://eyex-ai.vercel.app OLLAMA_HOST=127.0.0.1:11434 ollama serve
```
Nếu terminal thông báo địa chỉ đã được sử dụng rồi, bạn có thể tiếp tục chạy nó hoặc tắt bằng lệnh:
```bash
$ systemctl stop ollama
```
Sau đó, tại một cửa sổ terminal khác, hãy chọn model với hiệu suất tốt nhất đối với bạn:
```bash
$ OLLAMA_HOST=127.0.0.1:11434 ollama pull mistral
```

### Windows
```cmd
$ set OLLAMA_ORIGINS=https://eyex-ai.vercel.app
set OLLAMA_HOST=127.0.0.1:11434
ollama serve
```
Sau đó, tại một cửa sổ terminal khác:
```cmd
$ set OLLAMA_HOST=127.0.0.1:11434
ollama pull mistral
```
- Để hiệu suất nhúng đạt chất lượng cao hơn, bạn hoàn toàn có thể chuyển qua các model khác: ví dụ `"nomic-ai/nomic-embed-text-v1"` trong `app/worker.ts`.

<!-- Mặc dù mục tiêu là chạy trực tiếp nhiều ứng dụng nhất có thể trong trình duyệt nhưng bạn có thể chuyển đổi trong [Ollama embeddings](https://js.langchain.com/docs/modules/data_connection/text_embedding/integrations/ollama) thay cho Transformers.js. -->

## Phát triển
Không có biến môi trường bắt buộc, nhưng bạn có thể tùy ý thiết lập [LangSmith tracing](https://smith.langchain.com/) trong khi phát triển cục bộ để giúp gỡ lỗi các lời nhắc và chuỗi. Sao chép `.env.example` tập tin vào một tệp `.env.local`:

```ini
# Không cần biến môi trường!
# Truy tìm LangSmith từ web worker.
# CẢNH BÁO: CHỈ DÀNH CHO PHÁT TRIỂN. KHÔNG TRIỂN KHAI PHIÊN BẢN TRỰC TIẾP VỚI NHỮNG PHIÊN BẢN NÀY
# CÁC BIẾN ĐẶT KHI BẠN SẼ Rò rỉ KHÓA API LANGCHAIN CỦA MÌNH.
NEXT_PUBLIC_LANGCHAIN_TRACING_V2="true"
NEXT_PUBLIC_LANGCHAIN_API_KEY=
NEXT_PUBLIC_LANGCHAIN_PROJECT=
```
### Đọc tiếp
- Chúng tôi rất tiếc vì sự chậm trễ, chúng tôi vẫn đang cố gắng hoàn thành bản kĩ thuật chi tiết
- Mô hình có thể sai sót, hãy kiểm tra lại thông tin trước khi tin vào EyeX-AI
- Giọng nói và khả năng nghe của EyeX-AI đã được đưa vào quá trình triển khai. 
- Rất mong được sự ủng hộ từ các khách hàng
### Giấy phép
Mã nguồn EyeX-AI và mô hình được phát hành theo Giấy phép MIT. Xem [MIT License](https://opensource.org/licenses/MIT) để biết thêm chi tiết.