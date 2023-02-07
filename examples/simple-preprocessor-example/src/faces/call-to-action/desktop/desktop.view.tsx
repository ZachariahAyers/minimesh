import type { PreactViewContext } from "minimesh";

/**
 * DesktopView
 * @description: TODO
 */
export function Desktop(context: PreactViewContext<{ username: string }>) {

  return (
      <>
        <div>
          <h2>Hello {context.data.username}</h2>
          <p>view: 'desktop' is operational!</p>
        </div>
        <link href="desktop.styles.scss" rel="stylesheet"/>
        <script src="desktop.client.ts" defer></script>
      </>
  );
}
