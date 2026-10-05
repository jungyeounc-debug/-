export interface ChatSpace {
  name: string; // e.g. "spaces/AAAA..."
  displayName?: string;
  type?: string;
  spaceType?: string;
  singleUserBotDm?: boolean;
}

export interface ChatMessage {
  name: string;
  sender?: {
    name: string;
    displayName?: string;
    type?: string;
  };
  text?: string;
  createTime: string;
}

export const listChatSpaces = async (accessToken: string): Promise<ChatSpace[]> => {
  const response = await fetch('https://chat.googleapis.com/v1/spaces', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Google Chat 스페이스 목록 조회 실패 (${response.status})`
    );
  }

  const data = await response.json();
  return (data.spaces || []) as ChatSpace[];
};

export const sendChatMessage = async (
  accessToken: string,
  spaceName: string,
  text: string
): Promise<ChatMessage> => {
  const response = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Google Chat 메시지 전송 실패 (${response.status})`
    );
  }

  return (await response.json()) as ChatMessage;
};

export const listRecentMessages = async (
  accessToken: string,
  spaceName: string,
  pageSize = 10
): Promise<ChatMessage[]> => {
  const response = await fetch(
    `https://chat.googleapis.com/v1/${spaceName}/messages?pageSize=${pageSize}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `메시지 목록 조회 실패 (${response.status})`
    );
  }

  const data = await response.json();
  return (data.messages || []) as ChatMessage[];
};
