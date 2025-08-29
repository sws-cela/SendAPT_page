const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// 업로드된 파일들을 확인
const uploadsDir = path.join(__dirname, 'uploads');
console.log('업로드 디렉토리 확인:', uploadsDir);

if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    console.log('업로드된 파일들:', files);
    
    // 가장 최근 파일 찾기
    if (files.length > 0) {
        const latestFile = files
            .map(file => ({
                name: file,
                path: path.join(uploadsDir, file),
                time: fs.statSync(path.join(uploadsDir, file)).mtime
            }))
            .sort((a, b) => b.time - a.time)[0];
            
        console.log('가장 최근 파일:', latestFile.name);
        
        try {
            // Excel 파일 읽기 시도
            const workbook = XLSX.readFile(latestFile.path);
            console.log('시트 이름들:', workbook.SheetNames);
            
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
            
            console.log('총 행 수:', jsonData.length);
            console.log('첫 번째 행의 컬럼들:', Object.keys(jsonData[0] || {}));
            console.log('첫 번째 행 데이터:', jsonData[0]);
            
            if (jsonData.length > 1) {
                console.log('두 번째 행 데이터:', jsonData[1]);
            }
            
            // 이메일 컬럼 찾기
            const emailKeys = ['E-Mail', 'email', 'Email', 'EMAIL', '이메일', '메일'];
            let foundEmailKey = null;
            
            if (jsonData.length > 0) {
                for (const key of emailKeys) {
                    if (jsonData[0].hasOwnProperty(key)) {
                        foundEmailKey = key;
                        console.log('이메일 컬럼 발견:', key);
                        console.log('이메일 값 예시:', jsonData[0][key]);
                        break;
                    }
                }
                
                if (!foundEmailKey) {
                    console.log('이메일 컬럼을 찾을 수 없습니다. 사용 가능한 컬럼들:');
                    Object.keys(jsonData[0]).forEach(key => {
                        console.log(`- "${key}": ${jsonData[0][key]}`);
                    });
                }
            }
            
        } catch (error) {
            console.error('Excel 파일 읽기 오류:', error.message);
        }
    } else {
        console.log('업로드된 파일이 없습니다.');
    }
} else {
    console.log('uploads 디렉토리가 존재하지 않습니다.');
}
