'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "html-style-checker" is now active!');

    let lineChecker = new LineChecker();
    let controller = new LineCheckerController(lineChecker);
    
    
    context.subscriptions.push(controller);
    context.subscriptions.push(lineChecker);
}

// this method is called when your extension is deactivated
export function deactivate() {
}

class LineChecker {
    private longLines = vscode.languages.createDiagnosticCollection("longLines");
    private tags = vscode.languages.createDiagnosticCollection("tags");
    
    public checkLines() {
        let lineDiagnostics: vscode.Diagnostic[] = [];
        let tagDiagnostics: vscode.Diagnostic[] = [];
                
        let editor = vscode.window.activeTextEditor;
        // if there is no editor instance it will just return.
        if (!editor) {
            return;
        }
        
        let doc = editor.document;
        
        if (doc.languageId === "html") {
            let docContent = doc.getText();
            let lines = docContent.split("\n");
            
            for (var i = 0; i < lines.length; i++) {
                this.validateTag(lines[i]);
                if (lines[i].length >= 100) {
                    let startPos = new vscode.Position(i, doc.lineAt(i).firstNonWhitespaceCharacterIndex);
                    let endPos = new vscode.Position(i, lines[i].length);
                    let diagnostic = new vscode.Diagnostic(new vscode.Range(startPos, endPos),
                        "Lines must be less than 100 characters", vscode.DiagnosticSeverity.Error);
                    lineDiagnostics.push(diagnostic);
                }
            }
            this.longLines.set(editor.document.uri, lineDiagnostics);
        }
    }
    
    public validateTag(line: string) {
        let jsonURI:vscode.Uri = vscode.Uri.file(vscode.workspace.rootPath + "/src/html-rules/tags.json");
        let tags = jsonURI.toJSON();
        console.log(tags.selfClosing.tags);
    }
    
    public dispose() {
        this.longLines.clear();
        this.longLines.dispose();
    }
}

class LineCheckerController {
    private _lineChecker: LineChecker;
    private _disposable: vscode.Disposable;
    
    constructor(LineChecker: LineChecker) {
        this._lineChecker = LineChecker;
        this._lineChecker.checkLines();
        
        let subscriptions: vscode.Disposable[] = [];
        vscode.window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
        vscode.window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);
        
        this._lineChecker.checkLines();
        
        this._disposable = vscode.Disposable.from(...subscriptions);
    }
    
    dispose() {
        this._disposable.dispose();
    }
    
    private _onEvent() {
        this._lineChecker.checkLines();
    }
}