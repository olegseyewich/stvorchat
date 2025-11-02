const timeFormatter = new Intl.DateTimeFormat("ru-RU", {
  hour: "2-digit",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
});

export const formatMessageTime = (isoDate: string) => {
  const date = new Date(isoDate);
  return timeFormatter.format(date);
};

export const formatMessageDate = (isoDate: string) => {
  const date = new Date(isoDate);
  return dateFormatter.format(date);
};


