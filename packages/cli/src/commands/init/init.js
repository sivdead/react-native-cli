// @flow
import fs from 'fs-extra';
import minimist from 'minimist';
import type {ContextT} from '../../tools/types.flow';
import {validateProjectName} from './validate';
import DirectoryAlreadyExistsError from './errors/DirectoryAlreadyExistsError';
import printRunInstructions from './printRunInstructions';
import logger from '../../tools/logger';
import {
  fetchTemplate,
  getTemplateConfig,
  copyTemplate,
  executePostInstallScript,
} from './template';
import {changePlaceholderInTemplate} from './editTemplate';
import PackageManager from '../../tools/PackageManager';
import {getReactNativeVersion} from './utils';

type Options = {|
  template?: string,
|};

function createFromExternalTemplate(projectName: string, template: string) {
  logger.info('Initializing new project from extrenal template');

  fetchTemplate(template);
  const templateConfig = getTemplateConfig(template);
  copyTemplate(template, templateConfig.templateDir);
  changePlaceholderInTemplate(projectName, templateConfig.placeholderName);

  new PackageManager({}).installAll();

  if (templateConfig.postInitScript) {
    executePostInstallScript(template, templateConfig.postInitScript);
  }
}

function createFromReactNativeTemplate(projectName: string, version: string) {
  logger.info('Initializing new project');

  const template = getReactNativeVersion(version);

  fetchTemplate(template);
  const templateConfig = getTemplateConfig(template);
  copyTemplate(template, templateConfig.templateDir);
  changePlaceholderInTemplate(projectName, templateConfig.placeholderName);

  new PackageManager({}).installAll();

  if (templateConfig.postInitScript) {
    executePostInstallScript(template, templateConfig.postInitScript);
  }
}

function createProject(projectName: string, options: Options, version: string) {
  fs.mkdirSync(projectName);
  process.chdir(projectName);

  if (options.template) {
    return createFromExternalTemplate(projectName, options.template);
  }

  return createFromReactNativeTemplate(projectName, version);
}

export default function initialize(
  [projectName]: Array<string>,
  context: ContextT,
  options: Options,
) {
  try {
    validateProjectName(projectName);

    const version: string = minimist(process.argv).version || 'latest';

    if (fs.existsSync(projectName)) {
      throw new DirectoryAlreadyExistsError(projectName);
    }

    createProject(projectName, options, version);

    printRunInstructions(process.cwd(), projectName);
  } catch (e) {
    logger.error(e.message);
    fs.removeSync(projectName);
  }
}
