import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminChatbotPage from "@/app/(authenticated)/admin/chatbot/page";
import AdminDashboardPage from "@/app/(authenticated)/admin/page";
import StudentChatPage from "@/app/(authenticated)/student/chat/page";
import StudentDashboardPage from "@/app/(authenticated)/student/page";
import {
  getAdminChatbotConfig,
  getChatTranscript,
  listChatThreads,
  sendChatMessage,
  updateAdminChatbotConfig,
} from "@/lib/chat-api";

const normalChatResponse = {
  thread_id: "thread-1",
  student_message: {
    id: "message-student-1",
    thread_id: "thread-1",
    role: "student",
    content: "Hôm nay em thấy áp lực.",
    safety_flagged: false,
    created_at: "2026-05-21T00:00:00Z",
    is_demo: true,
  },
  assistant_message: {
    id: "message-assistant-1",
    thread_id: "thread-1",
    role: "assistant",
    content:
      "Chào em, mình là BeYou — một người bạn hỗ trợ trong ứng dụng. BeYou không thay thế chuyên gia tư vấn hay bác sĩ.\n\nCảm ơn em đã chia sẻ.",
    safety_flagged: false,
    created_at: "2026-05-21T00:00:01Z",
    is_demo: true,
  },
  safety: {
    high_risk: false,
    input_flagged: false,
    output_flagged: false,
    categories: [],
    suggested_action: "supportive_chat",
    sos_suggested: false,
    escalation_message: null,
  },
  provider: { name: "fallback", used_fallback: true },
};

const highRiskChatResponse = {
  ...normalChatResponse,
  assistant_message: {
    ...normalChatResponse.assistant_message,
    id: "message-assistant-risk",
    content:
      "Mình muốn ưu tiên sự an toàn của em ngay lúc này. Nếu em đang thấy không an toàn ngay lúc này, hãy tìm một người lớn tin cậy ở gần em hoặc dùng SOS trong BeYou để người lớn được liên kết biết em cần hỗ trợ.\n\nBeYou v1 không tự động gọi dịch vụ khẩn cấp bên ngoài.",
    safety_flagged: true,
  },
  safety: {
    high_risk: true,
    input_flagged: true,
    output_flagged: false,
    categories: ["self_harm"],
    suggested_action: "suggest_sos_trusted_adult",
    sos_suggested: true,
    escalation_message:
      "Mình muốn ưu tiên sự an toàn của em ngay lúc này. Nếu em đang thấy không an toàn ngay lúc này, hãy tìm một người lớn tin cậy ở gần em hoặc dùng SOS trong BeYou.",
  },
};

const chatbotConfig = {
  id: "config-1",
  high_risk_keywords: ["tự tử", "không muốn sống"],
  escalation_message:
    "Mình muốn ưu tiên sự an toàn của em ngay lúc này. Hãy tìm người lớn tin cậy hoặc dùng SOS trong BeYou.",
  trusted_adult_message: "Nếu có người lớn tin cậy ở gần em, hãy nói với họ rằng em cần được ở cùng ngay bây giờ.",
  first_response_disclaimer:
    "Chào em, mình là BeYou — một người bạn hỗ trợ trong ứng dụng. BeYou không thay thế chuyên gia tư vấn hay bác sĩ.",
  guardrails_locked: true,
  provider: { name: "fallback", configured: false, using_fallback: true },
  updated_at: "2026-05-21T00:00:00Z",
  is_demo: false,
};

