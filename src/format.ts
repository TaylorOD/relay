export const format = (value: number) => value.toLocaleString('en-US')
export const seconds = (value: number) => `${(value / 1000).toFixed(1)}s`
