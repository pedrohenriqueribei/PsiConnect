/**
 * Utilitários de formatação de datas e horas no padrão oficial brasileiro (dd/mm/aaaa).
 * Garante compatibilidade sem desvios de fuso horário em strings ISO ou 'aaaa-mm-dd'.
 */

/**
 * Converte data no formato 'aaaa-mm-dd', 'aaaa/mm/dd', ISO timestamp ou Date
 * para o formato brasileiro 'dd/mm/aaaa'.
 */
export function formatDateBR(dateVal?: string | Date | null): string {
  if (!dateVal) return '';

  if (dateVal instanceof Date) {
    if (isNaN(dateVal.getTime())) return '';
    return dateVal.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  const str = String(dateVal).trim();
  if (!str) return '';

  // Se já estiver no formato dd/mm/aaaa
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    return str;
  }

  // Se começar com aaaa-mm-dd ou aaaa/mm/dd (evita desvio de timezone UTC em new Date('YYYY-MM-DD'))
  const isoMatch = str.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
  if (isoMatch) {
    const [_, year, month, day] = isoMatch;
    return `${day}/${month}/${year}`;
  }

  // Tenta parse nativo se for formato com timestamp
  try {
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
  } catch {
    // fallback
  }

  return str;
}

/**
 * Converte data e hora para o formato brasileiro 'dd/mm/aaaa às HH:mm'
 * ou 'dd/mm/aaaa às HH:mm:ss'.
 */
export function formatDateTimeBR(dateVal?: string | Date | null, includeSeconds = false): string {
  if (!dateVal) return '';

  try {
    const parsed = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
    if (!(parsed instanceof Date) || isNaN(parsed.getTime())) {
      return formatDateBR(dateVal);
    }

    const d = parsed.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const t = parsed.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      ...(includeSeconds ? { second: '2-digit' } : {}),
    });

    return `${d} às ${t}`;
  } catch {
    return formatDateBR(dateVal);
  }
}
