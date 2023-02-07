#!/usr/bin/env node
import { getPackageJsonKey } from "../utils/pkg.utils.";
import { logger } from "../utils/logger.utils";
import { CONSTANTS } from "../constants/mesh.constants";

// Get MiniMesh's current version
const currentMeshversion = getPackageJsonKey("version");

// Logger Version message
logger.stylize((style) => style.bold.hex(CONSTANTS.branding.green));
logger.info(`➦  Version: ${currentMeshversion}`);
