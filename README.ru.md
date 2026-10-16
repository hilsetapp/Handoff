[English](README.md) | **Русский**

<p align="center">
  <img src="assets/logo.png" alt="логотип handoff" width="140">
</p>

<h1 align="center">handoff</h1>

<p align="center">
  <strong>Портативный контекст сессии для AI-агентов программирования.</strong><br>
  Сохрани рабочее состояние один раз - Claude Code, Codex, Cursor, Copilot,<br>
  Gemini CLI и любой другой агент подхватит его мгновенно.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/handoff-context"><img src="https://img.shields.io/npm/v/handoff-context?color=4F46E5&label=npm" alt="npm version"></a>
  <a href="https://github.com/hilsetapp/Handoff/actions/workflows/ci.yml"><img src="https://github.com/hilsetapp/Handoff/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="license: MIT"></a>
  <img src="https://img.shields.io/badge/node-%E2%89%A518-339933" alt="node >= 18">
  <a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs welcome"></a>
</p>

---

Больше никаких повторных объяснений. Никаких агентов, которые заново пробуют подходы, которые ты уже отверг.

```
npm install -g handoff-context
```

---

## Проблема

Современная разработка - это работа с несколькими AI-инструментами: исследуешь в **Cursor**, чинишь в **Claude Code**, выкатываешь через **Copilot** в CI. Но каждая сессия начинается с чистого листа. Агент не знает:

- ✅ что ты уже решил - и *почему*
- 🚫 какие подходы **провалились** и повторять их нельзя
- 📋 что на самом деле дальше по плану
- 🧪 проходили ли тесты
- 🌿 в каком состоянии рабочее дерево git

[AGENTS.md](https://agents.md) решил вопрос *статических* инструкций к проекту. Но никто не переносит твоё **живое состояние сессии** между инструментами. Эту нишу и закрывает `handoff` - портативный **формат файла контекста**, а не очередной чат-интерфейс.

## Решение

`handoff` ведёт файл `.handoff/HANDOFF.md` - структурированный Markdown-снапшот твоего рабочего состояния. Создаётся одной командой, читается любым агентом:

| | AGENTS.md | `.handoff/HANDOFF.md` |
|---|---|---|
| Охват | Стабильные правила проекта | Живое состояние сессии |
| Меняется | Редко | Каждую рабочую сессию |
| Кто пишет | Люди | `handoff save` (из git + твоих заметок + тестов) |
| Отвечает на вопрос | «Как устроен проект?» | «На чём остановились? Что делать дальше?» |

Они дополняют друг друга. `handoff sync` связывает их автоматически.

## Тур за 60 секунд

```console
$ handoff init                              # определяет проект и команду тестов
$ handoff next "Написать интеграционные тесты для сессий"
$ handoff decision "SQLite для кэша токенов: требование offline-first"
$ handoff failed "redis как кэш - лишняя инфраструктурная зависимость"
$ handoff save -m "Заканчиваю flow обновления токенов к релизу 1.5"

running npm test …
✔ Snapshot saved → .handoff/HANDOFF.md
  notes          1 next step · 1 decision · 1 failed approach (+1 done)
  git            branch feat/token-refresh · 2 uncommitted files (1 file changed, 1 insertion(+))
  tests          PASS (npm test)

$ handoff sync --with claude,cursor

✔ agents wired to your handoff context
  updated        AGENTS.md
  updated        CLAUDE.md
  updated        .cursor/rules/handoff.mdc
```

Сгенерированный `.handoff/HANDOFF.md`:

```markdown
# Session handoff - orbit-api

> AI coding agents: read this file at session start, before touching code.

**Focus:** Finishing the token-refresh flow before release 1.5

## Next steps
- [x] Implement token refresh in /auth
- [ ] Write integration tests for sliding sessions

## Decisions made
- 2026-10-10 - SQLite for token cache: offline-first requirement, no extra infra

## Failed approaches (do not retry)
- 2026-10-10 - redis as a cache - adds an infra dependency we do not want

## Working tree
- branch `feat/token-refresh` · HEAD `d95ad84`
- Uncommitted changes (2): 1 file changed, 1 insertion(+)
  - modified `src/auth.ts`

## Tests
- `npm test` - ✅ PASS (exit 0) · 2026-10-10T16:32:49Z
```

Теперь открой *любого* агента - он прочитает файл и продолжит ровно с того места, где закончил предыдущий инструмент.

## Команды

> 🎓 Совсем новичок? Пошаговая инструкция «с нуля до публикации» - в [GUIDE_RU.md](GUIDE_RU.md).

| Команда | Что делает |
|---|---|
| `handoff init` | Создаёт `.handoff/`; сам находит команду тестов в `package.json` |
| `handoff save [-m "..."]` | Снапшот git + заметки + результаты тестов → `HANDOFF.md` |
| `handoff next "..."` | Записать следующий шаг (также `decision`, `failed`, `blocker`) |
| `handoff done 1 2` | Отметить шаги выполненными (номера из `handoff show`) |
| `handoff show` | Обзор статуса; предупреждает, если дерево изменилось с момента снапшота |
| `handoff sync [--with ...]` | Подключает файлы агентов: `AGENTS.md`, плюс `claude`,`cursor`,`copilot`,`gemini` |
| `handoff archive` | Завершить сессию: архивирует снапшот, очищает заметки |
| `handoff clear` | Удалить выполненные шаги |

`handoff save --no-test` пропускает прогон тестов для быстрого снапшота; `"autoRunTests": false` в `.handoff/config.json` отключает его насовсем.

## Безопасно по дизайну

- **Не затирает твои документы.** `sync` обновляет строго блок `<!-- handoff:start --> … <!-- handoff:end -->` - всё остальное в `AGENTS.md` / `CLAUDE.md` остаётся нетронутым.
- **Обычные файлы, обычный git.** `.handoff/` - это JSON + Markdown. Закоммить, чтобы делиться контекстом с командой (и её агентами), или добавь в `.gitignore`, чтобы оставить локально - твой выбор.
- **Ноль телеметрии, две зависимости** (`commander`, `picocolors`). Читает только твой репозиторий.

Работает с любым агентом, умеющим читать Markdown, - то есть со всеми. Цели sync - просто удобные указатели туда, куда каждый инструмент смотрит автоматически.

## Дорожная карта

- [ ] Режим `--watch`: автообновление снапшота при изменениях в git
- [ ] `handoff diff`: что изменилось между двумя снапшотами
- [ ] Установка git-хуков (снапшот при checkout/merge)
- [ ] MCP-сервер, чтобы агенты запрашивали контекст программно
- [ ] Командный режим: слияние заметок из разных веток без конфликтов

## Как помочь проекту

Issues и PR приветствуются - см. [CONTRIBUTING.md](CONTRIBUTING.md). Хорошие первые задачи: новые цели sync, улучшенный вывод хвостов тестов, переводы генерируемого файла.

Если `handoff` избавил тебя от повторных объяснений проекта агенту - **поставь звезду** ⭐ и расскажи другу.

## Лицензия

[MIT](LICENSE)
