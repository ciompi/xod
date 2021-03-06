import * as R from 'ramda';
import path from 'path';
import cpp from 'child-process-promise';
import fse from 'fs-extra';

import * as Utils from './utils';

// =============================================================================
//
// Prepare command and build
//
// =============================================================================

/**
 * Transforms paths to libraries into arduino-builder arguments.
 * E.G.
 * ['/tmp/libs', '/usr/a/libs'] -> ['-libraries="/tmp/libs"', '-libraries="/usr/a/libs"']
 *
 * :: [String] -> [String]
 */
const composeLibArgs = R.map(p => `-libraries="${p}"`);

export const composeCommand = (
  sketchFilePath,
  fqbn,
  packagesDir,
  libraryDirs,
  buildDir,
  builderToolDir
) => {
  const builderExecFileName = Utils.isWindows
    ? 'arduino-builder.exe'
    : 'arduino-builder';
  const builderExec = path.join(builderToolDir, builderExecFileName);

  const builderHardware = path.join(builderToolDir, 'hardware');
  const builderTools = path.join(builderToolDir, 'tools');

  return [
    `"${builderExec}"`,
    `-hardware="${builderHardware}"`,
    `-hardware="${packagesDir}"`,
    ...composeLibArgs(libraryDirs),
    `-tools="${builderTools}"`,
    `-tools="${packagesDir}"`,
    `-fqbn="${fqbn}"`,
    `-build-path="${buildDir}"`,
    `"${sketchFilePath}"`,
  ].join(' ');
};

// :: Path -> FQBN -> Path -> Path -> Path -> PortName -> Promise { exitCode, stdout, stderr } Error
export const build = R.curry(
  (
    sketchFilePath,
    fqbn,
    packagesDir,
    libraryDirs,
    buildDir,
    builderToolDir
  ) => {
    const cmd = composeCommand(
      sketchFilePath,
      fqbn,
      packagesDir,
      libraryDirs,
      buildDir,
      builderToolDir
    );

    return fse
      .ensureDir(buildDir)
      .then(() => cpp.exec(cmd))
      .then(Utils.normalizeChildProcessResult);
  }
);
