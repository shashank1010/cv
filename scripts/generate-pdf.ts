import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
const publicDir = path.resolve(__dirname, '../public');

// Ensure directories exist
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

async function startPreviewServer(): Promise<{ url: string; process: any; shouldKill: boolean }> {
  return new Promise((resolve, reject) => {
    const port = process.env.PDF_PREVIEW_PORT || '4323';
    const server = spawn('bun', ['preview', '--port', port], {
      cwd: path.resolve(__dirname, '..'),
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let isResolved = false;
    let shouldKillServer = true;
    const timeout = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        console.warn(`Timeout waiting for server output, using http://localhost:${port}`);
        resolve({ url: `http://localhost:${port}`, process: server, shouldKill: shouldKillServer });
      }
    }, 5000);

    server.stdout?.on('data', (data) => {
      const output = data.toString();
      console.log('[Server]', output.trim());

      if (!isResolved) {
        // Look for URLs in the output
        const urlMatch = output.match(/https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0):\d+/);
        if (urlMatch) {
          isResolved = true;
          clearTimeout(timeout);
          console.log(`✓ Preview server detected at ${urlMatch[0]}`);
          resolve({ url: urlMatch[0], process: server, shouldKill: shouldKillServer });
        }
      }
    });

    let stderrOutput = '';

    server.stderr?.on('data', (data) => {
      const output = data.toString();
      
      if (!isResolved) {
        // Check if server is already running
        if (output.includes('Another astro preview server is already running')) {
          isResolved = true;
          clearTimeout(timeout);
          shouldKillServer = false; // Don't kill existing server
          const urlMatch = output.match(/URL:\s+(https?:\/\/[^\s]+)/);
          if (urlMatch) {
            const existingUrl = urlMatch[1].trim();
            console.log(`✓ Reusing existing preview server at ${existingUrl}`);
            resolve({ url: existingUrl, process: server, shouldKill: shouldKillServer });
            return
          } else {
            // Fallback: use common preview port
            console.log('✓ Server already running, using fallback URL');
            resolve({ url: 'http://localhost:4321', process: server, shouldKill: shouldKillServer });
            return;
          }
        }
      }

      stderrOutput += output;
      console.error('[Server Error]', output.trim());
    });

    server.on('error', (err) => {
      console.log('[error]');
      if (!isResolved) {
        isResolved = true;
        reject(err);
      }
    });
  });
}

async function generatePDF() {
  let server: any = null;
  let shouldKillServer = true;
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--kiosk-printing'],
  });

  try {
    // Start preview server
    console.log('Starting preview server...');
    const { url: baseUrl, process: serverProcess, shouldKill } = await startPreviewServer();
    server = serverProcess;
    shouldKillServer = shouldKill;
    console.log(`Using preview server at ${baseUrl}\n`);

    const page = await browser.newPage();

    // Set viewport to ensure consistent rendering
    await page.setViewport({ width: 1200, height: 1600 });

    // Generate PDF for each language
    const languages = ['', 'de', 'ru'];

    for (const lang of languages) {
      const fileName = lang ? `CV-${lang}.pdf` : 'CV.pdf';
      const pageUrl = lang ? `${baseUrl}/${lang}/` : `${baseUrl}/`;
      const distPdfPath = path.resolve(distDir, fileName);
      const publicPdfPath = path.resolve(publicDir, fileName);

      console.log(`Generating ${fileName} from ${pageUrl}...`);

      try {
        await page.goto(pageUrl, { waitUntil: 'networkidle2' });

        // Emulate print media type to apply print CSS
        await page.emulateMediaType('print');

        // Hide interactive elements in print
        await page.evaluate(() => {
          const elements = document.querySelectorAll('[data-pdf-download], .lang-switch, .site-nav');
          elements.forEach((el) => ((el as HTMLElement).style.display = 'none'));
        });

        // Generate PDF to dist
        await page.pdf({
          path: distPdfPath,
          format: 'A4',
          margin: {
            top: '0.5in',
            right: '0.5in',
            bottom: '0.5in',
            left: '0.5in',
          },
          printBackground: true,
          scale: 1,
          preferCSSPageSize: true,
        });

        // Copy to public directory as well
        fs.copyFileSync(distPdfPath, publicPdfPath);

        console.log(`✓ Generated ${fileName} at ${distPdfPath} and ${publicPdfPath}`);
      } catch (error) {
        console.error(`✗ Failed to generate ${fileName}:`, error);
      }
    }

    await browser.close();
    console.log('\nPDF generation complete!');
  } catch (error) {
    console.error('PDF generation failed:', error);
    await browser.close();
    process.exit(1);
  } finally {
    // Close the preview server only if we started it
    if (server && shouldKillServer) {
      console.log('Closing preview server...');
      server.kill();
    } else if (server && !shouldKillServer) {
      console.log('Reused existing preview server, leaving it running.');
    }
  }
}

generatePDF().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
