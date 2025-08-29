# APT 훈련용 메일 발송기 사용 설명서

## 설치 및 실행 방법

O 사전 준비사항
- Node.js 설치 (버전 14 이상)
  - [Node.js 공식 사이트](https://nodejs.org/)에서 다운로드
  - 설치 확인: 터미널에서 `node --version` 실행

O 프로젝트 설정
  - 프로젝트 폴더를 원하는 위치에 복사
  -  터미널(명령 프롬프트)을 열고 프로젝트 폴더로 이동
   ```bash
   cd "프로젝트폴더경로"
   ```
  - 필요한 패키지 설치
   ```bash
   npm install
   ```

O 서버 실행
터미널에서 다음 명령어를 실행합니다:
```bash
node server.js
```

## 프로젝트 파일 구조
```
mail_send_원본/
├── index.html          # 메인 웹페이지
├── server.js           # Node.js 서버
├── package.json        # 프로젝트 설정 및 의존성
├── package-lock.json   # 의존성 버전 고정
├── node_modules/       # 설치된 패키지들
└── uploads/           # CSV 업로드 임시 폴더
```