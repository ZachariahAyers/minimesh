#!/usr/bin/env node
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import minimist from "minimist";
import { Plop, run } from "plop";
import inquirer from "inquirer";
import fs from "fs";
import "./plopfiles/mesh.project.plopfile";
import "./plopfiles/mesh.controller.plopfile";
import "./plopfiles/mesh.face.plopfile";
import "./plopfiles/mesh.preprocessor.plopfile";
import "./plopfiles/mesh.mesh.plopfile";
import "./plopfiles/mesh.service.plopfile";
import { CONSTANTS } from "../constants/mesh.constants";
import { simpleLogger } from "../utils/logger.utils";
import { getPackageJsonKey } from "../utils/pkg.utils.";

// Show Welcome Message
simpleLogger.stylize((style) => style.bold.hex(CONSTANTS.branding.orange));
simpleLogger.info("\n" + CONSTANTS.welcomeBannerSlim);

// Get and display version
const version = getPackageJsonKey("version");
simpleLogger.stylize((style) => style.bold.italic.dim);
simpleLogger.debug(`➦  Version: ${version}`, "\n");

// Read the Process ARGS
const args = process.argv.slice(2);
const argv = minimist(args);

// Get the dirname of this file
const __dirname = dirname(fileURLToPath(import.meta.url));

const cwdInsideProject = () =>
  fs.existsSync(path.join(process.cwd(), "package.json"));

// Set up choices
const choices = !cwdInsideProject()
  ? {
      Project: "./plopfiles/mesh.project.plopfile.js",
    }
  : {
      Mesh: "./plopfiles/mesh.mesh.plopfile.js",
      Face: "./plopfiles/mesh.face.plopfile.js",
      Preprocessor: "./plopfiles/mesh.preprocessor.plopfile.js",
      Controller: "./plopfiles/mesh.controller.plopfile.js",
      Model: "./plopfiles/mesh.model.plopfile.js",
      Service: "./plopfiles/mesh.service.plopfile.js",
      Repository: "./plopfiles/mesh.repository.plopfile.js",
    };

// Select Component Type
const componentTypeAnswer = await inquirer.prompt([
  {
    type: "list",
    name: "COMPONENT_TYPE",
    message: "Select a MiniMesh component to generate:",
    choices: Object.keys(choices),
  },
]);

// Prepare the plop runner
Plop.prepare(
  {
    cwd: argv.cwd,
    configPath: path.join(
      __dirname,
      // @ts-expect-error
      choices[componentTypeAnswer.COMPONENT_TYPE]
    ),
    preload: argv.preload || [],
    completion: argv.completion,
  },
  (env) => Plop.execute(env, run as never)
);
