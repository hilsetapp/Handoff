# 🎓 Личный гайд: как запустить и пользоваться handoff

Этот файл — для тебя. Пошагово, без предположений, что ты что-то уже знаешь.
Просто выполняй команды по порядку. Весь путь займёт ~10 минут.

---

## Часть 0. Что это вообще такое (простыми словами)

`handoff` — это консольная программа (CLI), которую ты написал.
Она живёт в папке `/home/user/handoff`.

Когда ты работаешь над проектом с AI-агентами (Claude Code, Cursor, Copilot и т.д.),
каждый новый инструмент «ничего не помнит» о прошлой сессии.
`handoff` решает это: одна команда — и всё важное (планы, решения, ошибки,
статус тестов, состояние git) записывается в файл `.handoff/HANDOFF.md`,
который любой агент прочитает и продолжит с того же места.

**Программа уже собрана и готова к работе.** Ничего качать не нужно.

---

## Часть 1. Попробовать прямо сейчас (2 минуты)

Открой терминал и выполни:

```bash
cd /home/user/handoff
node dist/cli.js --help
```

Увидишь список всех команд. Это и есть твоя программа: запускается через
`node dist/cli.js` (в папке `dist` лежит скомпилированный код).

### Попробуем на игрушечном проекте

```bash
# 1. Создаём пустую тестовую папку и делаем из неё git-репозиторий
mkdir -p /tmp/probka && cd /tmp/probka
git init
echo "# Мой проект" > README.md
git add . && git commit -m "start"

# 2. Инициализируем handoff внутри этого проекта
node /home/user/handoff/dist/cli.js init

# 3. Записываем заметки (как будто работаем)
node /home/user/handoff/dist/cli.js next "Доделать страницу логина"
node /home/user/handoff/dist/cli.js decision "Используем PostgreSQL — нужна надёжность"
node /home/user/handoff/dist/cli.js failed "MongoDB — слишком много миграций"

# 4. Сохраняем снапшот
node /home/user/handoff/dist/cli.js save

# 5. Смотрим, что получилось
node /home/user/handoff/dist/cli.js show
cat .handoff/HANDOFF.md
```

Вот и весь цикл работы. Файл `.handoff/HANDOFF.md` — это и есть «контекст»,
который подхватит любой AI-агент.

---

## Часть 2. Сделать короткую команду `handoff` (1 минута)

Писать `node /home/user/handoff/dist/cli.js` каждый раз — неудобно.
Есть два способа получить короткую команду.

### Способ А — `npm link` (рекомендую для разработки)

```bash
cd /home/user/handoff
npm link
```

Теперь из ЛЮБОЙ папки работает просто:

```bash
handoff --help
handoff save
```

> Как это работает: `npm link` создаёт глобальную ссылку на твою папку.
> Ты правишь код → `npm run build` → команда сразу использует новую версию.

### Способ Б — alias (если npm link почему-то не сработал)

```bash
echo 'alias handoff="node /home/user/handoff/dist/cli.js"' >> ~/.bashrc
source ~/.bashrc
handoff --help
```

(Если у тебя zsh — замени `~/.bashrc` на `~/.zshrc`.)

---

## Часть 3. Ежедневный сценарий работы (шпаргалка)

```bash
# ── начало рабочего дня ─────────────────────────────
handoff next "Что собираюсь делать сегодня"

# ── в процессе ──────────────────────────────────────
handoff decision "Выбрал подход X, потому что Y"
handoff failed "Пробовал Z — не работает из-за W"
handoff blocker "Жду доступ к API"

# ── что-то сделано ──────────────────────────────────
handoff done 1            # номер пункта из handoff show
handoff show              # посмотреть текущее состояние

# ── конец дня / перед переключением на другой AI ────
handoff save -m "Коротко: над чем работал и где остановился"

# ── один раз на проект: подключить AI-инструменты ───
handoff sync --with claude,cursor,copilot,gemini

# ── задача завершена, начинаем новую ────────────────
handoff archive           # снапшот уедет в .handoff/archive/
```

Главное правило: **`handoff save` — перед тем как открыть другой AI-агент
или закончить сессию.** Остальные команды — просто записная книжка.

---

## Часть 4. Выложить проект на GitHub (пошагово)

### Шаг 1. Создай пустой репозиторий

1. Зайди на https://github.com/new
2. Repository name: `handoff`
3. Оставь **Public**
4. **НЕ ставь** галочки «Add a README», «Add .gitignore», «License» —
   у тебя это всё уже есть локально
5. Нажми **Create repository**

