/**
 * Return 'true' to if the given string is a valid HTTP url.
 * @todo - Add more robust checking/testing.
 * @param {string} url - The url to check.
 * @return {boolean} - True if the url is valid, false otherwise.
 * @author Zach Ayers
 */
export function isValidHttpUrl(url: string) {
  let builtUrl;
  try {
    builtUrl = new URL(url);
  } catch (_) {
    return false;
  }

  return builtUrl.protocol === "http:" || builtUrl.protocol === "https:";
}
