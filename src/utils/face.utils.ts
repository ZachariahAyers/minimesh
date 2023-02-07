import type { FaceParams } from "../types/face.params";
import type { AnyObject } from "../types/object.any";
import { parse } from "node-html-parser";
import { MINIMESH } from "../server/config/mesh.config";
import assert from "assert";
import { randomUUID } from "crypto";
import type { FaceContext } from "../types/face.context";

/**
 * Resolve the closest parent face container from the given DOM context.
 * @param {unknown} element - The DOM context.
 * @return {{enclosingFaceView: string, enclosingFaceName: string, pathInjector: string}} - The closest face container.
 * @author Zach Ayers
 */
function getEnclosingFaceInfo(element: unknown) {
  // Get the parent face to the passed in element
  const parentFaceContainer = (<HTMLElement>element).closest(
    `[class^=${MINIMESH.faceClassIdentifier}]`
  );

  // Fetch the name of the enclosing face
  const enclosingFaceName = (<HTMLElement>(
    (<unknown>parentFaceContainer)
  ))?.getAttribute(MINIMESH.faceNameIdentifier);

  // Fetch the view of the enclosing face
  const enclosingFaceView = (<HTMLElement>(
    (<unknown>parentFaceContainer)
  ))?.getAttribute(MINIMESH.faceViewIdentifier);

  const enclosingFaceUrl = (<HTMLElement>(
    (<unknown>parentFaceContainer)
  ))?.getAttribute(MINIMESH.faceUrlIdentifier);

  return {
    enclosingFaceName,
    enclosingFaceView,
    pathInjector:
      enclosingFaceUrl ?? `/${enclosingFaceName}/${enclosingFaceView}/`,
  };
}

/**
 * At a Mesh level, apply MiniMesh specific HTML mutations before sending to the client.
 * @param {string | Buffer} template - The template to be mutated.
 * @param {FaceContext<AnyObject, AnyObject, FaceParams>} context - The context of the current view.
 * @todo optimize, optimize, optimize
 * @todo Zach Ayers - This is where the magic happens. Here we take in the HTML template before it is sent to the browser.
 * @todo Currently this ONLY OCCURS at the MESH level to avoid necessary DOM processing.
 * @todo I would like to refactor and optimize this section to perform all 'mutation' tasks before a user receives our HTML.
 * @return {string} - The HTML template with all necessary DOM mutations.
 * @author Zach Ayers
 */
