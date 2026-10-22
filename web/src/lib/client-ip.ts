// IP del cliente para el limitador de auth-service: la que anotó el último salto (el reverse
// proxy en staging), no la cadena completa de X-Forwarded-For que el cliente puede inventar.
export function forwardedForHeader(xff: string | string[] | null | undefined): Record<string, string> {
  const raw = Array.isArray(xff) ? xff.join(',') : xff;
  const ip = raw?.split(',').pop()?.trim();
  return ip ? { 'X-Forwarded-For': ip } : {};
}
