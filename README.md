# Lecnar Memory Sync

> No recuerdes dónde te quedaste. Deja que tu editor lo haga por ti.
> *Don't remember where you left off. Let your editor do it for you.*

**Lecnar Memory Sync** guarda tu sesión de trabajo en VS Code automáticamente
y te ofrece un botón de **Restaurar** cuando vuelves después de un cierre
brusco, un apagón o un simple descanso — igual que el botón de "Restaurar
páginas" de tu navegador.

[![Mira el video de Lecnar Memory Sync](https://raw.githubusercontent.com/lecnar7/lecnar-memory-sync/main/images/portada-video.jpg)](https://youtu.be/QVZ9QrwTms0)

[![Apóyame en Ko-fi](https://img.shields.io/badge/Ko--fi-Ap%C3%B3yame-F5B642?logo=ko-fi&logoColor=white)](https://ko-fi.com/lecnar)

## ✨ Funciones

- 🔄 **Guardado automático** — cada vez que cambias de pestaña, editas o
  mueves el cursor, tu sesión se guarda sola en segundo plano.

![Guardado automático](https://raw.githubusercontent.com/lecnar7/lecnar-memory-sync/main/images/1-guardado-automatico.png)

- ⏪ **Botón Restaurar** — si VS Code se cierra de golpe, al volver te aparece
  un aviso para recuperar todo con un solo clic.

![Botón Restaurar](https://raw.githubusercontent.com/lecnar7/lecnar-memory-sync/main/images/2-restaurar.png)

- 🟠 **Faro Mental** — al restaurar, tu editor te lleva directo a la última
  línea que editaste y pinta un mapa de calor suave sobre las líneas donde
  trabajaste más.

![Faro Mental](https://raw.githubusercontent.com/lecnar7/lecnar-memory-sync/main/images/3-faro-mental.png)

- 🌐 **Páginas de referencia** — guarda las páginas web que abriste dentro
  de VS Code con el Simple Browser integrado.

![Páginas de referencia](https://raw.githubusercontent.com/lecnar7/lecnar-memory-sync/main/images/4-puente-web.png)

- 🗣️ **Audio Briefing** — un resumen hablado de en qué te quedaste, leído
  en voz alta con la voz de tu Mac (solo macOS por ahora).

![Audio Briefing](https://raw.githubusercontent.com/lecnar7/lecnar-memory-sync/main/images/5-resumen-voz.png)

- 🌍 **Español e inglés** — se adapta automáticamente al idioma que tengas
  configurado en VS Code.

## 🚀 Cómo usarla

1. Trabaja normal — no necesitas hacer nada especial.
2. Si VS Code se cierra de golpe (o lo cierras tú), la próxima vez que
   abras el proyecto aparecerá un aviso: **"Encontré tu sesión anterior"**.
3. Dale a **Restaurar** y todo vuelve a como estaba: pestañas, cursor,
   línea exacta y mapa de calor.

## ⚙️ Configuración

| Opción | Qué hace | Por defecto |
|---|---|---|
| `lecnar.autosaveDelaySeconds` | Segundos de espera tras un cambio antes de guardar | `2` |
| `lecnar.beaconDurationSeconds` | Segundos que dura encendido el Faro Mental | `8` |
| `lecnar.enableVoiceBriefing` | Activa o desactiva el resumen hablado (macOS) | `true` |

## 📋 Comandos

- **Lecnar: Guardar sesión ahora**
- **Lecnar: Restaurar sesión (Faro Mental)**
- **Lecnar: Descartar sesión guardada**
- **Lecnar: Agregar página web al contexto**

## ☕ Apoya el proyecto

Lecnar Memory Sync es gratis. Si te ahorra tiempo, puedes invitarme un café
en **[ko-fi.com/lecnar](https://ko-fi.com/lecnar)** — me ayuda a seguir mejorándola.

---

*Creada por Lecnar · [Código en GitHub](https://github.com/lecnar7/lecnar-memory-sync) · [Video en YouTube](https://youtu.be/QVZ9QrwTms0)*