export function mutateMesh(
  template: string | Buffer,
  context: FaceContext<AnyObject, FaceParams>
): string {
  const parsedTemplate = parse(template.toString());
  // Get all Face class sections
  const foundFaceIds: Set<string> = new Set();
  const updatableFaceIds: Set<string> = new Set();
  const serverUrl = new URL(context.serverUrl);
  const clientBundleSrc =
    serverUrl.protocol +
    "//" +
    serverUrl.hostname +
    (serverUrl.port !== undefined ? ":" + serverUrl.port : "") +
    "/bundles/mesh.client.bundle.js";
  let skipFaceLevelManipulation = false;

  const clientBundleScript = `<script src="${clientBundleSrc}" defer></script>`;

  // Look at the HTML, re-generate any duplicate IDs
  // TODO: Speed up the performance below / reduce time complexity
  // TODO: parsedTemplate is stored in memory and must be re-parsed at certain sections
  // TODO: This is an expensive operation and should be optimized if possible
  // TODO: Build a default HTML page if one does not exist
  // TODO: The set_content function seems to be the best way to update on the fly.
  //  Refactor to use this set_content pattern
  const faces = parsedTemplate.querySelectorAll(
    `[class^=${MINIMESH.faceClassIdentifier}]`
  );

  // Set the top level data pointer
  const topLevelScripts = parsedTemplate.querySelectorAll("script");
  const topLevelStyles = parsedTemplate.querySelectorAll("link");
  [...topLevelScripts, ...topLevelStyles].forEach((element) => {
    if (element.getAttribute("src") !== undefined) {
      element.setAttribute("defer", "");
    }
    element.setAttribute(MINIMESH.faceDataIdentifier, context.id!);
  });

  // Find Face IDs that need updates
  // TODO: REDUCE TIME COMPLEXITY HERE, SEE COMMENT AT TOP OF FUNCTION BLOCK -
  //  WATCH OUT FOR ELEMENTS NOT UPDATING DURING COMBINED LOOPS -
  //  THE ORIGINAL `parsedElement` MUST BE RE-QUERIED FOR LIVE UPDATES DURING LOOPS.
  //  THERE IS LIKELY A GOOD WAY AROUND THIS, WE WILL NEED TO DISCUSS.
  faces.forEach((face) => {
    // Get the ID of the face
    const elementId = face.getAttribute(MINIMESH.faceIdIdentifier);

    // Every face/mesh will get a generated ID, this is a safety guard
    assert(elementId, "Face element must have an ID!");

    // If we've seen the ID before, add it to the update set
    if (foundFaceIds.has(elementId)) {
      updatableFaceIds.add(elementId);
    } else {
      foundFaceIds.add(elementId);
    }

    // Main Face Element Selectors
    const faceScripts = face.querySelectorAll("script");
    const faceLinks = face.querySelectorAll("link");

    // Update Face Script attributes
    faceScripts.forEach((script) => {
      const { pathInjector } = getEnclosingFaceInfo(script);
      const currentSrc = script?.getAttribute("src");

      // If a src exists, we have a fetchable script, if not, it is inline
      if (currentSrc !== undefined && !currentSrc?.includes(pathInjector)) {
        // Set defer so the script loads in the background and fires once the dom is loaded
        script?.setAttribute("defer", "");
        // Update the path to point to the corresponding face
        script?.setAttribute("src", `${pathInjector}${currentSrc}`);
      }
      // Add the association pointer
      script?.setAttribute(MINIMESH.faceDataIdentifier, <string>elementId);
    });

    // Update Link attributes
    faceLinks.forEach((link) => {
      const { pathInjector } = getEnclosingFaceInfo(link);
      const currentHref = link?.getAttribute("href");

      // Add the association pointer
      link?.setAttribute(MINIMESH.faceDataIdentifier, <string>elementId);

      // Update the path to point to the corresponding face
      if (currentHref !== undefined && !currentHref?.includes(pathInjector)) {
        link?.setAttribute(
          "href",
          `${pathInjector}${link.getAttribute("href")}`
        );
      }
    });
  });

  // Update face IDS where needed
  // TODO: REDUCE TIME COMPLEXITY HERE, SEE COMMENT AT TOP OF FUNCTION BLOCK
  //  WATCH OUT FOR ELEMENTS NOT UPDATING DURING COMBINED LOOPS -
  //  THE ORIGINAL `parsedElement` MUST BE RE-QUERIED FOR LIVE UPDATES DURING LOOPS.
  //  THERE IS LIKELY A GOOD WAY AROUND THIS, WE WILL NEED TO DISCUSS.
  updatableFaceIds.forEach((id) => {
    const updateableId = id;
    const duplicates = parsedTemplate.querySelectorAll(`[id=${updateableId}]`);

    // It is possible to have many of the same face on one page, sanitize their IDs accordingly
    // TODO: Optimize this, there are WAY too many loops in this section.
    //  This will be revisted at a later date.
    if (duplicates.length) {
      duplicates.forEach((duplicate) => {
        const newElementId = randomUUID();
        duplicate.setAttribute(MINIMESH.faceIdIdentifier, newElementId);
        duplicate.setAttribute(MINIMESH.faceDataIdentifier, newElementId);
        const oldElementRegex = new RegExp(updateableId, "gi");
        duplicate.innerHTML = duplicate.innerHTML.replace(
          oldElementRegex,
          newElementId
        );
      });
    }
  });

  // Move Elements where they belong
  // TODO: REDUCE TIME COMPLEXITY HERE, SEE COMMENT AT TOP OF FUNCTION BLOCK
  //  WATCH OUT FOR ELEMENTS NOT UPDATING DURING COMBINED LOOPS -
  //  THE ORIGINAL `parsedElement` MUST BE RE-QUERIED FOR LIVE UPDATES DURING LOOPS.
  //  THERE IS LIKELY A GOOD WAY AROUND THIS, WE WILL NEED TO DISCUSS.
  // If no body tag exists, add it
  let body = parsedTemplate.querySelector("body");
  if (!body) {
    skipFaceLevelManipulation = true;
    parsedTemplate.set_content(
      `<body id="${context.id}" class="${MINIMESH.faceClassIdentifier} ${context.viewName} ${context.faceName}">${parsedTemplate.innerHTML}</body>`
    );
    body = parsedTemplate.querySelector("body");
  }

  // If no head tag exists, add it
  let head = parsedTemplate.querySelector("head");
  if (!head) {
    skipFaceLevelManipulation = true;
    parsedTemplate.set_content(
      `<html lang="en"><head><title>${context.title}</title></head>${parsedTemplate.innerHTML}</html>`
    );
    head = parsedTemplate.querySelector("head");
  }

  if (!skipFaceLevelManipulation) {
    body?.querySelectorAll("script").forEach((script) => {
      const id = script.getAttribute(MINIMESH.faceDataIdentifier);
      if (id !== undefined) {
        const scriptScr = script.getAttribute("src");
        script.remove();

        // If the script has no source, move it to the bottom of the body tag
        if (scriptScr === undefined) {
          body?.appendChild(script);
        } else {
          if (id === context.id) {
            head?.insertAdjacentHTML("afterbegin", script.outerHTML);
          } else {
            head?.appendChild(script);
          }
        }
      }
    });
    body?.querySelectorAll("link").forEach((link) => {
      const id = link.getAttribute(MINIMESH.faceDataIdentifier);
      if (id !== undefined) {
        const linkHref = link.getAttribute("href");

        // Clean up the pointer identifier as it is likely not needed here
        link.removeAttribute(MINIMESH.faceDataIdentifier);
        link.remove();

        // If the link has an href, move it to the head element.
        if (linkHref !== undefined) {
          head?.appendChild(link);
        }
      }
    });
  }

  // Inject the top level face data into the body tag
  body?.setAttribute(MINIMESH.faceIdIdentifier, context.id ?? "");
  body?.classList.add(MINIMESH.faceClassIdentifier);
  body?.classList.add(context.viewName);
  body?.classList.add(context.faceName);

  // Inject the client library
  head?.set_content(`${clientBundleScript}${head?.innerHTML}`);

  // TODO internal script and styles for Preact are not getting removed
  // The reappear as the script and links set in the template
  // Narrow down where this is flowing through and sanitize it

  return parsedTemplate.toString();
}
