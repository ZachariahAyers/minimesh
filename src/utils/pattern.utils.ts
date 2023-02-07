export const PATTERN_ALL_ZEROS = /^0+$/;
export const PATTERN_CURRENCY =
  /^\$?(?:[+-]?(?:(?:[1-9]\d{0,2}(?:,\d{3})*)|[1-9]\d*|0)?\.\d{2}|\((?:(?:[1-9]\d{0,2}(?:,\d{3})*)|[1-9]\d*|0)?\.\d{2}\))$/;
export const PATTERN_DATE =
  /(\d{2}-\d{2}-\d{4}|\d{2}\/\d{2}\/\d{4}|\d{2}\.\d{2}\.\d{4})/;
export const PATTERN_DATE_SEPARATOR = /(\/|-|\.)/;
export const PATTERN_HEX_DIGITS = /^[0-9a-f]+$/i;
export const PATTERN_HTML_TAG = /(< *\/?[biu] *>)|(< *br *\/ *>)/g;
export const PATTERN_PUNCTUATION = /[,.!?]+$/;
export const PATTERN_MULTIPLE_SPACES = /\s{2,}/g;
