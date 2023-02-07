import { ConsoleLogger } from "../../utils/logger.utils";

/**
 * TODO
 */
export abstract class Loggable {
  protected readonly log: ConsoleLogger;

  /**
   * TODO
   */
  constructor() {
    this.log = new ConsoleLogger({ className: this.constructor.name });
  }
}
