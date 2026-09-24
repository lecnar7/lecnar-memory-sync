import * as vscode from 'vscode';
import { exec } from 'child_process';

// ---------- Modelo de datos ----------

interface FileState {
  path: string; // ruta relativa a la carpeta del workspace (portable entre equipos)
  line: number;
  character: number;
}

interface HeatLine {
  path: string;
  line: number;
  weight: number; // cuántas veces se editó
}

interface Snapshot {
  version: 1;
  savedAt: string;
  workspace: string;
  activeFile?: string;
  files: FileState[];
  lastEdit?: FileState;
  heat: HeatLine[];
  webPages: string[];
}

// LIVE: se reescribe sola mientras trabajas.
// RECOVERY: copia de la sesión anterior que espera a que pulses "Restaurar".
// Se separan para que el autoguardado de la sesión nueva no pise la sesión que quieres recuperar.
const LIVE_KEY = 'lecnar.snapshots';
const RECOVERY_KEY = 'lecnar.recovery';

// ---------- Estado en vivo ----------

const cursorByFile = new Map<string, vscode.Position>();
const heatByFile = new Map<string, Map<number, number>>();
let lastEdit: FileState | undefined;
let webPages: string[] = [];
let restoring = false;
let saveTimer: NodeJS.Timeout | undefined;
let statusItem: vscode.StatusBarItem;

// ---------- Faro Mental (decoraciones) ----------

let beaconTypes: vscode.TextEditorDecorationType[] = [];
let beaconTimer: NodeJS.Timeout | undefined;

function createBeaconTypes() {
  const levels = [0.12, 0.22, 0.38];
  beaconTypes = levels.map((alpha) =>
    vscode.window.createTextEditorDecorationType({
      isWholeLine: true,
      backgroundColor: `rgba(255, 170, 0, ${alpha})`,
      overviewRulerColor: 'rgba(255, 170, 0, 0.8)',
      overviewRulerLane: vscode.OverviewRulerLane.Right,
    })
  );
}

function clearBeacon() {
  if (beaconTimer) {
    clearTimeout(beaconTimer);
    beaconTimer = undefined;
  }
  for (const editor of vscode.window.visibleTextEditors) {
    for (const t of beaconTypes) {
      editor.setDecorations(t, []);
    }
  }
}

function paintBeacon(snapshot: Snapshot) {
  const maxWeight = Math.max(1, ...snapshot.heat.map((h) => h.weight));
  for (const editor of vscode.window.visibleTextEditors) {
    if (editor.document.uri.scheme !== 'file') {
      continue;
    }
    const rel = vscode.workspace.asRelativePath(editor.document.uri, false);
    const buckets: vscode.Range[][] = [[], [], []];
    for (const h of snapshot.heat.filter((x) => x.path === rel)) {
      if (h.line >= editor.document.lineCount) {
        continue;
      }
      const ratio = h.weight / maxWeight;
      const level = ratio > 0.66 ? 2 : ratio > 0.33 ? 1 : 0;
      buckets[level].push(new vscode.Range(h.line, 0, h.line, 0));
    }
    if (snapshot.lastEdit && snapshot.lastEdit.path === rel && snapshot.lastEdit.line < editor.document.lineCount) {
      buckets[2].push(new vscode.Range(snapshot.lastEdit.line, 0, snapshot.lastEdit.line, 0));
    }
    beaconTypes.forEach((t, i) => editor.setDecorations(t, buckets[i]));
  }
}

// ---------- Idioma ----------
// Se basa en el idioma que la persona ya tiene configurado en VS Code
// (vscode.env.language, ej. "en", "es", "es-419", "en-US"). Por ahora
// soportamos español e inglés; cualquier otro idioma cae en inglés.

type Lang = 'es' | 'en';

function getLang(): Lang {
  return vscode.env.language.toLowerCase().startsWith('es') ? 'es' : 'en';
}

// Voz del sistema en macOS: cada idioma necesita una voz distinta para que
// 'say' pronuncie bien. Si el usuario no tiene instalada esa voz, macOS usa
// la que tenga por defecto en su lugar (no da error).
const SAY_VOICE: Record<Lang, string> = {
  es: 'Monica',
  en: 'Samantha',
};

// ---------- Audio Briefing (versión simple, sin IA) ----------
// Arma una frase con reglas fijas a partir de lo que ya guardamos (archivo, línea,
// cuántas ediciones tuvo). No entiende el código ni "por qué" te quedaste ahí;
// eso requeriría mandar el contexto a un modelo de IA (versión futura).

function fileLabel(path: string): string {
  const name = path.split('/').pop() ?? path;
  return name;
}

