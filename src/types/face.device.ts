/**
 * Types of devices that may have requested a view.
 * @see https://github.com/faisalman/ua-parser-js
 * @category (Face)
 * @author Zach Ayers
 * @public
 * @example
 * ```typescript
 * // context.deviceType is of type FaceDevice, and allows strong value checking
 * if (context.deviceType === 'MOBILE') {
 *   // Do something for mobile
 * }
 * ```
 */
export type FaceDevice =
  | "MODEL"
  | "DESKTOP"
  | "VENDOR"
  | "TYPE"
  | "CONSOLE"
  | "MOBILE"
  | "SMARTTV"
  | "TABLET"
  | "WEARABLE"
  | "EMBEDDED";
