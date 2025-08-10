# QR Code Generator

A beautiful and modern QR Code Generator built with Node.js, Express, and vanilla JavaScript. Generate custom QR codes instantly with customizable colors, sizes, and formats.

## 🚀 Features

- **Instant Generation**: Real-time QR code generation as you type
- **Customizable Design**: Choose custom colors for foreground and background
- **Multiple Formats**: Download as PNG or SVG
- **Multiple Sizes**: From 128px to 1024px
- **Error Correction Levels**: Low, Medium, Quartile, and High
- **Mobile Responsive**: Works perfectly on all devices
- **Download & Copy**: Download files or copy to clipboard
- **Keyboard Shortcuts**: Ctrl+Enter to generate, Ctrl+D to download
- **Auto-suggestions**: Smart placeholder suggestions based on input type

## 🛠️ Installation

1. **Clone or download this project**
   ```bash
   git clone <repository-url>
   cd qr-code-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 📦 Dependencies

- **express**: Web framework for Node.js
- **qrcode**: QR code generation library
- **cors**: Cross-origin resource sharing
- **multer**: File upload handling (for future features)

## 🎯 Usage

### Basic Usage

1. Enter any text, URL, email, or data in the input field
2. Customize the size, error correction level, and format
3. Choose custom colors if desired
4. Click "Generate QR Code" or press Ctrl+Enter
5. Download or copy the generated QR code

### API Endpoints

#### Generate QR Code
```http
POST /generate
Content-Type: application/json

{
  "text": "Hello, World!",
  "size": 256,
  "errorCorrectionLevel": "M",
  "type": "png"
}
```

#### Generate Custom QR Code
```http
POST /generate-custom
Content-Type: application/json

{
  "text": "Hello, World!",
  "size": 256,
  "errorCorrectionLevel": "M",
  "darkColor": "#000000",
  "lightColor": "#ffffff",
  "type": "png"
}
```

#### Health Check
```http
GET /health
```

### Supported QR Code Types

- **URLs**: `https://example.com`
- **Email**: `mailto:contact@example.com`
- **Phone**: `tel:+1234567890`
- **SMS**: `sms:+1234567890`
- **WiFi**: `wifi:T:WPA;S:NetworkName;P:Password;;`
- **Plain Text**: Any text content

## ⚙️ Configuration Options

### Size Options
- Small: 128px
- Medium: 256px (default)
- Large: 512px
- Extra Large: 1024px

### Error Correction Levels
- **L (Low)**: ~7% error correction
- **M (Medium)**: ~15% error correction (default)
- **Q (Quartile)**: ~25% error correction
- **H (High)**: ~30% error correction

### Format Options
- **PNG**: Raster image format
- **SVG**: Vector image format

## 🎨 Customization

The interface supports:
- Custom foreground (dark) colors
- Custom background (light) colors
- Real-time preview updates
- Color picker interface

## 🔧 Development

### Development Mode
```bash
npm run dev
```
This uses nodemon for automatic server restarts during development.

### Project Structure
```
qr-code-generator/
├── server.js          # Express server and API routes
├── package.json       # Dependencies and scripts
├── public/            # Static files
│   ├── index.html     # Main HTML interface
│   ├── styles.css     # CSS styles
│   └── script.js      # Frontend JavaScript
└── README.md          # This file
```

## 🌟 Keyboard Shortcuts

- **Ctrl/Cmd + Enter**: Generate QR code
- **Ctrl/Cmd + D**: Download QR code (when available)

## 🔒 Security Features

- Input validation and sanitization
- CORS protection
- Request size limits (10MB)
- Error handling and logging

## 🚀 Deployment

The application can be deployed to any Node.js hosting platform:

1. **Heroku**
   ```bash
   heroku create your-qr-generator
   git push heroku main
   ```

2. **Vercel**
   ```bash
   vercel --prod
   ```

3. **DigitalOcean App Platform**
   - Connect your repository
   - Configure build settings
   - Deploy

## 📱 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙋‍♂️ Support

If you encounter any issues or have questions, please create an issue in the repository.

---

**Made with ❤️ using Node.js and Express**