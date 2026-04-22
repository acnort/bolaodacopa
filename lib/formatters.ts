import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatDateTime(value: string) {
  return format(new Date(value), "dd 'de' MMM, HH:mm", { locale: ptBR });
}

export function formatDate(value: string) {
  return format(new Date(value), "dd/MM/yyyy", { locale: ptBR });
}

export function formatPhaseWindow(opensAt: string, closesAt: string) {
  return `${formatDate(opensAt)} - ${formatDate(closesAt)}`;
}
