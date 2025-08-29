require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const multer = require('multer');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Configure multer for file uploads with proper filename handling
const upload = multer({ 
    dest: 'uploads/',
    fileFilter: (req, file, cb) => {
        // Log original filename with proper encoding
        console.log('원본 파일명:', Buffer.from(file.originalname, 'latin1').toString('utf8'));
        cb(null, true);
    }
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'send_page.html'));
});

// Handle Excel upload and parsing
app.post('/upload-excel', upload.single('excelFile'), (req, res) => {
    console.log('파일 업로드 요청 받음');
    
    if (!req.file) {
        console.log('파일이 업로드되지 않음');
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const emails = [];
    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    
    // Handle Korean filename encoding properly
    const originalFilename = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    console.log(`업로드된 파일: ${originalFilename}, 확장자: ${fileExtension}`);

    try {
        if (fileExtension === '.xlsx' || fileExtension === '.xls') {
            console.log('Excel 파일 처리 시작');
            
            // Check if file exists and is readable
            if (!fs.existsSync(filePath)) {
                throw new Error('업로드된 파일을 찾을 수 없습니다.');
            }
            
            // Handle Excel files
            const workbook = XLSX.readFile(filePath);
            
            if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                throw new Error('Excel 파일에 시트가 없습니다.');
            }
            
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            if (!worksheet) {
                throw new Error('Excel 시트를 읽을 수 없습니다.');
            }
            
            // Read all data as array to find the header row
            const allData = XLSX.utils.sheet_to_json(worksheet, { 
                header: 1,
                defval: '',
                raw: false
            });
            
            console.log(`Excel에서 총 ${allData.length}개 행 읽음`);
            
            // Simple fallback: use row 5 as header (0-indexed = 4)
            let headerRowIndex = 4;
            
            // Use row 5 as header (0-indexed = 4)
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
                range: 4,
                defval: ''
            });
            console.log(`5행을 헤더로 사용하여 ${jsonData.length}개 행 추출`);

            // Debug: Log the first row to see actual column names
            if (jsonData.length > 0) {
                console.log('Excel file columns:', Object.keys(jsonData[0]));
                console.log('First row data:', jsonData[0]);
            }

            jsonData.forEach((row, index) => {
                try {
                    // Extract columns based on the actual Excel structure
                    const emailKeys = ['E-Mail', 'mail_address', 'E-Mail 변수 : {mail_address}'];
                    const nameKeys = ['성명', 'name', '성명 변수 : {name}'];
                    const deptKeys = ['부서', 'dept', '부서 변수 : {dept}'];
                    
                    let email = '';
                    let name = '';
                    let dept = '';
                    
                    // Find email column
                    for (const key of emailKeys) {
                        if (row[key]) {
                            email = row[key];
                            break;
                        }
                    }
                    
                    // Find name column
                    for (const key of nameKeys) {
                        if (row[key]) {
                            name = row[key];
                            break;
                        }
                    }
                    
                    // Find dept column
                    for (const key of deptKeys) {
                        if (row[key]) {
                            dept = row[key];
                            break;
                        }
                    }
                    
                    if (email && email.toString().includes('@')) {
                        emails.push({
                            dept: dept ? dept.toString().trim() : '',
                            name: name ? name.toString().trim() : '',
                            email: email.toString().trim()
                        });
                        console.log(`행 ${index + 1}: 이메일 추가 - ${email}`);
                    } else {
                        console.log(`행 ${index + 1}: 유효하지 않은 이메일 - ${email}`);
                    }
                } catch (rowError) {
                    console.error(`행 ${index + 1} 처리 중 오류:`, rowError);
                }
            });

            console.log(`총 ${emails.length}개의 유효한 이메일 추출`);
            
            // Clean up uploaded file
            fs.unlinkSync(filePath);
            
            return res.json({ 
                success: true,
                emails: emails,
                message: `${emails.length}개의 이메일 주소를 성공적으로 추출했습니다.`
            });

        } else {
            // Unsupported file format
            fs.unlinkSync(filePath);
            return res.status(400).json({ 
                success: false,
                error: '지원하지 않는 파일 형식입니다. Excel(.xlsx, .xls) 파일만 업로드 가능합니다.'
            });
        }
    } catch (error) {
        console.error('File parsing error:', error);
        console.error('Error stack:', error.stack);
        
        // Clean up uploaded file
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (unlinkError) {
                console.error('파일 삭제 실패:', unlinkError);
            }
        }
        
        return res.status(500).json({ 
            success: false,
            error: '파일 파싱 중 오류가 발생했습니다.',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Handle bulk email sending
app.post('/send', async (req, res) => {
    // Sanitize/trim inputs
    let { 
        senderName, 
        senderEmail, 
        appPassword, 
        recipients, 
        subject, 
        htmlBody,
        campaignName 
    } = req.body;

    senderName = (senderName || '').trim();
    senderEmail = (senderEmail || '').trim();
    appPassword = (appPassword || '').trim();
    subject = (subject || '').trim();
    campaignName = (campaignName || '').trim();

    // Validate required fields
    if (!senderName || !senderEmail || !appPassword || !recipients || !subject || !htmlBody) {
        return res.status(400).end('모든 필수 필드를 입력해주세요.');
    }

    // Parse recipients (handle both string and object format)
    let recipientList = [];
    
    try {
        // Try to parse as JSON (from Excel upload)
        const parsedRecipients = JSON.parse(recipients);
        if (Array.isArray(parsedRecipients)) {
            recipientList = parsedRecipients;
        }
    } catch {
        // Parse as plain text (manual input)
        recipientList = recipients.split('\n')
            .map(email => email.trim())
            .filter(email => email && email.includes('@'))
            .map(email => ({ dept: '', name: '', email: email }));
    }

    if (recipientList.length === 0) {
        return res.status(400).end('유효한 수신자 이메일 주소가 없습니다.');
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: senderEmail,
                pass: appPassword,
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // Verify SMTP connection
        await transporter.verify();

        res.writeHead(200, {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
        });

        res.write('메일 발송을 시작합니다...\n');
        if (campaignName) {
            res.write(`캠페인명: ${campaignName}\n`);
        }
        res.write(`총 수신자: ${recipientList.length}명\n\n`);

        let successCount = 0;
        let failCount = 0;

        for (const recipient of recipientList) {
            // Replace template variables in subject and body
            let personalizedSubject = subject;
            let personalizedBody = htmlBody;
            
            if (typeof recipient === 'object') {
                personalizedSubject = subject
                    .replace(/\{name\}/g, recipient.name || '')
                    .replace(/\{mail_address\}/g, recipient.email || '')
                    .replace(/\{dept\}/g, recipient.dept || '');
                    
                personalizedBody = htmlBody
                    .replace(/\{name\}/g, recipient.name || '')
                    .replace(/\{mail_address\}/g, recipient.email || '')
                    .replace(/\{dept\}/g, recipient.dept || '');
            }
            
            const recipientEmail = typeof recipient === 'object' ? recipient.email : recipient;
            
            const mailOptions = {
                from: `"${senderName}" <${senderEmail}>`,
                to: recipientEmail,
                subject: personalizedSubject,
                html: personalizedBody,
            };

            try {
                await transporter.sendMail(mailOptions);
                successCount++;
                const logMsg = `${recipientEmail} 로 메일 발송 성공\n`;
                console.log(logMsg);
                res.write(logMsg);
            } catch (error) {
                failCount++;
                const logMsg = `${recipientEmail} 로 메일 발송 실패: ${error.message}\n`;
                console.error(logMsg);
                res.write(logMsg);
            }

            // Add delay between emails to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        res.write(`\n메일 발송이 완료되었습니다!\n`);
        res.write(`성공: ${successCount}건\n`);
        res.write(`실패: ${failCount}건\n`);
        res.end();
        console.log('--- Mail Sending Process Finished ---');

    } catch (error) {
        // Log full error for server-side diagnosis
        console.error('SMTP connection failed:', error);
        const detail = {
            code: error.code,
            command: error.command,
            response: error.response,
            responseCode: error.responseCode
        };
        console.error('Error details:', detail);

        // Return richer details to client for troubleshooting
        let errorMessage = '메일 서버 연결에 실패했습니다. ';
        if (error.code === 'EAUTH') {
            errorMessage += 'Gmail 인증 정보가 올바르지 않습니다. 앱 비밀번호(16자리)와 2단계 인증 설정을 확인하세요.';
        } else if (error.code === 'ECONNECTION') {
            errorMessage += '네트워크 또는 방화벽 설정을 확인하세요.';
        } else if (error.code === 'ESOCKET' || error.command === 'CONN') {
            errorMessage += 'SMTP 소켓 연결에 문제가 있습니다. 포트/SSL 설정을 확인하세요.';
        } else {
            errorMessage += `오류 코드: ${error.code || 'UNKNOWN'}`;
        }

        const extra = [];
        if (detail.responseCode) extra.push(`responseCode=${detail.responseCode}`);
        if (detail.response) extra.push(`response=${detail.response}`);
        if (detail.command) extra.push(`command=${detail.command}`);
        if (extra.length) errorMessage += `\n세부: ${extra.join(', ')}`;

        res.status(500).end(errorMessage);
    }
});

// Test endpoint to check if server is working
app.get('/test', (req, res) => {
    console.log('테스트 엔드포인트 호출됨');
    res.json({ message: '서버가 정상 작동 중입니다', timestamp: new Date().toISOString() });
});

// Start server
app.listen(port, () => {
    console.log(`메일 발송 서버가 http://localhost:${port} 에서 실행 중입니다.`);
    console.log('Gmail 앱 비밀번호를 준비해주세요!');
    console.log('테스트 URL: http://localhost:' + port + '/test');
});
