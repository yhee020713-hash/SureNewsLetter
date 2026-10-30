// 슈어소프트 뉴스레터 콘텐츠 데이터.
// 매일 갱신할 때는 이 파일만 수정하고 `node build.mjs` 를 실행합니다. (REFRESH.md 참고)
// body 는 HTML 문자열(백틱)입니다. 사용 가능한 CSS 클래스는 build.mjs 의 <style> 참고.

export default {
  issued: '2026-10-30',          // 발행일 (YYYY-MM-DD)
  range: '09.30 ~ 10.30',        // 다루는 기간 표시용
  source: '슈어소프트 그룹웨어 전사 게시판',

  // 마감/일정. date 는 마감(종료)일 ISO. 지난 일정은 페이지에서 자동으로 숨겨집니다.
  //   card:true → 공지사항 탭 상단 카드,  side → 사이드바 "다가오는 일정" 문구
  deadlines: [
    { date: '2026-10-28', side: 'AI 생활 사례 접수 시작', sideShort: '10/28' },
    { date: '2026-11-05', big: '11/05', small: '목', hot: true, card: true,
      text: '11월 임직원 경비 접수마감<br>10월 비용·매입 마감 제출', side: '임직원 경비·10월 비용 마감' },
    { date: '2026-11-09', side: '거래처 대금 접수마감 (2차)' },
    { date: '2026-11-16', side: '임직원 경비 지급 (1차)' },
    { date: '2026-11-23', big: '11/16 · 23', small: '월', card: true,
      text: '11월 임직원 경비 지급일', side: '임직원 경비 지급 (2차)' },
    { date: '2026-11-18', big: '10/28', small: '~ 11/18', card: true,
      text: '「2026 슬기로운 AI 생활」<br>사례 접수 기간', side: 'AI 생활 사례 접수 종료', sideShort: '11/18' },
  ],

  // 카드뉴스 (5번째 탭). 중요도 순으로 배치하고, 표지·마무리 카드는 build 가 자동으로 앞뒤에 붙인다.
  // 카드 필드: tier(1~4, 배지 번호) · label(상단 라벨) · title · sub(선택)
  //   + 본문 형태 하나: big{num,unit,cap} | rows[{k,v,hot}] | bullets[문자열]
  //   + foot(선택, 하단 한 줄 안내)
  cards: [
    { tier: 1, label: '공지사항 · 공지', title: '사내문화 개선 캠페인', sub: '이번 달 주제는 \'출근시간 준수\'',
      big: { num: '99.67', unit: '%', cap: '코어타임 전 출근 비율 (1~7월)' },
      foot: '지금처럼 여유 있게 출근해 주세요' },
    { tier: 1, label: '공지사항 · 재무톡톡', title: '11월 지급일정 안내', sub: '재무기획실 접수마감 기준 · 놓치지 마세요',
      rows: [
        { k: '11/05 목', v: '임직원 경비 접수·10월 비용 마감', hot: true },
        { k: '11/09 월', v: '거래처 대금(2차) 접수마감' },
        { k: '11/16 월', v: '경조금·동호회비·야근교통비 지급' },
        { k: '11/23 월', v: '개인경비·출장여비 등 지급' },
      ] },
    { tier: 1, label: '공지사항 · 주간메뉴', title: '이번 주 점심', sub: '10/30 (금) 오늘의 점심',
      bullets: [
        'A · 닭곰탕·소면사리',
        'B · 제육비빔밥',
        '샐러드 t/o · 두부면참치샐러드',
      ],
      foot: '이번 주 전체 식단은 뉴스레터 본문에서 볼 수 있어요' },
    { tier: 4, label: '기술정보 · 슬기로운 AI 생활', title: 'AI 활용 사례 접수 중', sub: '혼자 쓰기 아까운 AI 활용법, 나눠 주세요',
      rows: [
        { k: '기간', v: '10/28 (수) ~ 11/18 (수)' },
        { k: '대상', v: '전 직원 (인턴 포함)' },
        { k: '방법', v: '\'슬기로운 AI 생활\' 게시판에 익명 게시' },
      ] },
    { tier: 4, label: '커뮤니티', title: '이번 주 사내 소식',
      bullets: [
        '월간 슈구리 배경화면 · 2026년 11월',
        '칭찬합니다 · PL팀 서혜원 전임 / 곽충석 팀장',
        '출장비용지급품의 작성기 공유 (좋아요 17)',
      ] },
  ],

  tabs: [
    /* ============================ 1. 공지사항 ============================ */
    {
      id: 1, title: '공지사항', short: '공지사항', sub: '공지 · 재무 · 식단',
      desc: '10월 비용·매입 마감 제출 11/05 · 11월 지급일정 · 이번 주 식단 · 경조사·인사발령',
      showDeadlines: true,
      blocks: [
        { anchor: '1.1 공지', chip: '1.1 공지', title: '[공지] 사내문화 개선 캠페인 (26.09)',
          date: '09-15', by: '피플팀 천선영 사원',
          body: `
            <div class="stat-row">
              <div class="stat"><div class="num">99.67<sup>%</sup></div><div class="cap">코어타임 전 출근 비율 (1~7월)</div></div>
              <div class="txt"><p>이번 달 캠페인 주제는 <b>'출근시간 준수'</b>입니다. 지금처럼 코어타임 시작 전 여유 있게 출근해 원활하게 업무를 시작해 달라는 안내입니다.</p></div>
            </div>`,
          links: [['원문 보기 →', 'https://gw.suresofttech.com/app/board/40/post/3850'],
                  ['공지 게시판 (총 17건)', 'https://gw.suresofttech.com/app/board/40']] },

        { anchor: '1.2 재무톡톡', chip: '1.2 재무톡톡',
          title: '2026.10월 비용 및 매입 마감 안내',
          date: '10-28', by: '재무기획실 임초빈 사원',
          body: `
            <div class="tw"><table>
              <tr><th>대상</th><th>제출 기한</th></tr>
              <tr><td>지출결의서 &amp; 출장비용지급품의 (10월분 비용·매입 마감)</td><td class="dl">~ 11/05 (목)</td></tr>
            </table></div>`,
          links: [['원문 보기 →', 'https://gw.suresofttech.com/app/board/46/post/4127']] },

        { chip: '1.2 재무톡톡', title: '2026년 11월 지급일정 공지',
          date: '10-15', by: '재무기획팀 신예지 대리',
          body: `
            <div class="tw"><table>
              <tr><th>구분</th><th>재무기획실 접수마감</th><th>지급일</th></tr>
              <tr><td>경조금 · 동호회비 · 버디활동비 · 야근교통비 · 파견비</td><td class="dl" rowspan="2">~ 11/05 (목)</td><td class="pay">11/16 (월)</td></tr>
              <tr><td>그 외 경비 및 출장비 (개인경비 · 출장여비 · 사내경조사 교통비 등)</td><td class="pay">11/23 (월)</td></tr>
              <tr><td rowspan="3">거래처 대금</td><td class="dl">~ 10/27 (화)</td><td class="pay">11/04 (수)</td></tr>
              <tr><td class="dl">~ 11/09 (월)</td><td class="pay">11/16 (월)</td></tr>
              <tr><td class="dl">~ 11/23 (월)</td><td class="pay">11/30 (월)</td></tr>
            </table></div>
            <div class="note">접수마감은 결재가 완료되어 재무기획실 합의 전 단계로 넘어오는 기준일입니다.</div>
            <p class="m" style="margin-top:12px">이전 · 2026년 10월 지급일정 공지(09-16) · 2026.9월 비용 및 매입 마감 안내(09-23, 제출 10/07까지 — 마감 종료)</p>`,
          links: [['원문 보기 →', 'https://gw.suresofttech.com/app/board/46/post/4004'],
                  ['재무톡톡 게시판 (총 73건)', 'https://gw.suresofttech.com/app/board/46']] },

        { anchor: '1.3 주간메뉴', chip: '1.3 주간메뉴',
          title: '이번 주 주간메뉴 <span class="m" style="font-weight:500;font-size:13px">10/26 ~ 10/30</span>',
          date: '10-26', by: '민지애 대리',
          body: `
            <div class="menu">
              <div class="day" data-date="2026-10-26"><div class="dh">월 10/26</div><dl><dt>A</dt><dd>뼈없는순살감자탕</dd><dt>B</dt><dd>카레라이스·구운채소</dd><dt>샐러드 t/o</dt><dd class="s">두부가라아게샐러드</dd></dl></div>
              <div class="day" data-date="2026-10-27"><div class="dh">화 10/27</div><dl><dt>A</dt><dd>콩나물밥·양념장</dd><dt>B</dt><dd>베이컨깍두기볶음밥·계란프라이</dd><dt>샐러드 t/o</dt><dd class="s">치킨텐더샐러드</dd></dl></div>
              <div class="day" data-date="2026-10-28"><div class="dh">수 10/28</div><dl><dt>A</dt><dd>사골미역국</dd><dt>B</dt><dd>짜무라이스</dd><dt>샐러드 t/o</dt><dd class="s">참치콥샐러드</dd></dl></div>
              <div class="day" data-date="2026-10-29"><div class="dh">목 10/29</div><dl><dt>A</dt><dd>황태해장국</dd><dt>B</dt><dd>채소듬뿍쫄면</dd><dt>샐러드 t/o</dt><dd class="s">두부카츠샐러드</dd></dl></div>
              <div class="day" data-date="2026-10-30"><div class="dh">금 10/30</div><dl><dt>A</dt><dd>닭곰탕·소면사리</dd><dt>B</dt><dd>제육비빔밥</dd><dt>샐러드 t/o</dt><dd class="s">두부면참치샐러드</dd></dl></div>
            </div>`,
          links: [['주간식단표 원문(PDF) →', 'https://gw.suresofttech.com/app/board/380/post/4096']] },

        { anchor: '1.4 나머지', chip: '1.4 나머지', half: true, title: '인사발령', date: '09-21 ~ 10-16',
          body: `
            <div class="tags"><span>채용 1</span><span>퇴직 3</span><span>휴직 2</span><span>겸직 1</span></div>
            <p class="m">기간 내 등록 7건</p>`,
          links: [['인사발령 게시판 →', 'https://gw.suresofttech.com/app/board/41']] },

        { chip: '1.4 나머지', half: true, title: '경조사',
          body: `
            <ul>
              <li>제어기개발팀 원찬주 전임 조부상 <span class="m">10-21</span></li>
              <li>컬쳐앤인프라팀 하새은 사원 결혼식 <span class="m">10-12</span></li>
              <li>모빌리티솔루션6팀 신재욱 팀장 결혼식 <span class="m">10-06</span></li>
            </ul>`,
          links: [['경조사 게시판 →', 'https://gw.suresofttech.com/app/board/43']] },
      ],
    },

    /* ============================ 2. 정보보안/보호 ============================ */
    {
      id: 2, title: '정보보안/보호', short: '정보보안', sub: '보안레터',
      desc: 'VPN 매뉴얼 안내 외 · 이번 기간 새 글 없음',
      blocks: [
        { chip: '정보보안', title: 'VPN 메뉴얼 안내', date: '10-22', by: '컬처앤인프라팀 최성재 사원',
          body: `
            <p>VPN 사용 매뉴얼이 새로 등록되었습니다. 자세한 내용은 게시글을 확인해 주세요.</p>
            <p class="m">이전: 26년 9월 보안레터 (09-02) · 2026년 상반기 피싱메일 모의훈련 결과 안내 (06-04)</p>`,
          links: [['정보보안/보호 안내 게시판 (총 23건) →', 'https://gw.suresofttech.com/app/board/47']] },
      ],
    },

    /* ============================ 3. 회사생활 ============================ */
    {
      id: 3, title: '회사생활', short: '회사생활', sub: '가이드 · 문의',
      desc: '회사 생활 가이드 → 문의 · 기술지원 · SW/도서',
      blocks: [
        { chip: '3.1 회사 생활 가이드', title: '최근 등록된 가이드',
          body: `
            <ul>
              <li><b>[파견비신청서] 작성가이드 및 질의응답(FAQ) 안내</b> <span class="m">09-03 · 엄유진 대리</span></li>
              <li><b>[안내] 판교사옥 식당 이용 순서 안내 (2026.09.02~)</b> <span class="m">09-01 · 민지애 대리</span></li>
              <li>셔틀 · 통근버스 시간표 (2026.08.03~) <span class="m">07-27</span></li>
              <li>[공지] 주차장 이용 수칙 안내 <span class="m">07-27</span></li>
            </ul>`,
          links: [['회사 생활 가이드 게시판 (총 21건) →', 'https://gw.suresofttech.com/app/board/48']] },

        { chip: '3.2 나머지', title: '문의 · 기술지원 · SW/도서',
          body: `
            <ul>
              <li>대전지역 근무자 명절 선물 수령 관련 문의 <span class="m">09-08 · 답글 5</span></li>
              <li>SW/도서: 2026.08.10 표준문서 목록 <span class="m">08-10</span></li>
              <li>회사 기술지원: NAC 메뉴얼 <span class="m">25-08-27</span></li>
            </ul>`,
          links: [['회사 생활 문의', 'https://gw.suresofttech.com/app/board/49'],
                  ['회사 기술지원', 'https://gw.suresofttech.com/app/board/50'],
                  ['SW/도서', 'https://gw.suresofttech.com/app/board/52']] },
      ],
    },

    /* ============================ 4. 기술정보·커뮤니티 ============================ */
    {
      id: 4, title: '기술정보·커뮤니티', short: '기술정보', sub: 'AI 사례 · 칭찬',
      desc: '슬기로운 AI 생활 사례 11건 등록 · Agent Catalog·AIV Lab 세미나 공유 · 칭찬 · 슈구리 배경화면',
      blocks: [
        { chip: '기술정보', title: '「2026 슬기로운 AI 생활」 사내 AI 활용 사례 모집', date: '10-21 · 10-28 사례 등록 시작', by: '피플팀', isNew: true,
          body: `
            <ul>
              <li><b>접수 기간</b> 2026.10.28(수) ~ 11.18(수)</li>
              <li><b>응모 대상</b> 전 직원 (인턴 포함, 협력업체 제외)</li>
              <li><b>응모 방법</b> 그룹웨어 '슬기로운 AI 생활' 게시판에 익명으로 게시글 작성 — 업무 적용, 개선 효과, AI 활용 방법을 소개</li>
            </ul>
            <p class="m" style="margin-top:10px"><b>10/28~30 등록된 사례 (11건)</b></p>
            <ul>
              <li>[업무 비서와 반복 작업 자동화] 받은 메일에서 회신할 것만 골라 주고, 사내 규정도 답해 주는 업무 비서 Sure Assistant</li>
              <li>[업무 비서와 반복 작업 자동화] 근무 현황은 한눈에, 시간 계산은 자동으로</li>
              <li>[업무 비서와 반복 작업 자동화] 신입 과제로 만든 앱 TRO, 3년 뒤 AI 워크로그 비서 Jiny가 되기까지</li>
              <li>[업무 비서와 반복 작업 자동화] 말해 두면 기록하고, 금요일엔 보고서를 써 주는 업무 비서 '하루'</li>
              <li>[업무 비서와 반복 작업 자동화] 슈구리 시간계산기 — 이번 주 근무시간, 슈구리에게 물어보세요</li>
              <li>[자료 조사와 지식 검색] 흩어진 메일 백업 zip 수십 개를 '하나의 메일함'으로 — 메일통합관리 도구</li>
              <li>[업무 비서와 반복 작업 자동화] 매달 채우던 그 칸들, 이제 크롬이 채웁니다 <span class="m">10-29</span></li>
              <li>[자유 주제] 흩어진 사내 소식을 한눈에, '슈구리 편지'를 소개합니다!</li>
              <li>[업무 비서와 반복 작업 자동화] 근무시간, 일정, 할 일을 한 화면에 — "근무노트" <span class="m">10-29</span></li>
              <li>[업무 비서와 반복 작업 자동화] Mail Checker: 메일을 보내기 전에 빠뜨린 내용이 없는지 한 번 더 확인 <span class="m">10-29</span></li>
              <li>[업무 비서와 반복 작업 자동화] 표지 서명, 이제 클릭 세 번이면 끝납니다 — 산출물 승인란 서명·결재 자동화 도구 <span class="m">10-30</span></li>
            </ul>`,
          links: [['슬기로운 AI 생활 게시판 →', 'https://gw.suresofttech.com/app/board/411']] },

        { chip: '기술정보', title: '최근 기술 공유',
          body: `
            <ul>
              <li>[AIV Lab 정기 세미나] 2026 제5회 발표자료·영상 공유 <span class="m">10-29 · 강규황 수석연구원</span></li>
              <li>Agent Catalog 소개 - ALIRA-AI HUB <span class="m">10-28 · 여용수 수석연구원</span></li>
              <li>AI 활용해서 티트리 PC 버전 자동 로그인 안 되던 버그 고친 사례 공유 <span class="m">09-23 · 이성건 책임연구원</span></li>
              <li>자율주행 모빌리티 산업전 2026 참관 내용 공유 1~4편(완) <span class="m">08-31 ~ 09-03 · 이성건 책임연구원</span></li>
            </ul>`,
          links: [['기술지식 공유게시판', 'https://gw.suresofttech.com/app/board/55'],
                  ['AI 활용 사례 공유', 'https://gw.suresofttech.com/app/board/280']] },

        { chip: '칭찬합니다', half: true, title: '칭찬합니다',
          body: `
            <ul>
              <li>PL팀 서혜원 전임 / 곽충석 팀장 <span class="m">10-21</span></li>
              <li>모빌리티SW전략4팀 안신영 수석 <span class="m">10-16</span></li>
              <li>피플팀 천선영 사원 <span class="m">09-29</span></li>
            </ul>`,
          links: [['더 보기 →', 'https://gw.suresofttech.com/app/board/58']] },

        { chip: '처음 뵙겠습니다', half: true, title: '처음 뵙겠습니다',
          body: `<ul><li>AI모델검증솔루션팀 김진 전임 <span class="m">09-21 입사</span></li></ul>`,
          links: [['더 보기 →', 'https://gw.suresofttech.com/app/board/61']] },

        { chip: '자유게시판', half: true, title: '자유게시판',
          body: `
            <ul>
              <li>[한 눈에 보는 슈어 콘텐츠 캘린더] 2026년 11월 <span class="m">10-29 · 박수인 사원</span></li>
              <li>[월간 슈구리 배경화면] 2026년 11월 <span class="m">10-27 · 강은빈 사원</span></li>
              <li>출장비용지급품의 작성기 공유 <span class="m">10-22 · 강승헌 수석연구원</span></li>
            </ul>`,
          links: [['더 보기 →', 'https://gw.suresofttech.com/app/board/66']] },

        { chip: '사우회', half: true, title: '사우회',
          body: `
            <ul>
              <li>경조 축하금·송별회 지원금 전달 8건 <span class="m">10-19</span></li>
              <li>2026년 추석 명절 선물 관련 공지 <span class="m">09-22</span></li>
            </ul>`,
          links: [['더 보기 →', 'https://gw.suresofttech.com/app/board/62']] },
      ],
    },
  ],
};
