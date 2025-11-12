import { format, parseISO, isValid } from "date-fns";

export const formatDate = (
  date: string | Date | null | undefined,
  formatString = "dd/MM/yyyy"
): string => {
  if (!date) return "-";

  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return isValid(dateObj) ? format(dateObj, formatString) : "-";
  } catch {
    return "-";
  }
};

export const formatDateTime = (
  date: string | Date | null | undefined,
  formatString = "dd/MM/yyyy HH:mm"
): string => {
  return formatDate(date, formatString);
};

export const formatCurrency = (
  amount: number | null | undefined,
  currency = "VND",
  locale = "vi-VN"
): string => {
  if (amount === null || amount === undefined) return "-";

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
};

export const formatNumber = (
  value: number | null | undefined,
  decimals = 2,
  locale = "vi-VN"
): string => {
  if (value === null || value === undefined) return "-";

  try {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  } catch {
    return value.toFixed(decimals);
  }
};

export const formatPercentage = (
  value: number | null | undefined,
  decimals = 1
): string => {
  if (value === null || value === undefined) return "-";
  return `${formatNumber(value, decimals)}%`;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const truncateText = (text: string, maxLength = 100): string => {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

export const capitalizeFirst = (text: string): string => {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const formatStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    draft: "Bản nháp",
    published: "Đã xuất bản",
    archived: "Đã lưu trữ",
    processing: "Đang xử lý",
    completed: "Hoàn thành",
    failed: "Thất bại",
  };

  return statusMap[status] || capitalizeFirst(status);
};
