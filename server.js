const express = require('express');
const QRCode = require('qrcode');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));

// Serve the main HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Generate QR code endpoint
app.post('/generate', async (req, res) => {
    try {
        const { text, size = 256, errorCorrectionLevel = 'M', type = 'png' } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const options = {
            width: parseInt(size),
            errorCorrectionLevel: errorCorrectionLevel,
            type: type === 'svg' ? 'svg' : 'png',
            quality: 0.92,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        };

        if (type === 'svg') {
            const svgString = await QRCode.toString(text, { ...options, type: 'svg' });
            res.json({ 
                success: true, 
                qrCode: svgString,
                type: 'svg'
            });
        } else {
            const dataURL = await QRCode.toDataURL(text, options);
            res.json({ 
                success: true, 
                qrCode: dataURL,
                type: 'png'
            });
        }
    } catch (error) {
        console.error('Error generating QR code:', error);
        res.status(500).json({ error: 'Failed to generate QR code' });
    }
});

// Generate QR code with custom colors
app.post('/generate-custom', async (req, res) => {
    try {
        const { 
            text, 
            size = 256, 
            errorCorrectionLevel = 'M', 
            darkColor = '#000000', 
            lightColor = '#FFFFFF',
            type = 'png'
        } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const options = {
            width: parseInt(size),
            errorCorrectionLevel: errorCorrectionLevel,
            type: type === 'svg' ? 'svg' : 'png',
            quality: 0.92,
            margin: 1,
            color: {
                dark: darkColor,
                light: lightColor
            }
        };

        if (type === 'svg') {
            const svgString = await QRCode.toString(text, { ...options, type: 'svg' });
            res.json({ 
                success: true, 
                qrCode: svgString,
                type: 'svg'
            });
        } else {
            const dataURL = await QRCode.toDataURL(text, options);
            res.json({ 
                success: true, 
                qrCode: dataURL,
                type: 'png'
            });
        }
    } catch (error) {
        console.error('Error generating QR code:', error);
        res.status(500).json({ error: 'Failed to generate QR code' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 QR Code Generator server running on http://localhost:${PORT}`);
    console.log(`📱 Open your browser and navigate to http://localhost:${PORT}`);
});