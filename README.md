# PE Command Center

SV Investment 운용역 전용 투자 관리 허브.
News Radar · Idea Bank · Deal Pipeline을 웹/모바일에서 seamlessly 운영.

---

## 배포 순서 (15분)

### 1. GitHub 레포 생성
```bash
git init
git add .
git commit -m "init"
# GitHub에서 새 repo 만들고:
git remote add origin https://github.com/[USERNAME]/pe-command-center.git
git push -u origin main
```

### 2. Notion Integration 생성
1. https://www.notion.so/my-integrations 접속
2. "새 Integration" 생성 → 이름: `PE Command Center`
3. `Internal Integration Secret` 복사 (NOTION_TOKEN)
4. **Notion에서 두 DB에 Integration 연결:**
   - Idea Bank DB 열기 → `...` → `연결` → `PE Command Center` 선택
   - Deal Sheet DB 열기 → `...` → `연결` → `PE Command Center` 선택

### 3. Vercel 배포
1. https://vercel.com 로그인
2. "Add New Project" → GitHub repo 연결
3. **Environment Variables 설정:**

| 변수명 | 값 |
|--------|-----|
| `ANTHROPIC_API_KEY` | `sk-ant-...` (Anthropic Console) |
| `NOTION_TOKEN` | `secret_...` (위에서 복사) |
| `NOTION_IDEA_BANK_DB` | `f10b49af-653e-42a6-85a4-a1702d7f6100` |
| `NOTION_DEAL_SHEET_DB` | `2da09bfe-5079-8087-83ff-c3c00d5f34a3` |

4. "Deploy" 클릭 → 2분이면 완료

### 4. 모바일에서 사용
- 배포된 URL (`https://pe-command-center-xxx.vercel.app`)을 Safari/Chrome에서 열기
- iOS: 공유 → "홈 화면에 추가" → 앱처럼 사용 가능

---

## 로컬 실행
```bash
npm install
cp .env.example .env.local
# .env.local에 실제 값 입력 후:
npm run dev
# http://localhost:3000
```

---

## 연결된 Notion DB
- **Idea Bank**: https://www.notion.so/f10b49af653e42a685a4a1702d7f6100
- **Deal Sheet**: https://www.notion.so/2da09bfe5079808783ffc3c00d5f34a3
