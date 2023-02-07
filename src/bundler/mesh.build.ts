#!/usr/bin/env node

import { startMeshDevServer } from "./development/dev.server";
import { getServerRoot } from "../utils/directory.utils";

// TODO: Finish build pipeline
// Get the server root
const serverRoot = getServerRoot();

void startMeshDevServer(serverRoot);