function buildBriefingText(snapshot: Snapshot, lang: Lang): string {
  const parts: string[] = [];
  const total = snapshot.files.length;

  if (total === 0) {
    return lang === 'es'
      ? 'No encontré pestañas guardadas en esta sesión.'
      : "I didn't find any saved tabs for this session.";
  }

  if (lang === 'es') {
    parts.push(`Bienvenido de vuelta. Tenías ${total} ${total === 1 ? 'archivo abierto' : 'archivos abiertos'}.`);
  } else {
    parts.push(`Welcome back. You had ${total} ${total === 1 ? 'file open' : 'files open'}.`);
  }

  if (snapshot.lastEdit) {
    const editCount = snapshot.heat.find(
      (h) => h.path === snapshot.lastEdit!.path && h.line === snapshot.lastEdit!.line
    )?.weight;
    if (lang === 'es') {
      parts.push(
        `Lo último que editaste fue en ${fileLabel(snapshot.lastEdit.path)}, cerca de la línea ${
          snapshot.lastEdit.line + 1
        }${editCount && editCount > 1 ? `, donde hiciste ${editCount} cambios seguidos` : ''}.`
      );
    } else {
      parts.push(
        `The last thing you edited was in ${fileLabel(snapshot.lastEdit.path)}, around line ${
          snapshot.lastEdit.line + 1
        }${editCount && editCount > 1 ? `, where you made ${editCount} changes in a row` : ''}.`
      );
    }
  }

  const topFiles = [...new Set(snapshot.heat.map((h) => h.path))].slice(0, 3).filter((p) => p !== snapshot.lastEdit?.path);
  if (topFiles.length > 0) {
    parts.push(
      lang === 'es'
        ? `También estuviste trabajando en ${topFiles.map(fileLabel).join(', ')}.`
        : `You were also working on ${topFiles.map(fileLabel).join(', ')}.`
    );
  }

  if (snapshot.webPages.length > 0) {
    if (lang === 'es') {
      parts.push(
        `Tenías ${snapshot.webPages.length} ${
          snapshot.webPages.length === 1 ? 'página web guardada' : 'páginas web guardadas'
        } de referencia.`
      );
    } else {
      parts.push(
        `You had ${snapshot.webPages.length} reference ${snapshot.webPages.length === 1 ? 'web page' : 'web pages'} saved.`
      );
    }
  }

  return parts.join(' ');
}

function speakBriefing(snapshot: Snapshot) {
  const enabled = vscode.workspace.getConfiguration('lecnar').get<boolean>('enableVoiceBriefing', true);
  if (!enabled) {
    return;
  }
  if (process.platform !== 'darwin') {
    // 'say' es propio de macOS; en otros sistemas simplemente no se lee en voz alta.
    return;
  }
  const lang = getLang();
  const text = buildBriefingText(snapshot, lang);
  const safe = text.replace(/"/g, "'"); // evita romper el comando por comillas dobles
  exec(`say -v "${SAY_VOICE[lang]}" "${safe}"`, (error: Error | null) => {
    if (error) {
      // Si la voz elegida no está instalada, se reintenta con la voz por defecto del sistema
      exec(`say "${safe}"`, (fallbackError: Error | null) => {
        if (fallbackError) {
          vscode.window.showWarningMessage(vscode.l10n.t('Lecnar: could not play the audio summary.'));
        }
      });
    }
  });
}

// ---------- Almacenamiento ----------

function workspaceKey(): string | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.name;
}

function loadMap(ctx: vscode.ExtensionContext, storeKey: string): Record<string, Snapshot> {
  return ctx.globalState.get<Record<string, Snapshot>>(storeKey, {});
}

async function putSnapshot(ctx: vscode.ExtensionContext, storeKey: string, snap: Snapshot | undefined) {
  const key = workspaceKey();
  if (!key) {
    return;
  }
  const map = loadMap(ctx, storeKey);
  if (snap) {
    map[key] = snap;
  } else {
    delete map[key];
  }
  await ctx.globalState.update(storeKey, map);
}

// ---------- Captura del estado ----------

