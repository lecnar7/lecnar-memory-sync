# Lecnar Memory Sync

> Don't remember where you left off. Let your editor do it for you.

🇪🇸 [Leer en español](https://github.com/lecnar7/lecnar-memory-sync/blob/main/README.es.md)

**VS Code restores your files. Lecnar Memory Sync restores *where you were*:** the exact line you were editing, a heatmap of where you worked, and the reference pages you had open.

It saves your session automatically in the background. After a crash, a power outage or just a long break, you get a **Restore** button — like "Restore pages" in your browser.

<!-- TODO: add the GIF here (crash → reopen → Restore → Mental Beacon), e.g.:
![Lecnar Memory Sync demo](https://raw.githubusercontent.com/lecnar7/lecnar-memory-sync/main/images/demo.gif)
-->

[![Watch the Lecnar Memory Sync video](https://raw.githubusercontent.com/lecnar7/lecnar-memory-sync/main/images/portada-video.jpg)](https://youtu.be/QVZ9QrwTms0)

## Why I built it

I live in the Dominican Republic, where the power goes out more often than I'd like. VS Code always brought my files back, but I kept losing my train of thought: which line I was on, which docs I was reading, what I was in the middle of. Lecnar Memory Sync fixes that.

## ✨ Features

- 🔄 **Automatic saving** — every time you switch tabs, edit or move the cursor, your session is saved quietly in the background. Nothing to remember.

![Automatic saving](https://raw.githubusercontent.com/lecnar7/lecnar-memory-sync/main/images/1-guardado-automatico.png)

- ⏪ **Restore button** — if VS Code closes unexpectedly, you'll see a prompt next time you open the project. One click and everything is back.

![Restore button](https://raw.githubusercontent.com/lecnar7/lecnar-memory-sync/main/images/2-restaurar.png)

- 🟠 **Mental Beacon** — on restore, your editor jumps straight to the last line you edited and paints a soft heatmap over the lines where you worked the most.

![Mental Beacon](https://raw.githubusercontent.com/lecnar7/lecnar-memory-sync/main/images/3-faro-mental.png)

- 🌐 **Reference pages** — remembers the web pages you opened inside VS Code with the built-in Simple Browser, and reopens them.

![Reference pages](https://raw.githubusercontent.com/lecnar7/lecnar-memory-sync/main/images/4-puente-web.png)

- 🗣️ **Audio briefing** — a short spoken summary of where you left off, read aloud with your Mac's voice (macOS only for now).

![Audio briefing](https://raw.githubusercontent.com/lecnar7/lecnar-memory-sync/main/images/5-resumen-voz.png)

- 🌍 **English and Spanish** — follows the language you use in VS Code.

## 🚀 How to use it

1. Just work as usual — there's nothing to set up.
2. If VS Code closes suddenly (or you close it), the next time you open the project you'll see: **"Found your previous session"**.
3. Click **Restore**: tabs, cursor, exact line and heatmap come back.

## 🔒 Privacy

- No servers, no accounts, no telemetry. The extension never sends your data anywhere.
- Your session is stored in VS Code's own extension storage on your computer.
- If you use VS Code **Settings Sync**, your saved session can also sync between your own devices through your Settings Sync account.

## ⚙️ Settings

| Setting | What it does | Default |
|---|---|---|
| `lecnar.autosaveDelaySeconds` | Seconds to wait after a change before saving | `2` |
| `lecnar.beaconDurationSeconds` | Seconds the Mental Beacon stays on | `8` |
| `lecnar.enableVoiceBriefing` | Turns the spoken summary on or off (macOS) | `true` |

## 📋 Commands

- **Lecnar: Save session now**
- **Lecnar: Restore session (Mental Beacon)**
- **Lecnar: Discard saved session**
- **Lecnar: Add web page to context**

## ⭐ Like it?

If Lecnar Memory Sync saved you time, a **rating on the Marketplace** helps other developers find it — and it means a lot to me as a first-time extension author.

Found a bug or have an idea? [Open an issue on GitHub](https://github.com/lecnar7/lecnar-memory-sync/issues).

## ☕ Support

Lecnar Memory Sync is free. If you'd like to support it, you can buy me a coffee at **[ko-fi.com/lecnar](https://ko-fi.com/lecnar)**.

---

*Made by Lecnar · [Source on GitHub](https://github.com/lecnar7/lecnar-memory-sync) · [Video on YouTube](https://youtu.be/QVZ9QrwTms0)*