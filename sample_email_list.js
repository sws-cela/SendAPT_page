const XLSX = require('xlsx');

// 예시 데이터 생성
const sampleData = [
    {
        'No': 1,
        '부서': '개발팀',
        '이름': '김민수',
        'E-mail': 'minsu.kim@company.com',
        '분류': 'A',
        '상태': '활성'
    },
    {
        'No': 2,
        '부서': '마케팅팀',
        '이름': '이영희',
        'E-mail': 'younghee.lee@company.com',
        '분류': 'B',
        '상태': '활성'
    },
    {
        'No': 3,
        '부서': '인사팀',
        '이름': '박철수',
        'E-mail': 'chulsoo.park@company.com',
        '분류': 'A',
        '상태': '활성'
    },
    {
        'No': 4,
        '부서': '재무팀',
        '이름': '정수진',
        'E-mail': 'sujin.jung@company.com',
        '분류': 'C',
        '상태': '활성'
    },
    {
        'No': 5,
        '부서': 'IT팀',
        '이름': '홍길동',
        'E-mail': 'gildong.hong@company.com',
        '분류': 'A',
        '상태': '활성'
    }
];

// Excel 파일 생성
const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.json_to_sheet(sampleData);

// 컬럼 너비 설정
const columnWidths = [
    { wch: 5 },   // No
    { wch: 15 },  // 부서
    { wch: 10 },  // 이름
    { wch: 25 },  // E-mail
    { wch: 8 },   // 분류
    { wch: 10 }   // 상태
];
worksheet['!cols'] = columnWidths;

XLSX.utils.book_append_sheet(workbook, worksheet, 'APT 훈련 대상');

// 파일 저장
const filename = 'APT_메일_모의훈련_대상_예시.xlsx';
XLSX.writeFile(workbook, filename);

console.log(`✅ 예시 Excel 파일이 생성되었습니다: ${filename}`);
console.log('\n📋 파일 구조:');
console.log('- No: 번호');
console.log('- 부서: 부서명');
console.log('- 이름: 이름');
console.log('- E-mail: 이메일 주소 (필수)');
console.log('- 분류: 분류');
console.log('- 상태: 상태');
console.log('\n💡 중요: E-mail 컬럼에 유효한 이메일 주소가 있어야 합니다.');
