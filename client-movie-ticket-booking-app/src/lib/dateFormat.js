const dateFormat = (date) => {
  return new Date(date).toLocaleString("vi-VN", {
    weekday: "short",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
};

export default dateFormat;
