# 뉴스레터 자동 갱신 (작업 스케줄러에서 호출). REFRESH.md 절차대로 갱신 후 커밋·푸시한다.
Set-Location "C:\webdev\5. AI_PlayGround"
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$log = "C:\webdev\5. AI_PlayGround\refresh.log"
$prompt = @'
C:\webdev\5. AI_PlayGround\REFRESH.md 를 읽고 그 절차대로 오늘자 슈어소프트 뉴스레터를 갱신해 줘.
이어서 변경된 newsletter-data.mjs, suresoft_newsletter.html, archive/ 의 새 파일만 git add 하고 "Update newsletter <YYYY-MM-DD>" 로 커밋한 뒤 git push 해 줘. 다른 untracked 파일은 커밋하지 마.
REFRESH.md 1번 표의 게시판을 빠짐없이 모두 확인하고, 사람에게 되묻지 말고 끝까지 스스로 처리해.
게시판에 새 글이 없어 내용이 바뀌지 않으면 커밋·푸시하지 말고 그렇게 알려 줘. 그룹웨어는 읽기만 해.
'@
"=== $(Get-Date -Format 'yyyy-MM-dd HH:mm') ===" | Out-File $log -Append -Encoding utf8
& claude -p $prompt --chrome `
  --allowedTools "mcp__claude-in-chrome" "Read" "Edit" "Write" "Glob" "Grep" `
    "Bash(node build.mjs)" "Bash(git status:*)" "Bash(git diff:*)" "Bash(git log:*)" `
    "Bash(git add:*)" "Bash(git commit:*)" "Bash(git push)" "Bash(git push origin main)" `
  2>&1 | Out-File $log -Append -Encoding utf8
