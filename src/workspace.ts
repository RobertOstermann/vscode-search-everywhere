import * as vscode from "vscode";
import {
  onDidProcessing,
  onWillExecuteAction,
  onWillProcessing,
} from "./actionProcessorEventsEmitter";
import { clearConfig } from "./cache";
import { fetchExcludeMode } from "./config";
import { dataConverter } from "./dataConverter";
import DataService from "./dataService";
import ActionTrigger from "./enum/actionTrigger";
import ActionType from "./enum/actionType";
import DetailedActionType from "./enum/detailedActionType";
import ExcludeMode from "./enum/excludeMode";
import Action from "./interface/action";
import QuickPickItem from "./interface/quickPickItem";
import { utils } from "./utils";
import WorkspaceCommon from "./workspaceCommon";
import {
  onDidDebounceConfigToggleEventEmitter,
  onDidProcessingEventEmitter,
  onWillExecuteActionEventEmitter,
  onWillProcessingEventEmitter,
  onWillReindexOnConfigurationChangeEventEmitter,
} from "./workspaceEventsEmitter";
import WorkspaceRemover from "./workspaceRemover";
import WorkspaceUpdater from "./workspaceUpdater";

const debounce = require("debounce");

class Workspace {
  private dataService!: DataService;

  private common!: WorkspaceCommon;
  private remover!: WorkspaceRemover;
  private updater!: WorkspaceUpdater;

  constructor() {
    this.initComponents();
  }

  async index(indexActionType: ActionTrigger): Promise<void> {
    await this.common.index(indexActionType);
  }

  registerEventListeners(): void {
    vscode.workspace.onDidChangeConfiguration(
      debounce(this.handleDidChangeConfiguration, 250)
    );
    vscode.workspace.onDidChangeWorkspaceFolders(
      debounce(this.handleDidChangeWorkspaceFolders, 250)
    );
    vscode.workspace.onDidChangeTextDocument(
      debounce(this.handleDidChangeTextDocument, 700)
    );
    vscode.workspace.onDidRenameFiles(this.handleDidRenameFiles);
    vscode.workspace.onDidCreateFiles(this.handleDidCreateFiles);
    vscode.workspace.onDidDeleteFiles(this.handleDidDeleteFiles);

    onDidProcessing(this.handleDidActionProcessorProcessing);
    onWillProcessing(this.handleWillActionProcessorProcessing);
    onWillExecuteAction(this.handleWillActionProcessorExecuteAction);
  }

  getData(): QuickPickItem[] {
    return this.common.getData();
  }

  private initComponents(): void {
    utils.setWorkspaceFoldersCommonPath();
    this.dataService = new DataService();
    dataConverter.fetchConfig();

    this.common = new WorkspaceCommon(this.dataService);
    this.remover = new WorkspaceRemover(this.common);
    this.updater = new WorkspaceUpdater(this.common);
  }

  private reloadComponents() {
    dataConverter.reload();
    this.dataService.reload();
  }

  private handleDidChangeConfiguration = async (
    event: vscode.ConfigurationChangeEvent
  ): Promise<void> => {
    clearConfig();
    if (this.shouldReindexOnConfigurationChange(event)) {
      this.reloadComponents();
      onWillReindexOnConfigurationChangeEventEmitter.fire();
      await this.index(ActionTrigger.ConfigurationChange);
    } else if (utils.isDebounceConfigurationToggled(event)) {
      onDidDebounceConfigToggleEventEmitter.fire();
    }
  };

  private handleDidChangeWorkspaceFolders = async (
    event: vscode.WorkspaceFoldersChangeEvent
  ): Promise<void> => {
    utils.hasWorkspaceChanged(event) &&
      (await this.index(ActionTrigger.WorkspaceFoldersChange));
  };

