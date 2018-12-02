export enum LangType {
  Gl = 'gl',
  Jp = 'jp',
}

export const toEuroFixed = (value: number) => value.toFixed(2).replace('.', ',');
export const withPlus = (value: number) => (value < 0 ? value : '+' + value);