function buildSnapshot(): Snapshot | undefined {
  const key = workspaceKey();
  if (!key) {
    return undefined;
  }

  const files: FileState[] = [];
  for (const group of vscode.window.tabGroups.all) {
    for (const tab of group.tabs) {
      if (tab.input instanceof vscode.TabInputText && tab.input.uri.scheme === 'file') {
        const uri = tab.input.uri;
        const pos = cursorByFile.get(uri.toString()) ?? new vscode.Position(0, 0);
        files.push({
          path: vscode.workspace.asRelativePath(uri, false),
          line: pos.line,
          character: pos.character,
        });
      }
    }
  }

  const heat: HeatLine[] = [];
  for (const [path, lines] of heatByFile) {
    for (const [line, weight] of lines) {
      heat.push({ path, line, weight });
    }
  }
  heat.sort((a, b) => b.weight - a.weight);

  const active = vscode.window.activeTextEditor;
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    workspace: key,
    activeFile: active ? vscode.workspace.asRelativePath(active.document.uri, false) : undefined,
    files,
    lastEdit,
    heat: heat.slice(0, 30),
    webPages,
  };
}

async function saveLive(ctx: vscode.ExtensionContext): Promise<Snapshot | undefined> {
  if (restoring) {
    return undefined;
  }
  const snap = buildSnapshot();
  // Nunca guardar un estado vacío: podría borrar lo único que sirve para recuperar
  if (!snap || (snap.files.length === 0 && snap.webPages.length === 0)) {
    return undefined;
  }
  await putSnapshot(ctx, LIVE_KEY, snap);
  return snap;
}

function scheduleSave(ctx: vscode.ExtensionContext) {
  if (saveTimer) {
    clearTimeout(saveTimer);
  }
  const seconds = vscode.workspace.getConfiguration('lecnar').get<number>('autosaveDelaySeconds', 2);
  saveTimer = setTimeout(() => {
    saveTimer = undefined;
    void saveLive(ctx);
  }, seconds * 1000);
}

// ---------- Comandos ----------

async function saveNow(ctx: vscode.ExtensionContext) {
  const snap = await saveLive(ctx);
  if (snap) {
    vscode.window.showInformationMessage(
      vscode.l10n.t('Lecnar: session saved ({0} files, {1} web pages).', snap.files.length, snap.webPages.length)
    );
  } else {
    vscode.window.showWarningMessage(
      vscode.l10n.t('Lecnar: nothing to save (open a folder and a file first).')
    );
  }
}

async function restore(ctx: vscode.ExtensionContext) {
  const key = workspaceKey();
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!key || !folder) {
    return;
  }
  const snapshot = loadMap(ctx, RECOVERY_KEY)[key] ?? loadMap(ctx, LIVE_KEY)[key];
  if (!snapshot) {
    vscode.window.showInformationMessage(vscode.l10n.t('Lecnar: no saved session for this project.'));
    return;
  }

  restoring = true; // evita que el autoguardado guarde un estado a medias
  try {
    // Sembrar el estado en vivo para que el siguiente autoguardado no pierda datos
    heatByFile.clear();
    for (const h of snapshot.heat) {
      let lines = heatByFile.get(h.path);
      if (!lines) {
        lines = new Map();
        heatByFile.set(h.path, lines);
      }
      lines.set(h.line, h.weight);
    }
    lastEdit = snapshot.lastEdit;
    webPages = [...snapshot.webPages];

    // 1) Reabrir archivos en su posición
    for (const f of snapshot.files) {
      try {
        const uri = vscode.Uri.joinPath(folder.uri, f.path);
        const doc = await vscode.workspace.openTextDocument(uri);
        const pos = new vscode.Position(Math.min(f.line, doc.lineCount - 1), f.character);
        cursorByFile.set(uri.toString(), pos);
        await vscode.window.showTextDocument(doc, {
          preview: false,
          preserveFocus: true,
          selection: new vscode.Range(pos, pos),
        });
      } catch {
        // archivo movido o borrado: se omite
      }
    }

    // 2) Páginas web en el Simple Browser integrado
    for (const url of snapshot.webPages) {
      await vscode.commands.executeCommand('simpleBrowser.show', url);
    }

    // 3) Faro Mental
    if (snapshot.lastEdit) {
      try {
        const uri = vscode.Uri.joinPath(folder.uri, snapshot.lastEdit.path);
        const doc = await vscode.workspace.openTextDocument(uri);
        const line = Math.min(snapshot.lastEdit.line, doc.lineCount - 1);
        const pos = new vscode.Position(line, snapshot.lastEdit.character);
        const editor = await vscode.window.showTextDocument(doc, { preview: false, selection: new vscode.Range(pos, pos) });
        editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter);
      } catch {
        vscode.window.showWarningMessage(vscode.l10n.t("Lecnar: couldn't open the file from the last edit."));
      }
    }

    paintBeacon(snapshot);
    speakBriefing(snapshot);
    const seconds = vscode.workspace.getConfiguration('lecnar').get<number>('beaconDurationSeconds', 8);
    if (beaconTimer) {
      clearTimeout(beaconTimer);
    }
    beaconTimer = setTimeout(clearBeacon, seconds * 1000);
  } finally {
    restoring = false;
  }

  // La sesión ya se recuperó: se retira el aviso y se vuelve al autoguardado normal
  await putSnapshot(ctx, RECOVERY_KEY, undefined);
  statusItem.hide();
  await saveLive(ctx);
}

