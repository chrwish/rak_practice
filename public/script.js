// QR Code Generator JavaScript
class QRCodeGenerator {
    constructor() {
        this.init();
    }

    init() {
        this.form = document.getElementById('qrForm');
        this.textInput = document.getElementById('textInput');
        this.sizeSelect = document.getElementById('sizeSelect');
        this.errorLevel = document.getElementById('errorLevel');
        this.formatSelect = document.getElementById('formatSelect');
        this.darkColor = document.getElementById('darkColor');
        this.lightColor = document.getElementById('lightColor');
        this.qrResult = document.getElementById('qrResult');
        this.downloadSection = document.getElementById('downloadSection');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.copyBtn = document.getElementById('copyBtn');
        this.loading = document.getElementById('loading');

        this.currentQRData = null;
        this.currentQRType = null;

        this.bindEvents();
    }

    bindEvents() {
        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        this.downloadBtn.addEventListener('click', () => this.downloadQRCode());
        this.copyBtn.addEventListener('click', () => this.copyToClipboard());
        
        // Auto-generate on input change (with debounce)
        let debounceTimer;
        this.textInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                if (this.textInput.value.trim()) {
                    this.generateQRCode();
                }
            }, 500);
        });

        // Auto-generate on option change
        [this.sizeSelect, this.errorLevel, this.formatSelect, this.darkColor, this.lightColor].forEach(element => {
            element.addEventListener('change', () => {
                if (this.textInput.value.trim()) {
                    this.generateQRCode();
                }
            });
        });
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        await this.generateQRCode();
    }

    async generateQRCode() {
        const text = this.textInput.value.trim();
        
        if (!text) {
            this.showError('Please enter some text or URL');
            return;
        }

        this.showLoading(true);

        try {
            const requestData = {
                text: text,
                size: this.sizeSelect.value,
                errorCorrectionLevel: this.errorLevel.value,
                type: this.formatSelect.value,
                darkColor: this.darkColor.value,
                lightColor: this.lightColor.value
            };

            const response = await fetch('/generate-custom', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                this.displayQRCode(data.qrCode, data.type);
                this.currentQRData = data.qrCode;
                this.currentQRType = data.type;
                this.showDownloadSection();
                this.showSuccess('QR Code generated successfully!');
            } else {
                throw new Error(data.error || 'Failed to generate QR code');
            }

        } catch (error) {
            console.error('Error generating QR code:', error);
            this.showError('Failed to generate QR code. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    displayQRCode(qrCodeData, type) {
        this.qrResult.innerHTML = '';
        this.qrResult.classList.add('has-qr');

        if (type === 'svg') {
            this.qrResult.innerHTML = qrCodeData;
        } else {
            const img = document.createElement('img');
            img.src = qrCodeData;
            img.alt = 'Generated QR Code';
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            this.qrResult.appendChild(img);
        }
    }

    showDownloadSection() {
        this.downloadSection.style.display = 'flex';
    }

    hideDownloadSection() {
        this.downloadSection.style.display = 'none';
    }

    downloadQRCode() {
        if (!this.currentQRData) {
            this.showError('No QR code to download');
            return;
        }

        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `qrcode-${timestamp}.${this.currentQRType}`;

            if (this.currentQRType === 'svg') {
                const blob = new Blob([this.currentQRData], { type: 'image/svg+xml' });
                this.downloadBlob(blob, filename);
            } else {
                // For PNG data URLs
                const link = document.createElement('a');
                link.download = filename;
                link.href = this.currentQRData;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

            this.showSuccess('QR Code downloaded successfully!');
        } catch (error) {
            console.error('Error downloading QR code:', error);
            this.showError('Failed to download QR code');
        }
    }

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    async copyToClipboard() {
        if (!this.currentQRData) {
            this.showError('No QR code to copy');
            return;
        }

        try {
            if (this.currentQRType === 'svg') {
                await navigator.clipboard.writeText(this.currentQRData);
                this.showSuccess('SVG code copied to clipboard!');
            } else {
                // For PNG, copy the image
                const img = this.qrResult.querySelector('img');
                if (img) {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    
                    ctx.drawImage(img, 0, 0);
                    
                    canvas.toBlob(async (blob) => {
                        try {
                            const item = new ClipboardItem({ 'image/png': blob });
                            await navigator.clipboard.write([item]);
                            this.showSuccess('QR Code image copied to clipboard!');
                        } catch (error) {
                            // Fallback: copy data URL as text
                            await navigator.clipboard.writeText(this.currentQRData);
                            this.showSuccess('QR Code data URL copied to clipboard!');
                        }
                    }, 'image/png');
                }
            }
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            this.showError('Failed to copy to clipboard');
        }
    }

    showLoading(show) {
        this.loading.style.display = show ? 'flex' : 'none';
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type) {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#48bb78' : '#f56565'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 1001;
            animation: slideIn 0.3s ease-out;
            max-width: 400px;
            word-wrap: break-word;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .notification-content i {
                font-size: 1.2rem;
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);

        // Auto remove after 4 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideIn 0.3s ease-out reverse';
                setTimeout(() => notification.remove(), 300);
            }
        }, 4000);

        // Add click to dismiss
        notification.addEventListener('click', () => {
            notification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => notification.remove(), 300);
        });
    }

    // Utility method to validate URLs
    isValidURL(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    // Method to suggest QR code content based on input
    getSuggestionType(text) {
        if (this.isValidURL(text)) {
            return 'URL';
        } else if (text.includes('@') && text.includes('.')) {
            return 'Email';
        } else if (text.match(/^\+?[\d\s\-\(\)]+$/)) {
            return 'Phone';
        } else {
            return 'Text';
        }
    }
}

// Initialize the QR Code Generator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new QRCodeGenerator();
    
    // Add some example suggestions
    const textInput = document.getElementById('textInput');
    const examples = [
        'https://www.example.com',
        'mailto:contact@example.com',
        'Hello, World!',
        'tel:+1234567890',
        'wifi:T:WPA;S:MyNetwork;P:MyPassword;;'
    ];
    
    let exampleIndex = 0;
    textInput.addEventListener('focus', () => {
        if (!textInput.value) {
            textInput.placeholder = `Try: ${examples[exampleIndex]}`;
            exampleIndex = (exampleIndex + 1) % examples.length;
        }
    });
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to generate
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        const generateBtn = document.querySelector('.generate-btn');
        if (generateBtn) {
            generateBtn.click();
        }
    }
    
    // Ctrl/Cmd + D to download
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        const downloadBtn = document.getElementById('downloadBtn');
        if (downloadBtn && downloadBtn.style.display !== 'none') {
            downloadBtn.click();
        }
    }
});