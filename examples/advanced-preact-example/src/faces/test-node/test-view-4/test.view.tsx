import { events, preact, PreactViewContext } from "minimesh";

const { face } = preact;

export function Hello() {
  return (<div>Hello</div>);
}

export function TestView4(context: PreactViewContext) {
  events.useOnMessageListener((message) => {
    console.debug("Received Message in Preact...");
    console.debug(message);
  });

  return (
    <>
      <div>
        <Hello/>
        {face("testChild3", context)}
        {face("preactApp", context)}
      </div>
      <script src="test.client.ts"></script>
    </>
  );
}