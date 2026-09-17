/** Blank is unknown, never silently zero. */
export function parseCount(value: string): number | null {
  if (!value.trim()) return null
  if (!/^\d+$/.test(value)) throw new Error('Informe um número inteiro igual ou maior que zero.')
  const count = Number(value)
  if (!Number.isSafeInteger(count) || count > 1_000_000) throw new Error('Quantidade fora do limite permitido.')
  return count
}
export function attendanceTotal(counts: readonly (number | null)[]) {
  if (counts.length !== 3 || counts.some(n => n !== null && (!Number.isInteger(n) || n < 0 || n > 1_000_000))) {
    throw new Error('Indicadores inválidos.')
  }
  const known = counts.filter((n): n is number => n !== null)
  return { value: known.length ? known.reduce((a, b) => a + b, 0) : null, complete: known.length === 3 }
}
export function validCpf(value: string): boolean {
  const cpf = value.replace(/[.\-\s]/g, '')
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false
  const digit = (length: number) => {
    const sum = [...cpf.slice(0, length)].reduce((s, d, i) => s + Number(d) * (length + 1 - i), 0)
    return (sum * 10 % 11) % 10
  }
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10])
}
export function validVisitTimes(start: string, end: string): boolean {
  const valid = (v: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v)
  return valid(start) && valid(end) && end > start
}
