# APT 훈련용 대량 메일 발송 시스템

APT(Advanced Persistent Threat) 보안 훈련을 위한 대량 메일 발송 및 실시간 모니터링 시스템입니다.

## 🚀 주요 기능

- **대량 메일 발송**: Excel 파일 또는 직접 입력을 통한 다수 수신자 메일 발송
- **실시간 모니터링**: 발송 상태를 실시간으로 확인 가능
- **개인화 메일**: 수신자별 이름, 부서, 이메일 주소 변수 지원
- **HTML/텍스트 편집**: 풍부한 HTML 메일 작성 및 미리보기 기능
- **오류 처리**: 상세한 오류 메시지 및 발송 실패 추적
- **Excel 파일 지원**: .xlsx, .xls 파일에서 수신자 정보 자동 추출

## 📋 시스템 요구사항

### Apache 서버 환경
- **Apache HTTP Server** 2.4 이상
- **Node.js** 14.0 이상
- **npm** 6.0 이상
- **PHP** 7.4 이상 (선택사항)

### 지원 브라우저
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 🛠 설치 및 설정

### 1. 사전 준비사항

#### Node.js 설치
```bash
# Node.js 설치 확인
node --version
npm --version

# Node.js가 없다면 공식 사이트에서 다운로드
# https://nodejs.org/
```

#### Apache 서버 설정
```apache
# httpd.conf 또는 가상 호스트 설정
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /path/to/send_page
    
    # Node.js 프록시 설정 (포트 3000)
    ProxyRequests Off
    ProxyPreserveHost On
    ProxyPass /api/ http://localhost:3000/
    ProxyPassReverse /api/ http://localhost:3000/
    
    # 정적 파일 서빙
    <Directory "/path/to/send_page">
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

### 2. 프로젝트 설치

```bash
# 프로젝트 클론 또는 다운로드
git clone <repository-url>
cd send_page

# 의존성 패키지 설치
npm install

# uploads 디렉토리 생성 (없는 경우)
mkdir uploads
chmod 755 uploads
```

### 3. 환경 설정

#### .env 파일 생성 (선택사항)
```bash
# .env 파일 생성
touch .env
```

```env
# .env 파일 내용
PORT=3000
NODE_ENV=production
```

### 4. Apache와 Node.js 서버 실행

#### Node.js 서버 실행
```bash
# 개발 모드
npm start

# 또는 직접 실행
node server.js

# 백그라운드 실행 (프로덕션)
nohup node server.js > server.log 2>&1 &
```

#### Apache 서버 재시작
```bash
# Ubuntu/Debian
sudo systemctl restart apache2

# CentOS/RHEL
sudo systemctl restart httpd

# macOS (Homebrew)
brew services restart httpd
```

## 📁 프로젝트 구조

```
send_page/
├── send_page.html          # 메인 웹 인터페이스
├── server.js              # Node.js Express 서버
├── package.json           # 프로젝트 설정 및 의존성
├── package-lock.json      # 의존성 버전 고정
├── sample_email_list.js   # 샘플 이메일 리스트
├── test-excel.js          # Excel 파일 테스트 스크립트
├── uploads/               # Excel 파일 업로드 임시 저장소
├── node_modules/          # npm 패키지들
└── README.md             # 이 파일
```

## 🔧 사용 방법

### 1. Gmail 앱 비밀번호 설정

1. [Google 계정 보안 설정](https://myaccount.google.com/security) 접속
2. **2단계 인증** 활성화
3. **앱 비밀번호** 생성
4. 16자리 앱 비밀번호를 메모

### 2. 수신자 목록 준비

#### Excel 파일 업로드
- **지원 형식**: .xlsx, .xls
- **필수 컬럼**: E-Mail (또는 mail_address)
- **선택 컬럼**: 성명 (name), 부서 (dept)
- **헤더 위치**: 5번째 행

#### 직접 입력
```
# 이메일만 입력
user1@example.com
user2@example.com

# 또는 쉼표로 구분하여 입력
user1@example.com, user2@example.com
```

### 3. 메일 본문 작성

#### HTML 편집
- HTML 코드 직접 작성
- 실시간 미리보기 제공
- 개인화 변수 지원: `{name}`, `{dept}`, `{mail_address}`

#### 텍스트 편집
- 일반 텍스트 입력
- HTML 자동 변환 기능

### 4. 발송 및 모니터링

1. **발송 시작** 버튼 클릭
2. 실시간 발송 상태 모니터링
3. 성공/실패 건수 확인

## 🔍 문제 해결

### 일반적인 오류

#### SMTP 인증 오류 (EAUTH)
```
해결방법:
1. Gmail 앱 비밀번호 재확인
2. 2단계 인증 활성화 상태 확인
3. 앱 비밀번호 재생성
```

#### 네트워크 연결 오류 (ECONNECTION)
```
해결방법:
1. 인터넷 연결 상태 확인
2. 방화벽 설정 확인
3. 포트 25, 587, 465 차단 여부 확인
```

#### Excel 파일 파싱 오류
```
해결방법:
1. Excel 파일 형식 확인 (.xlsx, .xls)
2. E-Mail 컬럼명 확인
3. 5번째 행이 헤더인지 확인
4. 파일 권한 확인
```

### 로그 확인

#### 서버 로그
```bash
# 실시간 로그 확인
tail -f server.log

# 오류 로그만 확인
grep "ERROR" server.log
```

#### Apache 로그
```bash
# Apache 오류 로그
tail -f /var/log/apache2/error.log

# Apache 접근 로그
tail -f /var/log/apache2/access.log
```

## 🔒 보안 고려사항

### Gmail 앱 비밀번호
- 앱 비밀번호를 코드에 하드코딩하지 마세요
- 환경 변수 또는 별도 설정 파일 사용 권장
- 정기적으로 앱 비밀번호 갱신

### 파일 업로드
- uploads/ 디렉토리 권한 설정 (755)
- 업로드 파일 크기 제한
- 허용된 파일 형식만 업로드

### 서버 보안
```bash
# 방화벽 설정 (포트 3000)
sudo ufw allow 3000

# Node.js 프로세스 관리
pm2 start server.js --name "mail-sender"
```

## 📊 성능 최적화

### 발송 속도 조절
```javascript
// server.js에서 발송 간격 조정 (현재: 1초)
await new Promise(resolve => setTimeout(resolve, 1000));
```

### 메모리 사용량 모니터링
```bash
# Node.js 메모리 사용량 확인
ps aux | grep node

# 시스템 리소스 모니터링
htop
```
**⚠️ 주의사항**: 이 도구는 APT 보안 훈련 목적으로만 사용하세요. 스팸 메일 발송이나 악의적인 목적으로 사용하지 마세요.