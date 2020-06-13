import { format } from "date-fns";

export default function formatDate(date) {
  const newDate = new Date(date);
  const formattedDate = format(newDate, "dd/MM/yyyy - HH:mm:SS");

  return formattedDate;
}