### Шаг 2. Замени заглушку `yourname` на свой логин

В коде и документах встречается `yourname` — это нужно заменить на свой
GitHub-логин одной командой:

```bash
cd /home/user/handoff
# замени ТВОЙ_ЛОГИН на свой ник на GitHub (3 раза в команде ниже!)
grep -rl "yourname" . --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=dist \
  | xargs sed -i 's|yourname|ТВОЙ_ЛОГИН|g'
npm run build   # пересобрать после правки исходников
```

### Шаг 3. Отправь код

GitHub после создания покажет подсказку «push an existing repository». Суть:

```bash
cd /home/user/handoff
git remote add origin https://github.com/ТВОЙ_ЛОГИН/handoff.git
git add -A && git commit -m "docs: русская версия README и гайд"
git branch -M main
git push -u origin main
```

GitHub спросит логин/пароль → пароль НЕ подойдёт, нужен **Personal Access Token**:
`Settings → Developer settings → Personal access tokens → Tokens (classic) →
Generate new token` → отметь галочку `repo` → скопируй токен и вставь его вместо
пароля. (Или используй GitHub CLI: `gh auth login` — он всё сделает через браузер.)

✅ Готово — проект на GitHub. Обнови страницу и полюбуйся.

---

## Часть 5. Опубликовать в npm (чтобы люди ставили одной командой)

Делай это, когда будешь готов «выпустить» проект миру.

```bash
# 1. Один раз: регистрация на https://www.npmjs.com/signup
# 2. Логин в терминале
npm login

# 3. Проверь, что имя свободно
npm view handoff-context
# ответ "404 Not Found" — значит имя свободно, отлично

# 4. Публикация (само соберётся через prepublishOnly)
cd /home/user/handoff
npm publish --access public
```

После этого любой человек в мире сможет написать:

```bash
npm install -g handoff-context
handoff init
```

> Если имя `handoff-context` займут — придумаем другое: поправим
> поле `name` в `package.json` и всё.

---

## Часть 6. Ты поменял код — что дальше?

```bash
cd /home/user/handoff
npm run typecheck   # проверить типы
npm test            # прогнать 36 тестов
npm run build       # пересобрать в dist/
git add -A
git commit -m "описание изменений"
git push
```

Если опубликован в npm — ещё подними версию и перевыпусти:

```bash
npm version patch   # 0.1.0 → 0.1.1
npm publish
git push --follow-tags
```

---

## Часть 7. Если что-то пошло не так (FAQ)

| Симптом | Причина и лечение |
|---|---|
| `handoff: command not found` | Команда не установлена. Либо сделай Часть 2 (`npm link`), либо вызывай через `node /home/user/handoff/dist/cli.js` |
| `no .handoff/ found` | Ты не в папке проекта-репозитория. `cd` в нужный проект и `handoff init` |
| `node: command not found` | Node.js не установлен. Ставится с https://nodejs.org (версия 18+) |
| Тесты падают в `handoff save` | Инструмент честно прогоняет `npm test` твоего проекта. Быстрый снапшот без тестов: `handoff save --no-test` |
| `git: command not found` | Не установлен git: https://git-scm.com/downloads |
| Странные символы `\x1b[...` в выводе | Терминал не поддерживает цвета. Запусти с `NO_COLOR=1 handoff show` |
| Не пушится на GitHub, просит пароль | Пароль не работает — нужен Personal Access Token (см. Часть 4, шаг 3) |

---

## Часть 8. Карта проекта (что где лежит)

```
/home/user/handoff
├── src/                  ← ИСХОДНИКИ (правишь только их)
│   ├── cli.ts            ← точка входа: список команд
│   ├── commands/         ← init, save, show, note, sync, archive
│   ├── git.ts            ← чтение состояния git
│   ├── snapshot.ts       ← генерация HANDOFF.md
│   └── sync.ts           ← запись в AGENTS.md, CLAUDE.md и т.д.
├── test/                 ← 36 автотестов (npm test)
├── dist/                 ← собранный код (не трогай, генерируется npm run build)
├── README.md             ← лицо проекта (англ.)
├── README.ru.md          ← лицо проекта (рус.)
├── GUIDE_RU.md           ← этот файл
└── .github/workflows/    ← CI: тесты запускаются сами при каждом push
```

**Правило №1: правки — только в `src/`, потом `npm run build`.**
`dist/` пересоздаётся автоматически.

---

Остались вопросы — просто спроси: «объясни, что делает команда X» или
«почему команда Y выдала ошибку Z» (пришли вывод целиком).