  private handleDidChangeTextDocument = async (
    event: vscode.TextDocumentChangeEvent
  ) => {
    const uri = event.document.uri;
    const isUriExistingInWorkspace =
      await this.dataService.isUriExistingInWorkspace(uri, true);
    const hasContentChanged = event.contentChanges.length;

    const actionType = DetailedActionType.TextChange;

    if (isUriExistingInWorkspace && hasContentChanged) {
      await this.common.registerAction(
        ActionType.Remove,
        this.remover.removeFromCacheByPath.bind(this.remover, uri, actionType),
        ActionTrigger.DidChangeTextDocument,
        uri
      );

      await this.common.registerAction(
        ActionType.Update,
        this.updater.updateCacheByPath.bind(this.updater, uri, actionType),
        ActionTrigger.DidChangeTextDocument,
        uri
      );
    }
  };

  private handleDidRenameFiles = async (event: vscode.FileRenameEvent) => {
    this.dataService.clearCachedUris();

    const firstFile = event.files[0];
    const actionType = utils.isDirectory(firstFile.oldUri)
      ? DetailedActionType.RenameOrMoveDirectory
      : DetailedActionType.RenameOrMoveFile;

    for (let i = 0; i < event.files.length; i++) {
      const file = event.files[i];

      await this.common.registerAction(
        ActionType.Update,
        this.updater.updateCacheByPath.bind(
          this.updater,
          file.newUri,
          actionType,
          file.oldUri
        ),
        ActionTrigger.DidRenameFiles,
        file.newUri
      );

      actionType === DetailedActionType.RenameOrMoveFile &&
        (await this.common.registerAction(
          ActionType.Remove,
          this.remover.removeFromCacheByPath.bind(
            this.remover,
            file.oldUri,
            actionType
          ),
          ActionTrigger.DidRenameFiles,
          file.oldUri
        ));
    }
  };

  private handleDidCreateFiles = async (event: vscode.FileCreateEvent) => {
    this.dataService.clearCachedUris();

    const uri = event.files[0];
    const actionType = utils.isDirectory(uri)
      ? DetailedActionType.CreateNewDirectory
      : DetailedActionType.CreateNewFile;

    await this.common.registerAction(
      ActionType.Update,
      this.updater.updateCacheByPath.bind(this.updater, uri, actionType),
      ActionTrigger.DidCreateFiles,
      uri
    );
  };

  private handleDidDeleteFiles = async (event: vscode.FileDeleteEvent) => {
    this.dataService.clearCachedUris();

    const uri = event.files[0];
    const actionType = utils.isDirectory(uri)
      ? DetailedActionType.RemoveDirectory
      : DetailedActionType.RemoveFile;

    await this.common.registerAction(
      ActionType.Remove,
      this.remover.removeFromCacheByPath.bind(this.remover, uri, actionType),
      ActionTrigger.DidDeleteFiles,
      uri
    );
  };

  private handleWillActionProcessorProcessing = () => {
    onWillProcessingEventEmitter.fire();
  };

  private handleDidActionProcessorProcessing = () => {
    onDidProcessingEventEmitter.fire();
  };

  private handleWillActionProcessorExecuteAction = (action: Action) => {
    onWillExecuteActionEventEmitter.fire(action);
  };

  private readonly defaultSection = "searchEverywhere";
  private shouldReindexOnConfigurationChange(
    event: vscode.ConfigurationChangeEvent
  ): boolean {
    const excludeMode = fetchExcludeMode();
    const excluded: string[] = [
      "shouldDisplayNotificationInStatusBar",
      "shouldInitOnStartup",
      "shouldHighlightSymbol",
      "shouldUseDebounce",
    ].map((config: string) => `${this.defaultSection}.${config}`);

    return (
      (event.affectsConfiguration("searchEverywhere") &&
        !excluded.some((config: string) =>
          event.affectsConfiguration(config)
        )) ||
      (excludeMode === ExcludeMode.FilesAndSearch &&
        (event.affectsConfiguration("files.exclude") ||
          event.affectsConfiguration("search.exclude")))
    );
  }
}

export default Workspace;
