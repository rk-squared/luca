export enum LangType {
  Gl = 'gl',
  Jp = 'jp',
}

export const toEuroFixed = (value: number) => value.toFixed(2).replace('.', ',');
export const withPlus = (value: number) => (value < 0 ? value : '+' + value);
export const commaSeparated = (parts: string[]) => {
  if (parts.length === 0) {
    return '';
  } else if (parts.length === 1) {
    return parts[0];
  } else {
    return parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1];
  }
};
