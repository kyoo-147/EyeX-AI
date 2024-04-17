// # !/usr/bin/env python3
// # -*- encoding: utf-8 -*-
// # Copyright EyeX-AI. All Rights Reserved.
// # NaVin AIF Technology
// # MIT License  (https://opensource.org/licenses/MIT)

import {
        SimpleChatModel,
        type BaseChatModelParams,
                              } from "@langchain/core/language_models/chat_models";
import { ChatGenerationChunk } from "@langchain/core/outputs";
import { BaseMessage, AIMessageChunk } from "@langchain/core/messages";
import { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager";
import type { BaseLanguageModelCallOptions } from "@langchain/core/language_models/base";
import {
        ChatModule,
        type ChatCompletionMessageParam,
        type ModelRecord,
        InitProgressCallback,
                              } from "@mlc-ai/web-llm";

/**
 * modelPath: required parameter
 */
export interface WebLLMInputs extends BaseChatModelParams {
  modelRecord: ModelRecord;
  temperature?: number;
}

export interface WebLLMCallOptions extends BaseLanguageModelCallOptions {}

/**
 *  Install module `@mlc-ai/web-llm` needed.
 *  By `npm install -S @mlc-ai/web-llm`
 * @example
 * ```typescript
 * // Initialize the ChatWebLLM model with the model record.
 * const model = new ChatWebLLM({
 *   modelRecord: {
 *     "model_url": "https://huggingface.co/mlc-ai/phi-2-q4f32_1-MLC/resolve/main/",
 *     "local_id": "Phi2-q4f32_1",
 *     "model_lib_url": "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/phi-2/phi-2-q4f32_1-ctx2k-webgpu.wasm",
 *     "vram_required_MB": 4032.48,
 *     "low_resource_required": false,
 *   },
 *   temperature: 0.5,
 * });
 *
 * // Call model ex
 * const response = await model.invoke([
 *   new HumanMessage({ content: "My name is EyeX-AI." }),
 * ]);
 * ```
 */
// const model = new ChatWebLLM({
//    modelRecord: {
//      "model_url": "https://huggingface.co/mlc-ai/phi-2-q4f32_1-MLC/resolve/main/",
//      "local_id": "Phi2-q4f32_1",
//      "model_lib_url": "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/phi-2/phi-2-q4f32_1-ctx2k-webgpu.wasm",
//      "vram_required_MB": 4032.48,
//      "low_resource_required": false,
//    },
//    temperature: 0.5,
//  });

//  // Call model ex
// const response = await model.invoke([
//    new HumanMessage({ content: "My name is EyeX-AI." }),
// ]);

export class ChatWebLLM extends SimpleChatModel<WebLLMCallOptions> {
  static inputs: WebLLMInputs;

  protected _chatModule: ChatModule;

  modelRecord: ModelRecord;

  temperature?: number;

  static lc_name() {
    return "ChatWebLLM";
  }

  constructor(inputs: WebLLMInputs) {
    super(inputs);
    this._chatModule = new ChatModule();
    this.modelRecord = inputs.modelRecord;
    this.temperature = inputs.temperature;
  }

  _llmType() {
    return "web-llm";
  }

  async initialize(progressCallback?: InitProgressCallback) {
    if (progressCallback !== undefined) {
      this._chatModule.setInitProgressCallback(progressCallback);
    }
    await this._chatModule.reload(this.modelRecord.local_id, undefined, {
      model_list: [this.modelRecord],
    });
    this._chatModule.setInitProgressCallback(() => {});
  }

  async *_streamResponseChunks(
    messages: BaseMessage[],
    options: this["ParsedCallOptions"],
    runManager?: CallbackManagerForLLMRun,
  ): AsyncGenerator<ChatGenerationChunk> {
    await this.initialize();

    // check input
    const messagesInput: ChatCompletionMessageParam[] = messages.map(
      (message) => {
        if (typeof message.content !== "string") {
          throw new Error(
            "EyeX Announced: ChatWebLLM không hỗ trợ nội dung tin nhắn không phải chuỗi trong phiên.",
          );
        }
        // assigns role 
        const langChainType = message._getType();
        let role;
        if (langChainType === "ai") {
          role = "assistant" as const;
        } else if (langChainType === "human") {
          role = "user" as const;
        } else if (langChainType === "system") {
          role = "system" as const;
        } else {
          throw new Error(
            "EyeX Announced: Chức năng, công cụ và thông báo chung không được hỗ trợ.",
          );
        }
        return {
          role,
          content: message.content,
        };
      },
    );
    
    // response loop
    const stream = this._chatModule.chatCompletionAsyncChunkGenerator(
      {
        stream: true,
        messages: messagesInput,
        stop: options.stop,
        temperature: this.temperature,
      },
      {},
    );

    for await (const chunk of stream) {
      const text = chunk.choices[0].delta.content ?? "";
      yield new ChatGenerationChunk({
        text,
        message: new AIMessageChunk({
          content: text,
          additional_kwargs: {
            logprobs: chunk.choices[0].logprobs,
          },
        }),
      });
      await runManager?.handleLLMNewToken(text ?? "");
    }
  }

  // call model - gen response
  async _call(
    messages: BaseMessage[],
    options: this["ParsedCallOptions"],
    runManager?: CallbackManagerForLLMRun,
  ): Promise<string> {
    const chunks = [];
    for await (const chunk of this._streamResponseChunks(
      messages,
      options,
      runManager,
    )) {
      chunks.push(chunk.text);
    }
    return chunks.join("");
  }
}
