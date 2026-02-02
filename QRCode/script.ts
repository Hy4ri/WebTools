import QRCode from 'qrcode';

const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
const input = document.getElementById('qr-input') as HTMLInputElement;
const downloadBtn = document.getElementById('download-btn') as HTMLButtonElement;

const generateQR = async () => {
    const text = input.value || ' ';
    try {
        await QRCode.toCanvas(canvas, text, {
            width: 200,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });
    } catch (err) {
        console.error(err);
    }
};

const downloadQR = () => {
    const link = document.createElement('a');
    link.download = 'qrcode.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
};

input.addEventListener('input', generateQR);
downloadBtn.addEventListener('click', downloadQR);

// Initial Generation
generateQR();
