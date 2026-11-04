# 뉴스레터 자동 갱신 (작업 스케줄러에서 호출).
# 에이전트는 게시판을 읽어 newsletter-data.mjs 만 수정한다. 빌드·커밋·푸시는 이 스크립트가 직접 한다.
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$dir = "C:\webdev\5. AI_PlayGround"
Set-Location $dir
$log = Join-Path $dir "refresh.log"
$failFile = Join-Path $dir "refresh-FAILED.txt"
function Log($m) { $m | Out-File $log -Append -Encoding utf8 }
# 네이티브 명령의 stderr 경고를 PowerShell 오류로 취급하지 않도록 cmd 를 거쳐 실행한다.
function Sh($c) { (cmd /c "$c 2>&1") | Out-File $log -Append -Encoding utf8 }

function Fail($msg) {
  Log "[script] 실패: $msg"
  "$(Get-Date -Format 'yyyy-MM-dd HH:mm') $msg" | Out-File $failFile -Encoding utf8
  try {
    Add-Type -AssemblyName System.Windows.Forms
    $n = New-Object System.Windows.Forms.NotifyIcon
    $n.Icon = [System.Drawing.SystemIcons]::Warning
    $n.Visible = $true
    $n.ShowBalloonTip(15000, "뉴스레터 갱신 실패", $msg, [System.Windows.Forms.ToolTipIcon]::Warning)
    Start-Sleep 16; $n.Dispose()
  } catch {}
  exit 1
}

Log "=== $(Get-Date -Format 'yyyy-MM-dd HH:mm') ==="
Remove-Item $failFile -ErrorAction SilentlyContinue

# 1. Chrome 이 꺼져 있으면 띄우고 확장이 연결될 때까지 기다린다.
if (-not (Get-Process chrome -ErrorAction SilentlyContinue)) {
  Log "[script] Chrome 이 꺼져 있어 실행합니다"
  Start-Process chrome
  Start-Sleep 30
}

$today = Get-Date -Format 'yyyy-MM-dd'
$prompt = @"
오늘은 $today 이다. C:\webdev\5. AI_PlayGround\REFRESH.md 의 1~2-1 절차대로 오늘자 뉴스레터 데이터(newsletter-data.mjs)만 갱신해 줘.
- Chrome 탭 그룹이 없으면 tabs_context_mcp 를 createIfEmpty:true 로 호출해 만든다.
- 오늘 이미 갱신된 적이 있어도 생략하지 마. 다음 게시판 번호 전부를 https://gw.suresofttech.com/app/board/<번호> 로 하나씩 열어 직접 읽어: 40 46 380 41 42 43 44 45 47 48 49 50 52 53 55 56 57 280 411 58 61 62 63 64 66. 하나도 건너뛰지 마.
- 새 글이 없어도 매일 바뀌는 항목은 반드시 고친다: issued 는 오늘 날짜, range 는 최근 약 한 달~오늘, 카드뉴스의 '오늘의 점심' 카드(날짜·요일·메뉴는 주간메뉴 데이터의 오늘자 .day 에서), 어제까지의 NEW(isNew) 해제, 기간 밖이 된 오래된 항목 정리.
- 그룹웨어는 읽기만 해. 빌드·git 은 하지 마(스크립트가 처리함). 사람에게 되묻지 말고, 마지막에 질문 없이 변경 요약만 보고해.
"@

# 2. 확장 연결 실패("not connected")면 1분 간격으로 최대 3번 시도한다.
$ok = $false
for ($i = 1; $i -le 3; $i++) {
  Log "[script] 시도 $i/3"
  $out = & claude -p $prompt --chrome `
    --allowedTools "mcp__claude-in-chrome" "Read" "Edit" "Write" "Glob" "Grep" 2>&1 | Out-String
  Log $out
  if ($out -notmatch "not connected|연결되지 않|확장이 연결") { $ok = $true; break }
  Start-Sleep 60
}
if (-not $ok) { Fail "Chrome 확장 연결 실패 (3회 시도). Chrome/확장/그룹웨어 로그인 상태를 확인하세요." }

# 데이터가 바뀌었을 때만 빌드·커밋·푸시
git diff --quiet -- newsletter-data.mjs
if ($LASTEXITCODE -eq 0) { Log "[script] 변경 없음 - 빌드/커밋/푸시 생략"; exit 0 }

Sh "node build.mjs"
if ($LASTEXITCODE -ne 0) { Fail "빌드 실패" }

Sh "git add newsletter-data.mjs suresoft_newsletter.html archive/newsletter-$today.html"
Sh "git commit -m `"Update newsletter $today`""
Sh "git push"
if ($LASTEXITCODE -ne 0) { Fail "git push 실패 (로컬 커밋은 남아 있음)" }
Log "[script] 커밋·푸시 완료"
