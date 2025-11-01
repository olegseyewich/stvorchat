const onlineUsers = new Map<string, number>();

export const setUserOnline = (userId: string) => {
  const count = onlineUsers.get(userId) ?? 0;
  onlineUsers.set(userId, count + 1);
};

export const setUserOffline = (userId: string) => {
  const count = onlineUsers.get(userId);
  if (!count) return;

  if (count <= 1) {
    onlineUsers.delete(userId);
  } else {
    onlineUsers.set(userId, count - 1);
  }
};

export const isUserOnline = (userId: string) => {
  return (onlineUsers.get(userId) ?? 0) > 0;
};

export const getOnlineUsers = () => Array.from(onlineUsers.keys());