async function discard(ctx: vscode.ExtensionContext) {
  await putSnapshot(ctx, RECOVERY_KEY, undefined);
  statusItem.hide();
}

async function addWebPage(ctx: vscode.ExtensionContext) {
  const url = await vscode.window.showInputBox({
    prompt: vscode.l10n.t('URL of the page you want to save to your context'),
    placeHolder: 'https://developer.mozilla.org/...',
    validateInput: (v) => (/^https?:\/\//i.test(v) ? undefined : vscode.l10n.t('Must start with http:// or https://')),
  });
  if (!url) {
    return;
  }
  if (!webPages.includes(url)) {
    webPages.push(url);
  }
  await vscode.commands.executeCommand('simpleBrowser.show', url);
  scheduleSave(ctx);
}

// ---------- Activación ----------

export async function activate(ctx: vscode.ExtensionContext) {
  createBeaconTypes();
  ctx.globalState.setKeysForSync([LIVE_KEY, RECOVERY_KEY]);

  statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusItem.text = `$(history) ${vscode.l10n.t('Restore session')}`;
  statusItem.tooltip = vscode.l10n.t("Lecnar: reopen your last session's tabs");
  statusItem.command = 'lecnar.restore';
  ctx.subscriptions.push(statusItem);

  // Si hay una sesión anterior y aún no se ha resuelto ninguna, se guarda como "recuperable"
  const key = workspaceKey();
  if (key) {
    const hasRecovery = !!loadMap(ctx, RECOVERY_KEY)[key];
    const live = loadMap(ctx, LIVE_KEY)[key];
    if (!hasRecovery && live) {
      await putSnapshot(ctx, RECOVERY_KEY, live);
    }
  }

  // Autoguardado: cada cambio relevante programa un guardado con pequeño retraso
  ctx.subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection((e) => {
      if (e.textEditor.document.uri.scheme === 'file') {
        cursorByFile.set(e.textEditor.document.uri.toString(), e.selections[0].active);
        scheduleSave(ctx);
      }
    }),
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.scheme !== 'file' || e.contentChanges.length === 0) {
        return;
      }
      const rel = vscode.workspace.asRelativePath(e.document.uri, false);
      const change = e.contentChanges[e.contentChanges.length - 1];
      lastEdit = { path: rel, line: change.range.start.line, character: change.range.start.character };

      let lines = heatByFile.get(rel);
      if (!lines) {
        lines = new Map();
        heatByFile.set(rel, lines);
      }
      for (const c of e.contentChanges) {
        const l = c.range.start.line;
        lines.set(l, (lines.get(l) ?? 0) + 1);
      }
      scheduleSave(ctx);
    }),
    vscode.window.tabGroups.onDidChangeTabs(() => scheduleSave(ctx)),
    vscode.window.onDidChangeActiveTextEditor(() => scheduleSave(ctx))
  );

  ctx.subscriptions.push(
    vscode.commands.registerCommand('lecnar.freeze', () => saveNow(ctx)),
    vscode.commands.registerCommand('lecnar.restore', () => restore(ctx)),
    vscode.commands.registerCommand('lecnar.discard', () => discard(ctx)),
    vscode.commands.registerCommand('lecnar.addWebPage', () => addWebPage(ctx)),
    vscode.commands.registerCommand('lecnar.clearBeacon', () => clearBeacon())
  );

  // Aviso de restauración al abrir el proyecto
  if (key) {
    const recovery = loadMap(ctx, RECOVERY_KEY)[key];
    if (recovery) {
      statusItem.show();
      const saved = new Date(recovery.savedAt).toLocaleString();
      const restoreLabel = vscode.l10n.t('Restore');
      const discardLabel = vscode.l10n.t('Discard');
      const choice = await vscode.window.showInformationMessage(
        vscode.l10n.t(
          'Lecnar: found your previous session ({0} files, saved {1}).',
          recovery.files.length,
          saved
        ),
        restoreLabel,
        discardLabel
      );
      if (choice === restoreLabel) {
        await restore(ctx);
      } else if (choice === discardLabel) {
        await discard(ctx);
      }
    }
  }
}

export function deactivate() {
  clearBeacon();
  beaconTypes.forEach((t) => t.dispose());
}
