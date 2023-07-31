import { Action } from "./types";

import * as vscode from "vscode";

export const onDidProcessingEventEmitter: vscode.EventEmitter<void> =
  new vscode.EventEmitter();
export const onWillProcessingEventEmitter: vscode.EventEmitter<void> =
  new vscode.EventEmitter();
export const onWillExecuteActionEventEmitter: vscode.EventEmitter<Action> =
  new vscode.EventEmitter();

export const onDidProcessing = onDidProcessingEventEmitter.event;
export const onWillProcessing = onWillProcessingEventEmitter.event;
export const onWillExecuteAction = onWillExecuteActionEventEmitter.event;
