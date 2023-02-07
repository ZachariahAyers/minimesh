import type { FacePreprocessor, ServerContext } from "minimesh";
import os from 'os'

/**
 * OsUsernamePreprocessor
 * @description TODO
 */
export const OsUsernamePreprocessor: FacePreprocessor = {
  priority: 1,
  preprocessor(context: ServerContext) {
    context.setPublicData({'username': os.userInfo().username})
  },
}
