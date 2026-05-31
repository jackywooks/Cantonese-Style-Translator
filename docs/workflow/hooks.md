# Hooks

`.claude/hooks/check-bash.py`(PreToolUse Bash hook)會 block 一啲危險操作:
- `rm -rf` / `xargs rm -rf` / `exec rm -rf`
- `git reset --hard`
- `git push --force` / `--all` / push 到 main/master / bare push 喺 protected branch
- `gh issue / pr` 寫入操作(create / edit / close / reopen / comment / delete / merge)

確認過之後可以加 `CONFIRMED=1` 前綴 bypass:

```bash
CONFIRMED=1 gh pr create ...
```

## Hook Bypass Awareness

- Bash hook 預設 block `git push`、`gh pr create`、`gh issue create` — 確認係 intentional 之後加 `CONFIRMED=1` 前綴。
- PR body:**避免喺同一條 `gh pr create` 命令入面用 heredoc `EOF`**(試過 unclosed EOF 出事)。改用:
  - `gh pr create --body-file /tmp/pr-body.md`(先寫去 temp file)
  - 或 inline single-quoted string 用 `\n` 換行(短 body)
- `gh issue create` / `gh issue comment` 同理。
