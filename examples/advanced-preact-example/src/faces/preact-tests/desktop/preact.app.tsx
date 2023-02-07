import { events, http, preact, PreactViewContext } from "minimesh";
import { Hello } from '../../test-node/test-view-4/test.view';

// Lets destructure off preact specific functions from the MiniMesh 'preact' package
const { hooks: { useState, useEffect }, face } = preact;

/**
 * PREACT APP EXAMPLE
 * @param {PreactViewContext} context
 * @returns {JSX.Element}
 * @constructor
 */
export function PreactApp(context: PreactViewContext) {
  const [count, setCount] = useState(5);

  // Your context object contains the info about this view,
  // is created at request time,
  // and flows from the server all the way to you right here
  // console.debug("PreactApp context:", context);

  // Subscribe to Message Bus Events
  // Once subscribed to the main message channels, the component will receive all messages sent to the bus.
  events.useOnMessageListener((message) => {
    console.debug("Received Message in Preact...");
    console.debug(message);

    // You can even set state based on an event
    if (message.payload === "Hello Everyone!") {
      setCount(0);
    }
  });

  // You can also subscribe to any arbitraty event channel + topic
  events.subscribe({ topic: 'test-topic', channel: 'test-channel' }, (payload) => {
    console.log('Received Message from Test Topic and Channel: ' + payload);
  });

  // You can also publish a payload of any type to any arbitraty event channel + topic
  events.publish({
    topic: 'calendar.updated',
    channel: 'date.events'
  }, 'My payload can be anything!');

  // Get a scoped API hook to this server
  // Use the custom MiniMesh 'http' client (Axios under the hood) to auto-scope your requests to this server
  const api = http.useApi(context, {
    timeout: 1000,
    withCredentials: false,
    headers: { 'Access-Control-Allow-Credentials': true }
  });

  // Setup State for Data Binding
  const [user, setUser] = useState("Fetching...");

  // Async load into the Preact component
  useEffect(() => {
    api.get("/users").then(r => r.data).then(data => setUser(data));

    // You can also fetch from a different address
    http.get("http://127.0.0.1:3000/hello").then((response) => console.log(response.data, context.id)).catch(err => console.error(err));
  })

  // Event Publish Test
  function handleClick() {
    // Send event to all faces and mesh on the page
    events.toAll("Hello Everyone!");
    // Send even to all faces on the page
    events.toFaces(new Array(10).map(() => ({ type: "test" })));
    // Send event to the mesh
    events.toMesh(new Map([["test", "Hello World!"]]));
  }

  // Default State Setup
  const increment = () => setCount(count + 1);
  const decrement = () => setCount((currentCount: number) => currentCount - 5);

  // View - coded in JSX using Preact SSR rendering engine yunder the hood
  return (
      <>
        {/* Imports are resolved from your view outwards, the framework will wire this up properly */}
        <link rel="stylesheet" href="test.style.scss"/>
        <div>
          {/* Import JSX elements from this server from any place */}
          <Hello/>
          <h2>{user}</h2>
          <p>Count: {count}</p>
          {/* Inline data binding */}
          <button onClick={increment}>Uppp12sss3aa112312312322221111123p</button>
          <button onClick={decrement}>Down</button>
          <button onClick={handleClick}>click test 2</button>
          {/* This is how you fetch a face from this server or elsewhere */}
          {face("testChild3", context)}
        </div>
        <script src="test.client.ts"></script>
      </>
  );
}
