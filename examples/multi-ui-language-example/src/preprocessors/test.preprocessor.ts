import type { FacePreprocessor, ServerContext } from "minimesh";

/**
 * TODO
 */
export const TestPreprocesser: FacePreprocessor = {
    priority: 1,
    preprocessor(context: ServerContext) {
        context.setPublicData({test: 'hello'})
    }
}