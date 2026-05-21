import { api } from "./api.js";

export function initChatbot() {
  const chatBtn = document.getElementById("chat-toggle");
  const chatWindow = document.getElementById("chat-window");
  const closeBtn = document.getElementById("chat-close");
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const chatMessages = document.getElementById("chat-messages");
  const chatSubmit = document.getElementById("chat-submit");

  if (!chatBtn || !chatWindow || !closeBtn) return;

  // --- PERSISTENCE LOGIC ---
  let chatHistory = [];
  try {
    const saved = localStorage.getItem("ai_chat_history");
    if (saved) {
      chatHistory = JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load chat history", e);
  }

  const saveHistory = () => {
    localStorage.setItem("ai_chat_history", JSON.stringify(chatHistory));
  };

  const toggleChat = () => {
    const isHidden = chatWindow.classList.toggle("hidden");
    localStorage.setItem("ai_chat_open", (!isHidden).toString());

    if (!isHidden) {
      // Scroll to bottom when opening
      setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }, 100);
    }
  };

  chatBtn.addEventListener("click", toggleChat);
  closeBtn.addEventListener("click", toggleChat);

  const appendMessage = (text, isUser = false, addToHistory = true) => {
    const msgDiv = document.createElement("div");
    msgDiv.className = `flex items-end gap-2 mb-2 ${isUser ? "justify-end" : "justify-start"}`;

    let avatarHTML = "";
    if (!isUser) {
      avatarHTML = `
            <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white shrink-0 shadow-sm border border-white/20">
                <span class="text-[10px] font-black">AI</span>
            </div>`;
    }

    // 1. Parse Basic Markdown (Bold, Italic)
    let parsedText = text;
    parsedText = parsedText.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    parsedText = parsedText.replace(/\*(.*?)\*/g, "<em>$1</em>");

    // 2. Parse Action Buttons
    // SAFETY GUARD: Only parse links with NUMERIC IDs (real DB IDs).
    // Links with non-numeric IDs (e.g. MKE004) are fabricated by LLM and removed.
    parsedText = parsedText.replace(
      /\[🛒 ([^\]]+)\]\(\/cart\/add\/(\d+)\)/g,
      '<button onclick="window.addToCart($2)" class="mt-2 mr-1 inline-block px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-lg transition">🛒 $1</button>',
    );

    // Remove any cart links with NON-numeric IDs (LLM fabricated) before further processing
    parsedText = parsedText.replace(
      /\[🛒 [^\]]+\]\(\/cart\/add\/[^\d][^)]*\)/g,
      "",
    );

    parsedText = parsedText.replace(
      /\[🔍 ([^\]]+)\]\(\/product\/(\d+)\)/g,
      '<a href="/product/$2" class="mt-2 inline-block px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition">🔍 $1</a>',
    );

    // Remove any product links with NON-numeric IDs (LLM fabricated) before further processing
    parsedText = parsedText.replace(
      /\[🔍 [^\]]+\]\(\/product\/[^\d][^)]*\)/g,
      "",
    );

    parsedText = parsedText.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-primary-600 underline">$1</a>',
    );

    // 3. Process Markdown Tables robustly -> render as proper HTML table
    if (parsedText.includes("|")) {
      const lines = parsedText.split("\n");
      let resultLines = [];
      let inTable = false;
      let tableHTML =
        '<div class="overflow-x-auto w-full my-2"><table class="w-full text-xs border-collapse border border-slate-200 rounded-lg overflow-hidden">';
      let isFirstDataRow = true;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Separator line (e.g. |---|---|): marks end of header
        if (
          line.match(/^\|?[-:\s|]+\|?$/) &&
          line.includes("|") &&
          line.includes("-")
        ) {
          // switch from thead to tbody
          if (inTable) tableHTML += "</thead><tbody>";
          continue;
        }

        // Table data row
        if (
          line.startsWith("|") ||
          (line.includes("|") && line.split("|").length > 2)
        ) {
          const cols = line
            .split("|")
            .map((c) => c.trim())
            .filter((c) => c !== "");
          if (cols.length > 0) {
            if (!inTable) {
              // Flush any text before table
              if (resultLines.length) {
                resultLines.push("");
              }
              inTable = true;
              isFirstDataRow = true;
              tableHTML =
                '<div class="overflow-x-auto w-full my-2"><table class="w-full text-xs border-collapse border border-slate-200 rounded-lg overflow-hidden"><thead>';
            }
            const tag = isFirstDataRow ? "th" : "td";
            const rowClass = isFirstDataRow
              ? "bg-orange-50"
              : i % 2 === 0
                ? "bg-white"
                : "bg-slate-50/50";
            tableHTML += `<tr class="${rowClass}">`;
            cols.forEach((c) => {
              tableHTML += `<${tag} class="border border-slate-200 px-2 py-1.5 text-left font-${isFirstDataRow ? "bold" : "normal"} text-slate-700 whitespace-normal">${c}</${tag}>`;
            });
            tableHTML += "</tr>";
            isFirstDataRow = false;
            continue;
          }
        }

        // Non-table line: flush table if open
        if (inTable) {
          tableHTML += "</tbody></table></div>";
          resultLines.push(tableHTML);
          inTable = false;
        }
        resultLines.push(lines[i]);
      }

      // Close any open table at end
      if (inTable) {
        tableHTML += "</tbody></table></div>";
        resultLines.push(tableHTML);
      }

      parsedText = resultLines.join("\n");
    }

    // 4. Simple line break replacement
    parsedText = parsedText.replace(/\n/g, "<br/>");

    const bubbleHTML = `
            <div class="${
              isUser
                ? "bg-slate-900 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-sm max-w-[85%]"
                : "bg-white border border-slate-100 text-slate-700 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm w-full"
            } text-sm leading-relaxed break-words">
                ${parsedText}
            </div>
        `;

    msgDiv.innerHTML = avatarHTML + bubbleHTML;
    chatMessages.appendChild(msgDiv);

    // Improved scrolling
    requestAnimationFrame(() => {
      chatMessages.scrollTo({
        top: chatMessages.scrollHeight,
        behavior: "smooth",
      });
    });

    if (addToHistory) {
      chatHistory.push({
        role: isUser ? "user" : "model",
        parts: [{ text: text }],
      });
      saveHistory();
    }
  };

  window.sendChatMessage = (text) => {
    chatInput.value = text;
    chatForm.dispatchEvent(new Event("submit"));
  };

  const loadChatHistory = () => {
    chatMessages.innerHTML = "";
    if (chatHistory.length === 0) {
      appendMessage(
        "Chào anh/chị! Em là trợ lý ảo của MindCard. Em có thể giúp gì cho mình trong việc tìm kiếm và lựa chọn sản phẩm công nghệ không ạ? 😊",
        false,
        false,
      );
    } else {
      chatHistory.forEach((msg) => {
        const text = msg.parts[0].text;
        const isUser = msg.role === "user";
        appendMessage(text, isUser, false);
      });
    }
  };

  const showLoading = () => {
    const div = document.createElement("div");
    div.id = "chat-loading";
    div.className = "flex items-start";
    div.innerHTML = `
            <div class="w-6 h-6 rounded-full bg-primary-100 text-primary-600 mr-2 flex-shrink-0 opacity-50"></div>
            <div class="bg-white p-3 rounded-2xl rounded-tl-sm shadow-sm border border-slate-100 text-sm text-slate-400">
                <span class="animate-pulse">Đang gõ...</span>
            </div>
        `;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  const hideLoading = () => {
    const loader = document.getElementById("chat-loading");
    if (loader) loader.remove();
  };

  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    appendMessage(text, true);
    chatInput.value = "";
    chatInput.disabled = true;
    chatSubmit.disabled = true;

    showLoading();

    try {
      let userId = null;
      const token = localStorage.getItem("auth_token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        userId = payload.id;
      }

      const data = await api._fetch("/chat", {
        method: "POST",
        body: JSON.stringify({
          message: text,
          history: chatHistory,
          userId: userId,
        }),
      });

      hideLoading();

      // --- PROGRESSIVE CHUNK DELIVERY ---
      // Split the full response into chunks by blank lines (paragraphs)
      const splitIntoChunks = (text) => {
        // Normalize line endings
        const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

        // Split by double newline (paragraph breaks)
        const rawChunks = normalized.split(/\n{2,}/);

        // Filter out empty chunks, trim whitespace
        return rawChunks.map((c) => c.trim()).filter((c) => c.length > 0);
      };

      const chunks = splitIntoChunks(data.reply);

      // Deliver chunks one by one with typing delay
      const deliverChunks = async (chunks) => {
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const isLast = i === chunks.length - 1;

          // Show typing indicator before each chunk (except the very first)
          if (i > 0) {
            showLoading();
            // Delay: 12ms per char, clamped between 350ms and 1000ms
            const delay = Math.min(1000, Math.max(350, chunk.length * 12));
            await new Promise((resolve) => setTimeout(resolve, delay));
            hideLoading();
          }

          // Render this chunk (never auto-save to history mid-stream)
          appendMessage(chunk, false, false);

          // Tiny gap between consecutive chunks for smooth feel
          if (!isLast) {
            await new Promise((resolve) => setTimeout(resolve, 80));
          }
        }

        // Save the FULL original reply to history once all chunks are delivered
        chatHistory.push({ role: "model", parts: [{ text: data.reply }] });
        saveHistory();
      };

      await deliverChunks(chunks);
    } catch (error) {
      hideLoading();
      appendMessage(
        "Hệ thống đang bảo trì một chút, anh/chị thông cảm đợi lát nha 🥵",
        false,
      );
    } finally {
      chatInput.disabled = false;
      chatSubmit.disabled = false;
      chatInput.focus();
    }
  });

  // Initialize UI with history
  loadChatHistory();

  // RESTORE OPEN STATE
  const shouldBeOpen = localStorage.getItem("ai_chat_open") === "true";
  if (shouldBeOpen) {
    chatWindow.classList.remove("hidden");
    // Small delay to ensure render then scroll
    setTimeout(() => {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 300);
  }

  // Expose reset function globally
  window.resetAIChat = () => {
    chatHistory = [];
    loadChatHistory();
  };
}
