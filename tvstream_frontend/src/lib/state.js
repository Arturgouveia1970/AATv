// src/lib/state.js
const KEY = 'aatv-state-v1'

export const loadState = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return {} }
}
export const saveState = (partial) => {
  const cur = loadState()
  localStorage.setItem(KEY, JSON.stringify({ ...cur, ...partial }))
}
