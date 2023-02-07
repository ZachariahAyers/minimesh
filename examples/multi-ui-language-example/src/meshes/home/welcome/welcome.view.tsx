import { events, preact, PreactViewContext } from "minimesh";

// Destructure 'preact' packages here
const { face } = preact;

/**
 * WelcomeView
 * @description: TODO
 */
export function Welcome(context: PreactViewContext) {

  function sendToFrag() {
    console.log("Test");
    // Send event to all faces and mesh on the page
    events.toAll("Hello Everyone!");
    // Send even to all faces on the page
    events.toFaces(new Array(10).map(() => ({ type: "test" })));
    // Send event to the mesh
    events.toMesh(new Map([["test", "Hello World!"]]));
    events.publish({ channel: 'hi:channel', topic: 'hi:topic' }, 'Message From The Mesh!')
  }

  return (
      <>
        <link href="welcome.styles.scss" rel="stylesheet"/>
        <div>

          <div><p>welcome is alive yes it is yes!</p></div>
          <div>{face('ejs', context)}</div>
          <div>{face('html', context)}</div>
          <div>{face('markdown', context)}</div>
          <button onClick={sendToFrag}>Click To Send</button>
          <h1>Hi there</h1>
        </div>
        <script src="welcome.client.ts"></script>
      </>
  );
}
