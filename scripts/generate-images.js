const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

// Ensure public directory exists
const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

// Common styles
const styles = {
    background: '#fdf2f8', // Pink background matching splashBackgroundColor
    primary: '#be185d',    // Pink-800
    secondary: '#fbcfe8',  // Pink-200
    text: '#831843',       // Pink-900
    font: 'Arial'
};

// Generate icon (200x200)
async function generateIcon() {
    const canvas = createCanvas(200, 200);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = styles.background;
    ctx.fillRect(0, 0, 200, 200);

    // Draw a stylized lock icon
    ctx.fillStyle = styles.primary;
    ctx.beginPath();
    ctx.arc(100, 80, 40, 0, Math.PI * 2);
    ctx.fill();

    // Lock body
    ctx.fillStyle = styles.secondary;
    ctx.fillRect(70, 100, 60, 50);
    ctx.fillRect(85, 80, 30, 20);

    // Save
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(publicDir, 'icon.png'), buffer);
    console.log('Generated icon.png');
}

// Generate splash screen (200x200)
async function generateSplash() {
    const canvas = createCanvas(200, 200);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = styles.background;
    ctx.fillRect(0, 0, 200, 200);

    // App name
    ctx.fillStyle = styles.primary;
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Farcaster', 100, 80);
    ctx.fillText('Paywall', 100, 110);

    // Decorative elements
    ctx.fillStyle = styles.secondary;
    ctx.beginPath();
    ctx.arc(100, 160, 20, 0, Math.PI * 2);
    ctx.fill();

    // Save
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(publicDir, 'splash.png'), buffer);
    console.log('Generated splash.png');
}

// Generate OG image (1200x630)
async function generateOGImage() {
    const canvas = createCanvas(1200, 630);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = styles.background;
    ctx.fillRect(0, 0, 1200, 630);

    // Title
    ctx.fillStyle = styles.primary;
    ctx.font = 'bold 72px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Farcaster Paywall', 600, 200);

    // Subtitle
    ctx.fillStyle = styles.text;
    ctx.font = '36px Arial';
    ctx.fillText('Monetize Your Content with USDC Tips', 600, 300);

    // Decorative elements
    ctx.fillStyle = styles.secondary;
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(200 + i * 200, 450, 40, 0, Math.PI * 2);
        ctx.fill();
    }

    // Save
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(publicDir, 'og-image.png'), buffer);
    console.log('Generated og-image.png');
}

// Generate all images
async function generateAllImages() {
    try {
        await generateIcon();
        await generateSplash();
        await generateOGImage();
        console.log('All images generated successfully!');
    } catch (error) {
        console.error('Error generating images:', error);
    }
}

generateAllImages(); 