function mockFetch(handler?: (path: string, init?: RequestInit) => unknown) {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    const path = new URL(url).pathname;
    const method = init?.method ?? "GET";
    let body = handler?.(path, init);
    if (body === undefined) {
      if (path === "/api/student/profile") {
        body = {
          id: "student-1",
          full_name: "Nguyễn An Demo",
          email: "student.demo@beyou.local",
          school: "Trường THPT BeYou Demo",
          class_name: "10A1",
          is_demo: true,
          linked_adults: [],
        };
      } else if (path === "/api/student/sos-alerts") {
        body = [];
      } else if (path === "/api/student/chat/threads") {
        body = [];
      } else if (path === "/api/student/chat/messages" && method === "POST") {
        body = normalChatResponse;
      } else if (path === "/api/student/chat/threads/thread-1/messages") {
        body = {
          thread: {
            id: "thread-1",
            title: "Cuộc trò chuyện với BeYou",
            safety_state: "supportive",
            last_message_at: "2026-05-21T00:00:01Z",
            created_at: "2026-05-21T00:00:00Z",
            updated_at: "2026-05-21T00:00:01Z",
            is_demo: true,
          },
          messages: [normalChatResponse.student_message, normalChatResponse.assistant_message],
        };
      } else if (path === "/api/admin/users") {
        body = [{ id: "admin-1" }];
      } else if (path === "/api/admin/links") {
        body = [];
      } else if (path === "/api/admin/chatbot/config") {
        body = chatbotConfig;
      }
    }
    return Promise.resolve(
      new Response(JSON.stringify(body), {
        status: body === undefined ? 404 : 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("Phase 5 chatbot API helpers", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("uses cookie-authenticated backend chat and admin config endpoints without token storage", async () => {
    const localStorageSpy = vi.spyOn(Storage.prototype, "setItem");
    const fetchMock = mockFetch();

    await sendChatMessage({ message: "Hôm nay em thấy áp lực." });
    await listChatThreads();
    await getChatTranscript("thread-1");
    await getAdminChatbotConfig();
    await updateAdminChatbotConfig({
      high_risk_keywords: ["tự tử", "không muốn sống"],
      escalation_message: chatbotConfig.escalation_message,
      trusted_adult_message: chatbotConfig.trusted_adult_message,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/student/chat/messages",
      expect.objectContaining({ credentials: "include", method: "POST" }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/admin/chatbot/config",
      expect.objectContaining({ credentials: "include", method: "PATCH" }),
    );
    expect(localStorageSpy).not.toHaveBeenCalled();
  });
});

describe("Phase 5 student chatbot UI", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("adds student dashboard chat entry and sends a supportive first response", async () => {
    const fetchMock = mockFetch();

    const { rerender } = render(<StudentDashboardPage />);
    expect(await screen.findByRole("link", { name: /Trò chuyện với Peerlight AI/ })).toHaveAttribute(
      "href",
      "/student/chat",
    );
    expect(screen.getByText("Mình có thể lắng nghe và giúp em nghĩ về bước an toàn tiếp theo.")).toBeInTheDocument();

    rerender(<StudentChatPage />);
    expect(await screen.findByText("Trò chuyện với Peerlight AI")).toBeInTheDocument();
    expect(screen.getByText("Chưa có tin nhắn nào. Em có thể bắt đầu bằng một điều nhỏ đang làm em bận lòng.")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Điều em muốn chia sẻ"), "Hôm nay em thấy áp lực.");
    await userEvent.click(screen.getByRole("button", { name: "Gửi chia sẻ" }));

    expect(await screen.findByText(/Chào em, mình là BeYou/)).toBeInTheDocument();
    expect(screen.getAllByText(/không thay thế chuyên gia tư vấn hay bác sĩ/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/api_key|FREEMODEL|secret/i)).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/student/chat/messages",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ message: "Hôm nay em thấy áp lực.", thread_id: null }),
      }),
    );
  });

  it("renders high-risk escalation guidance with SOS trusted-adult CTA", async () => {
    mockFetch((path, init) => {
      if (path === "/api/student/chat/messages" && init?.method === "POST") {
        return highRiskChatResponse;
      }
      return undefined;
    });

    render(<StudentChatPage />);
    await screen.findByText("Trò chuyện với Peerlight AI");
    await userEvent.type(screen.getByLabelText("Điều em muốn chia sẻ"), "Em không muốn sống nữa.");
    await userEvent.click(screen.getByRole("button", { name: "Gửi chia sẻ" }));

    expect(await screen.findByText("Mình muốn ưu tiên sự an toàn của em ngay lúc này")).toBeInTheDocument();
    expect(screen.getAllByText(/người lớn tin cậy|người lớn tin tưởng/).length).toBeGreaterThan(0);
    expect(screen.getByText("BeYou v1 không tự động gọi dịch vụ khẩn cấp bên ngoài.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Đi tới SOS hỗ trợ" })).toHaveAttribute("href", "/student#peerlight-sos");
  });
});

describe("Phase 5 admin chatbot safety UI", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("adds admin config entry and saves safety config without rendering API keys", async () => {
    const fetchMock = mockFetch();

    const { rerender } = render(<AdminDashboardPage />);
    expect(await screen.findByRole("link", { name: /Cấu hình chatbot an toàn/ })).toHaveAttribute(
      "href",
      "/admin/chatbot",
    );

    rerender(<AdminChatbotPage />);
    expect(await screen.findByText("Cấu hình chatbot an toàn")).toBeInTheDocument();
    expect(screen.getByText("Khóa API chỉ được đọc bởi backend. Trang này không hiển thị hoặc lưu khóa API ở trình duyệt.")).toBeInTheDocument();
    expect(screen.queryByText(/api_key|admin-secret-key|FREEMODEL_API_KEY/i)).not.toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText("Từ khóa nguy cơ cao"));
    await userEvent.type(screen.getByLabelText("Từ khóa nguy cơ cao"), "tự tử\nkhông muốn sống\nbị đe dọa");
    await userEvent.click(screen.getByRole("button", { name: "Lưu cấu hình an toàn" }));

    await waitFor(() => expect(screen.getByText("Đã lưu cấu hình an toàn. Guardrail backend vẫn luôn bật.")).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/admin/chatbot/config",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          high_risk_keywords: ["tự tử", "không muốn sống", "bị đe dọa"],
          escalation_message: chatbotConfig.escalation_message,
          trusted_adult_message: chatbotConfig.trusted_adult_message,
        }),
      }),
    );
  });
});
