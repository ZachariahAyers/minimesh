```text
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░░░░░░███╗░░░███╗██╗███╗░░██╗██╗███╗░░░███╗███████╗░██████╗██╗░░██╗░░░░░░░
░░░░░░████╗░████║██║████╗░██║██║████╗░████║██╔════╝██╔════╝██║░░██║░░░░░░░
░░░░░░██╔████╔██║██║██╔██╗██║██║██╔████╔██║█████╗░░╚█████╗░███████║░░░░░░░
░░░░░░██║╚██╔╝██║██║██║╚████║██║██║╚██╔╝██║██╔══╝░░░╚═══██╗██╔══██║░░░░░░░
░░░░░░██║░╚═╝░██║██║██║░╚███║██║██║░╚═╝░██║███████╗██████╔╝██║░░██║░░░░░░░
░░░░░░╚═╝░░░░░╚═╝╚═╝╚═╝░░╚══╝╚═╝╚═╝░░░░░╚═╝╚══════╝╚═════╝░╚═╝░░╚═╝░░░░░░░
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░░  ░░░  ░░░  ░░░  Distributed MicroFrontends Made Easy ░░░  ░░░  ░░░  ░░░
  ░░   ░░   ░░   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   ░░   ░░   ░░
```

[![Latest Release](https://github.com/zjayers/minimesh-/badges/release.svg)](https://github.com/zjayers/minimesh-/releases)
[![pipeline status](https://github.com/zjayers/minimesh-/badges/master/pipeline.svg)](https://github.com/zjayers/minimesh-/commits/master)
[![coverage report](https://github.com/zjayers/minimesh-/badges/master/coverage.svg)](https://github.com/zjayers/minimesh-/commits/master)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

---

> MiniMesh is in a stable Alpha Release stage. Features will be added, bugs may occur. If you encounter a bug, please raise an issue so we may patch it as quickly as possible: [Issues](https://github.com/zjayers/minimesh-/issues)

## Index

<!-- TOC -->

- [Index](#index)
- [About](#about)
  - [What is MiniMesh?](#what-is-minimesh)
- [Getting Started / Prerequisites](#getting-started--prerequisites)
- [Installation](#installation)
- [Usage](#usage)
  - [Generating A MiniMesh Project](#generating-a-minimesh-project)
  - [Running the Development Server](#running-the-development-server)
  - [Generating a MiniMesh Component](#generating-a-minimesh-component)
    - [Mesh](#mesh)
    - [Face](#face)
    - [Preprocessor](#preprocessor)
    - [Controller](#controller)
    - [Service](#service)
- [Training](#training)
- [Examples](#examples)
- [Changelog](#changelog)
- [Contributing](#contributing)
- [Security / Bug Reports](#security--bug-reports)
- [Developing Locally](#developing-locally)
- [Thanks For Stopping By...](#thanks-for-stopping-by)
<!-- TOC -->

---

## About

### What is MiniMesh?

- `MiniMesh` is a micro-frontend development tool
  that manages the compiling, bundling, and serving of UI meshes and faces in a distributed
  style. For the majority of cases, it should not be implemented directly, but instead generated
  using the `minimesh` npm package.

---

## Getting Started / Prerequisites

- This project relies on [Node.js](https://nodejs.org/en/) LTS.

---

## Installation

> NOTE: Some systems require you to **restart** your terminal before newly installed commands are
> available

- To get started with `MiniMesh` - you will need the `MiniMesh CLI`
- To install the CLI on your system, run the following command:

  ```npm
  # Globally install the MiniMesh CLI on your system.
  npm install -g minimesh@next
  ```

- Once installed, you will have a few _new_ commands available in your terminal:
  - `mesh-build` - _build a MiniMesh project for production_
  - `mesh-insights` - _
    run [PageSpeed Insights](https://developers.google.com/speed/docs/insights/v5/about) on your
    project, and report the findings_
  - `mesh-serve` - _run a MiniMesh development server - normally used when developing a new
    MiniMesh project_
  - `mesh-generate` - _generate various MiniMesh components (Projects, Meshes, Faces,
    etc.)_
  - `meshgen` - _short-hand command to invoke `mesh-generate`_

---

## Usage

### Generating A MiniMesh Project

- To generate a new project, use the `meshgen` command
- Select `Project` _(These options will expand as the MiniMesh ecosystem grows)_
  > 🎥 Currently Recording 🎥
  > ![](./examples/readme-assets/meshgen-project.gif)

### Running the Development Server

- `cd` into your newly created project and run `npm run dev`
  > 🎥 Currently Recording 🎥
  > ![](./examples/readme-assets/mesh-dev-server.gif)

### Generating a MiniMesh Component

- To generate components for MiniMesh projects, use command `meshgen` once again.
- The `meshgen` command will ask different questions depending on your current working directory.

#### Mesh

- Meshes are the 'composition' layer of your UI. They are composed of many different `Faces` from many different places!
  > 🎥 Currently Recording 🎥
  > ![](./examples/readme-assets/meshgen-mesh.gif)

#### Face

- Faces are the 'bricks' of your mesh. They are containerized in islands but may communicate through a global event system. You normally compose many faces to build a `Mesh`.
  > 🎥 Currently Recording 🎥
  > ![](./examples/readme-assets/meshgen-face.gif)

#### Preprocessor

- Sometimes you may need to gather some data on the server side before rendering your Faces, to do that, you'll need a `FacePreprocessor`.
- `FacePreprocessors` can do anything a NodeJS server can do—from file access, to template manipulation, to 3rd party API calls.
- Any data fetched on the server can be sent up to the client by utilizing the `context` object, check it out! [Face Preprocessor Example](https://github.com/zjayers/minimesh-/blob/master/examples/simple-preprocessor-example/src/preprocessors/os-username.preprocessor.ts)
  > 🎥 Currently Recording 🎥
  > ![](./examples/readme-assets/meshgen-preprocessor.gif)

#### Controller

- `Controllers` can be used to expose raw data to the client. These are standard API CRUD controllers and can be used as such.
  > 🎥 Currently Recording 🎥
  > ![](./examples/readme-assets/meshgen-controller.gif)

#### Service

- Sometimes you might need a `Service` to do some more complex work. `meshgen` can add a base class for you to start your data parsing with!
  > 🎥 Currently Recording 🎥
  > ![](./examples/readme-assets/meshgen-service.gif)

---

## Training

- Please view the following training videos for in-depth training with MiniMesh.

> 🎥 Currently Recording 🎥

---

## Examples

- Please view the examples located here: [Examples](https://github.com/zjayers/minimesh-/tree/next/examples)

---

## Changelog

- To view the most recent changelog, please see [CHANGELOG.md](./CHANGELOG.md).

---

## Contributing

- To view the contributing guide, please see [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## Security / Bug Reports

- To view the security information guide, please see [SECURITY.md](./SECURITY.md).

---

## Developing Locally

- Want to become a MiniMesh developer? Have a look at our [Development Guide](./DEVELOPMENT.md).

---

## Thanks For Stopping By...

Stop by again for a different joke!

![Jokes Card](https://readme-jokes.vercel.app/api)

---
