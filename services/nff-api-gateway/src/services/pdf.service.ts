import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PdfHtmlGeneratorService } from './pdf-html-generator.service';

export interface PdfResult {
  filePath: string;
  fileSize: number;
}

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private readonly exportBasePath =
    process.env.EXPORT_STORAGE_PATH || path.join(process.cwd(), 'exports');

  constructor(private readonly pdfHtmlGenerator: PdfHtmlGeneratorService) {}

  async generatePdf(report: any): Promise<PdfResult> {
    this.logger.log(`Starting PDF generation for report ${report.id}`);

    const tempDir = path.join(this.exportBasePath, 'temp', uuidv4());

    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const timestamp = `${year}${month}${day}_${hours}${minutes}`;

    const pdfFilePath = path.join(
      this.exportBasePath,
      'pdf',
      `${report.id}_${timestamp}.pdf`,
    );

    try {
      this.logger.log(`Temp directory: ${tempDir}`);
      this.logger.log(`PDF file path: ${pdfFilePath}`);

      await fs.ensureDir(tempDir);
      await fs.ensureDir(path.dirname(pdfFilePath));

      this.logger.log('Generating HTML content for PDF...');
      const htmlContent =
        await this.pdfHtmlGenerator.generateHtmlForPdf(report);

      const tempHtmlPath = path.join(tempDir, 'report.html');
      await fs.writeFile(tempHtmlPath, htmlContent, 'utf8');

      this.logger.log('Converting HTML to PDF...');
      await this.convertHtmlToPdf(tempHtmlPath, pdfFilePath);

      const stats = await fs.stat(pdfFilePath);
      const fileSize = stats.size;

      this.logger.log(`PDF generated successfully: ${pdfFilePath}`);

      return {
        filePath: pdfFilePath,
        fileSize,
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate PDF: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      try {
        await fs.remove(tempDir);
      } catch (cleanupError) {
        this.logger.warn(
          `Failed to cleanup temp directory ${tempDir}: ${cleanupError.message}`,
        );
      }
    }
  }

  private async convertHtmlToPdf(
    htmlFilePath: string,
    pdfFilePath: string,
  ): Promise<void> {
    let browser: puppeteer.Browser | null = null;

    try {
      this.logger.log('Launching Puppeteer browser...');

      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      });

      const page = await browser.newPage();

      await page.setViewport({
        width: 1200,
        height: 800,
        deviceScaleFactor: 1,
      });

      this.logger.log(`Loading HTML file: ${htmlFilePath}`);
      const htmlContent = await fs.readFile(htmlFilePath, 'utf8');
      await page.setContent(htmlContent, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      await page.pdf({
        path: pdfFilePath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0.5cm',
          right: '0.5cm',
          bottom: '2cm',
          left: '0.5cm',
        },
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: `
          <div style="font-size: 10px; width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0 20px">
            <div style="width: 120px;">
              <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="150" height="150" viewBox="0 0 300 110">
                    <image xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAABuCAYAAACdmi6mAAAQAElEQVR4Aey9bYxkWZrf9X/uzerp6apet8yyGqbnJWtn154dxvbYHpuRGTzZvAgQIK2Q+GDJ0lQJgRASQkh8AAmpspE/gAQfQCAhBKoaf0BIfLCEhEBCKNNagxYZGSODNbCsq+alxw3jsdvTVb29W5lx/Ps/556IGxE3sjLypbqrKm6d//0/b+fcc0/GfeK5N6IyO422/14H+3+h+/a9/6b/9tF/1f/D5c/3f6r8l/23yn+2963yn+z9Q+U/2vuT5T/Y+xPl37/xzfLnbvzx8i74d278sfJv3/ij5d+88Y3yb7z2jfKvvfZHyr/62h8u//Jrf6j8i5/5Q+XOZ75e/iz4M5/5B8u/8PrXyj//ma+VX3/918o/B/6Z179a/unX/2D5J8E/Af6x1/9AOQB/+vVfLd8Gf+qzv1K+9fpXyp/87FfKN8EfB3/0s79c/gj4w+Drn71dvgZ+DfzBz+6XX31jv3wF/gp8+40vF+PLsPHFN75UvgDeBp8H/8AbX3r4uZtfPPqlN75wb7QEVyq+9frn9m+98fl7t26+fQRKw82bn3948+bb98GdKz3gMNjrHJexPf4ct2594WBwb03uuzoe+qXm7v7g/s1bbx/BXo+HyCVl24ybb9/xuWw94V2Hl3YF5gnrv+v+9L3f7U8fnoQOn0Y5AKqQTlQSTwM5ip6yHCcG8glw3OngO0W3nHAMsI1xdYo8wz8zM+aMPimbbV9lx0UQqUSLLxmHzb5Btq8QL/RkZMdBSiZWoMruq30pDrAd/tJNktfr+/u6wu3Wrc/fO93rH0bEYYQOxAazF4eMfeQ74P4tLsyrvij39vb2FbozRinl/kWPM9PsO+OxUpa+owtsJCQnqcIY98EdhjiAPd99ZKUsHcgI3e9ZQxLZkZMmtl17xVcgE9Z/2/8jd343Zoe/p6Lf0wws+Cn6U+wVM5JVAeZZxtl+MviTi/3rsO+UuAWkU2JTNxv2N+YHM0M3nOgcN8NnPRnZNo+RtowXsy0DkAvwGMRmH2QuXPyyBBdY5v2n3enRW1eUtN6kelKJw8LxaTIzvTkrjVhgfAd93x2hXW8L7fd9f/3H2XAWb5DASTyFhOQktSFqo/mAn9QR/Y8umnQ3jrxzvFAr0P0FbgOplu67anKl5CqqJiHJ1ZMro8oFHRunV22WC1VTSXtWUfiysgqpcoEB9hlXqaug9YqKhEH82FeIN2aUII53VbRAaDbEOybtxGfDbhsXhWyvHMiGZF9hzGQ6mKFsmPf39k7vp3KJHZXAPY57h6mIMXOkZAyNhdxgW0Tsu/LI4Gvcccznc5zROTjBONGE4nBkvqhIcu931dZFV+8l6Ned9k/v1apqRsUEykxPNUv5KfLvgadc6omUZ+l/SszJYD+hTHgKmv7UcQZ+27ISQnY1ZN3xlufAZ5t981hsrSqax3EMy05i9jk2E6FjDfxOQjN2WUmhO67JZYipfYQmzsLWkjybaf+tSz7roYw6LD4+Lw4zhIm9bQN84PQNesoqvg0i8Jobt4qudq75KDm8k5Vv6VDOPreiR6zJg6JyKOkY+ZE2bVSKRcXPve5sCtnZX94V6Kis5s+rfo9XSquy5lVUSE4kttuWzHpQlcn6MkpWVLa5wsrEQuycGatVR0vsGHwFNuxrnLJ9oMk5HrpjCmVDhVSazTwAd9oVoYzDzmFGzQYDExdDX2If6UKNI9wLenIo9vIhlVsakeD0rXC1xT7V2dkXNkNcRYsSd57HsUhW98+Y7/HpyentJ4/fiydP3rsN7n70+Cfvor+DfDsU7/ADewCmkxfPt5wQzxh/53oJV6AjSe0DKqpC5dQwQzasD0wZsFRV8Uo6mWOmJj8lzvIpvjXgc4WUdsujmBlyheQKyTGujowqY+cHkDKxBdlwn4LuJMaQtVJC8Bi2ub9jGtynwr1ET7NRZeb3ZYbeuvnTQA57kGN7xwjo7GnWDYsTPJioxMqFkyVDn7+RmKk6L/wQ/jwHGqq46QRcdNeJ6eOP359ORhzg8eMfH5O47kbEXX5Ik3F+JrdLWizWVHtJbZ0rpqe8Ipxk5s+qOFlXUPa5WqpcZNlw9WR2TCKEDz/97HOi8INyV0SWk4mZM3Epm8cYYrJSGmTHFcegm5eADZccL+TGcxlnCRwY3A911Gxv6kiO+EGznpddrUT9NFAcSuHhQGMhJySlTVpiu+UtPwKx8BxA0vIFfx1HchKJqWdW3PplVfXkvQfnPe6QuG6raL0P59Dtdd/VbntlVoAKazZUU+YiV0hPqVMSlAhPh2dRT3nFPE2dGPwn4ClIxj71DMq2U/pRtdRPBIlL2bYRZshG+loMbJsrpPkYQ1zaLY9iHFehrNCoIJhdQQbEloRyX+VhTyYbJHz83E+fHrPfrpVyj2HEdHyAJS424kxaZY5iP+bsx4SxPMfGBX8dD/tJhPemziKols6qqqb6NNvp6em7/IDWKi0nRifIFrfjl3sFulYh+dPBE14RtZpyxWQUKieYNXDF5E8CE+judxr4gNmYYXfc/LtW+FwhWU9/FKXOcRzrC9WoNqkQP4Zj7HOM7QyvKsfA9BFyGMgr/R2L290ATva1jeS5mMLxB2fcptS+y/tbfFzP4eutTw6B3zwgAsFtBZ4XJsl+sVm57gqLCocjLbcrfgifyYMxlw+S2rGrpZQusHOiK1HWqyzGIkHW9UfetZd7BTpXSU+5/Jcx45nWjMqrJE40Sx7HnAx9zCf4T9GNmZlywvK8YsLm6sfJzPZMRNgsG/alrSgrItsMj5V2fgaFeOuEUMFYAyhp43h+ZoWa/W1zP+tE0VOgSsu2Zq+s0LscSjrn7pY/URy+b5VdPLgFs4HM1NgzPjqNuSOnZcGDKpZxLl6HQJXyztS4we3b8Mxpyr2VbVPy8DOrrQaaCPZDecxTFfCFvsTKWLv2gq1A52dRTkQnXNJZZVEFPeUknFzsc2VUufAJoGT73DbEuQpyglhUUlx7YRQ1n/vMOIYv2mZz1WRYb5wy42bcwJaLQoVqpNjG2CnDmLFjRLbPOtqo4UjNbKQy2lUbfR98wIPekeOZYpSSn4IxLeVxPdQYktInJdsldjR5a2w5cc0VlqsU8cA7j7Wyiyv65JAqaP1Di6nKbuX451anxpqu6M495C7wxVmBlQprls+wTjTLiurEz6/ACa9yJ7V8hpXyLP2nxCVKIZEBs+OT0Yk9RT81j1ArKvxDnPVT5BkxKcNOjCQRjkDSQ2++OTu+wX7LZtbeybMMcmXvG4THsD5wKY9+/uS9u3Q9d/OzH+aXn+pxaA+UaLIZ/7yiaroPbrsP1NhywhNP4fp2fPLWvu+0fBCeZ/E87dKfHIZi/fYstPbsSRff/uJU17wVnXLsbC/VCnR+FrX4dLDUZ1YheCRzyk4gjmvPsGZcebVqklwVubqqPNLplzbYF+eMcsPX5IzxjQIX25LpR1zaYbdiuwXY5OqkEC9QbAPFskLFcga1HYYm4rfoOSx44Y8utkpWt7gVpPedYVglYzDHiC2mTWwoNFnXpu2aK6x22Ly12vCpG7d0Ry3uqpi3hqnbuAsNHxFXmfwkXWgau06f0AosVVgnKjrRDJiX4QrrJP2lVlPI82qI8sEVUlZSlvGlPOIZsuPnTPbIGOKdxCynj4WwnjI+wngu5WRW4ELFUphhgW0ToyLn3rJhvfFYZmBatYz8pRxe9FaQwzIizZM0LI44RXY0PD5m0qdix/Osd5nIeiKh0nL1iO9irSirTo02bje3/qrIqPuSeHJyMpmw8j98L0XulJdxBbp8bsWVl8koJD+vOuFME02PokVlJbkKMrLCIsZygn5znsshVz+2mw3LRqHcsF6ITTCWGbMq174ZE5YNpS9trR+8aAySitlIJXc5pgdPLX2Pfv7RT95N9Zy7W7fePmKIfaA1SGKa8mbOI7Cj2aTGGqSIaokwG8+pxJLk51mnJ6fTX8rkmdCFH8JP3/5d2UPxTYnpMp9Ashy79oKsQPdUs3we9ZQ0kM+oqGqeYjtJfaZ8joVs3VVQMjFZUY34xDJxaTeDVlGlzf4BabfMcdLnWAPbbM7KisqxPFuZy9YXMSXtTkS2FfcFS8yY9tvW0GJPI7a+FWT4A4YUnPDcrCf4oa+yS0EfH1d2MWdHBPeFCHGE4drSlueDTFqnp9OfHF70Ifz0Q/H9qzqjmX/VzVUNthvnhVuBrj6bEhWUUQYWlVaVXXH5MkpQBJhPzQnJlVKDx7LsS8+w7PgSoUJ8Q9qtU2mkjWUrKWO0XCn7YJ7zXEZwP0IlxlZu7mSkstgNfo8vMQ8NW4nDbd+V81NBH2KEiBCtwkOHRBt2kuzU6pYRuMZs+flVWG1GTlqa+uSQW0MS6tYP4fmUcOqWbf1BfJvAVfBUkryKcXdjfOpWgAqryFXTU161FbPhk8Jqd1U1B+VDymaDPq1Csn2GbljO5FVIaLYR68oo7c1m+wq4QOQE5+9UeZxExjOOxyAelRjXSkIzLI9h2xjVZ4sl/wQY4/jnH/34Xcvnxa2bbx/Rb384KFVR7cm0qgknzYdJvXo37TOSMcZs2We/qc/12c/65HDbh/CduslP8fxBxWXPwJ8EhuJwdRyS5OQXSlfjdvqLvwKdq6UTLrFMJqFFhcW5ZSXUGF/qY24+OC83+yzDroBW4x2TdgVH5NomTsgaqhD7DGFPVo2p/dzHwLjUCHaHtFlOYbSzrfWrXCK2S1Z8KsghDoAawsNKMltsLBSalrdqiRhzKCIIi+SIQH7+FRYHzTY7mX0PYfIhfEwkCWInW1atExUPb0ZbV2urB9j0/wY3JcnV/jv9xV8BKqzZcoVFydAS2OK51Gz5/wL6u1XEOcnNY0hBrqJmcFZd+FOHrVt2fMrEOM62VeaFXZ9LkaVcbzimDPHmChIZtiq3/dg2llf8pWx9K0gpdMRpeFBEiLlZh6rO66DpTMsNy7g50v3GzLzciWiTz1vUjuNez1P2reHGh/B1IufeT1Y83GJuSjjnGdgV2mTiJDlmkjzPILuYF34FuvZpYK20uGQCcBFlsuDTwcrYbLeePOjEFesswzwO2TZjZh9osi9Xy8mi2qGqSDljBj1lqcURJscw7NAISMlspDLaNZvZGLmk48cX+1RQTFViOPMcYrMNss805yWFIPQIcygirI1Yg/zJVVhiy6S14SE87nO34Xtea8+ygkrt5gX+sMQtKlzS+9HUBGLLD06mxtjZXpwV6FxNGX5+lRUQ6WHOZIqUKQFcGc3leYxkW1ZJ2FwNOXGd0q/KJaul6lfWD4W4ORjXPlcXjre9Pr9ybCHeED3GKOhjjH2Wxz7LttUfSNnyVtAXFwc7cG+malpUVGicJvvF+Kks7ZYjfJ6OrmMxt8Ft3Vjq+gkpTlqc81afnk5NdbLKcmDIf1ji3LeH/Azus1KTyYrhLvUfqum/ay/YCnT+FNAJy4kmv63OCbTKKPWQ5nrzmUHB52suGbnFWbfcfB67eJGtFwAAEABJREFUyUWhEoZgBkmZzrSCitt7pdyUtLQdgXO75WZvbJthvbGPtd2ngvmAl4urHYppekCZPWpDGuc7W0XMmGPQK0eYawwiPssV+pRsGx/CbzE/V1kkmsMNXQ764a/h+Ptet6igvN6ONZOk7gD/ibKHCt3R9HZ8Ff+henronfXTugLdiZ9HkR5ONcvnVCfwCW/3p7Y3xn+CfgI7zlWRcWq/bWbgKsk4bTYzcGzCMdbNU2g+2AnLfVyVJGNbZpIQNvuLeQ2DP+3cCj7e7lPBvb6/T1cqKkZnMkzXKrrHBbb5p2qHOYER9pwgYq27/4Ltc5cFD2M5xJ0+JXDC4YQv9embx+DsD884pQPS92FRORoSWDGTpO6DO2D6+1s8t9olqzNW9SV2dVRCx66AEiHSFTCPwQIQx+tXiYzFVojxdZY+ygWzYVvzFV51AkVsQ3z6iC8JxrTdsuMsE9qaY4RdueFMrrs6JtXaBr+jAt/e6elWtzhv8pyFbgdAEYwQjARoUu6kBTeD2JpcOcIcioj0RTRW2qyOoU/ZtvG/72wxz3nSIsls0e2s0GMqwNtnBex8L+8KdFRDxyCfRc0rJtLSXKYcsN/VjTm/X8V6WHc11djxNZGVHKvKJCPGmgEnlxk73k2z8iiMa9ljJGdMyYRJ2KBxoEEa25rcvPUodV999sxxd5tfyudbksKtINPLAcwe00pjy9NoEZXdN2eVauG8ay/bDWurbNunBX6edRWfHDppRX04vv61ifOeLAkvFO/sKqvzLtjLGdfxKeH3XBUtgXNNfcyikglffpJ9XNTJTU7d8cDXZ2KIt28Bj2OIVERwIDM2UtUtgLJkYyBsy839bDFP+fFFHH+4xe8Pp4f29rgVRGBa7CVzG72x5luzVI4whyIaOzDqGNhog6xk9iMOfbKfEWpyy6R1BZ8c+qsHTjasxtl/DWd1Fv6tEkV3XVV5jFX3Tn+1VqD7Hz7+/iM+1bt7wlu9q6QEqaNWUyWrJcsz2xwDuypynG0pY5vryNQSss9VlNmVlePWQGzazKx7Sbj3GE5shfHMggvRUxD2CoZBKI8+fPzjyf8nl/6JHQ9673CK8798k/NhR2O8bCu90oOtss/XUQvGxawYM6urVa6x7HG4j6tS97gs/BsNnBhWcdFxM2mdnOaf3mpjDreLWw/ppEPyyQTksVieu/w0Dw3k+ru6SFD2keD8J8Ace6lnaVtPctfhU7sC+ab+P378/QdcLIeulhJMF53koISrI+uFEqEEtgbH2QbbXi9bKh5smGSbRDDNZKQNvWSMY7Wy4XRgWi2nMNrZRr+0NE4ld/bS/fjDj36y1XMO3woypfuA7gzFQDRVRZqzxltGYDCHIiLliMaoClldRrVJlSPMcWUVlhOME8MqdIltdUzrlxguu3p+JK8HvmU0kOvfJqQqti+DdrvdCoxWIBOW9eOP/593f7d0t2dl9oCKKp9rZXWkMv8ulasoI+1kp2T89bkWcchpo2JwgsvKyjbrGS8qjRpXbAeY2WNnb9sCzWY27GnsXlX23BOlPCqlHBofPn5vq8rK/XtuBT1qYUeziRklnbEbRxbOzaGNmd/gzjFHMp61WNu8Zh5hhxdoBXZTfa4rME9YPupvcnv4v3z823f/19/5f9/5y7/z2/G/gb/yO38j/nfwf4C/Bv6v33kYf/2jh/F9+P/+6FH8Fvht8Dc++kE8BI/AD8APwY/Ajz/6YbwHfgL+5pMfxvsf/Sj+vyc/iv8f/BT8rQE/e/LjMP42bPwd2PgANv7uk/fi7yL/HG7g+VTMQUXlb7EbPpdtcOvWF+6FxEfsEsWOkOWtsWUjoloizKGIwBzJEWYNsnmM6sOS/nUWW1xZhaXdtluBl3QFlhLWS3qOZ56WbwVdlWUVRGRjxLUKizibqY5cLrmSWrB92ZcdjRhqJtxVdqx1M0ZGdjwW4qwjEbirsHJ5d7vdCmxcgVc+YflTQYojKbINO23YCEqPORQRaDFiVFmX7Fqg2cwhKRQRkkIRIW8RsauwtNt2K3D2CnyyCevsuV2799atz9+jsMlPBX2wWutY2oQWYXa15LjGrpKsV2bcVCq3GLP72rXKtu2wW4HdCpy1Aq9swuK51YEUhwr2qhtiFYZ9RLVEmEMRgSeSI8waZPMY1Ycl/esstgBuAzOetR12K7Bbgc0r8MomrKJyL2scdrRcocapsCu1PFJleqRe2TarC15UVs2GZaUvFndibKTcz3erB587dsJuBXYr0FbglUxYVFf3WICDrG1yh7bUqjFizLFULUVYV9oQ4bFsX0gKRYSkUETIW0RlCU45FNEpIiT14GVtu/ParcDlV6C7/BAv1ggkK55ZlUPPung3iepxpWR35UK1lFqyC6VVSOOY5THsc+8ddiuwW4GLr8ArlbCGZHUUw3o1lqoUMeZQREgKRTSgpWw2bG8ckkIRISkUEfIWUVlqjIQtIrAAWA27Aku7bbcCZ63AK5Gw/F0r/6I46p8jiiC3XJNaA1msUq2kqIVcOhFVdXqhW4aorqw7xmiy2WOsco3xEZAqsc9xYDf3Ml81nJyvElPze/PNz397ClOxzTY1p+Y7L/vnOTXOVdk8/ngu1q9qbI/j8cbjj2X7t8FZY43Hfc7ytR1uLWHtv76//8tv7N8z9m/u3//SG1+6/6WbX7r/xQFvw58f8Dn4l25+8b7x98PG3weP8fvRK96+b37r5tv3G34BueFN5Ivg5tDPvIpbt94+unnr7bK31z+kljnMVYzcr+yqMWLMQeETxEVyhFmDbDbGtpAUighJoYiQt4jKUigioEhmvyRHhHRFz7D8gi8qR1eJqQtjNov/cFbiN8Y4LfE1TmRjm5rT1NgbB8DR971v66/0/Mbz8vgcZt7qf9u6uvVk/HvzwVeE8TzOIzO3h7zuG+77jXllyJdKnSesr5KovvLZ/aOuKw9ZqMOZymEp5Q5n699gkJhJyQXGf6eoAGzothnCZhR4jJniTu2j7DOjT44N136qx0IXaDbzWYhRLNd8jqFQMv0OKJTcdPZGJAGcL3tRRZmYfZorF+RVEDmKJYBubQzEtVYj1sw5v02+9eidZbcCKysQ2uc1b9wJxaET2MuauDJh/cqt/YOnnR6WTgeFM/dvUighVQRsoAvYbnYcQFxpBMztllfc6Wv2xkMMKk0OGTOJqNps3ICMkWTOEHY0DJrY0kPsmGPQzUo5x2JHQ1+1haRQREgKRYS8RVS23BAR6Y+ojCIjouoRsEK7bbcCV7ICJLAYEper7SsZ81MySCascqp7VD9ydTBnyonU4VlC+atmUlZBLuwrss9cq7bCCTZpWW5WDT0IpDkGgxvzsA9gpKVuB9PAWIObbJ7DLjrQso/Z/TCvtPQQM2bmlWpln/t8XOxVHvswMrjjPKnKSA6cOJqjCSdg4XSosbCktNvtVuBqVoDExevy3H+h6GoOer2jdF+5uX+HSurAh4FNSuZdvyQwBdcZQEpfXnwole0YA8dSs88Gs2F5gWZJZkcTh82AxkojphGnD908ByGOxSyzvKViwWhK5QhzKCJwBgypckRjCXFAs5lDUigiJIUiQt4iKkuhiAGqLHQjouoRlW0z+j7fP3Rd2+nJ6e2L4ip+/9VVndfp6enxec5j6nis+DvP6vvkyXvP/IWBvHUdPmucTX7G3+pvDJw1Z/tUdBdMz5mkxXOu+1Nr8SLaulJm33GFxDMlzchAKfO2PzNYhZJMwkK2jxCkqvuE+cGhj/f2jTH2Wa4+9zU8XmMOxVj4B6N1+6oxJZyVm8/s8AZ7LZvX0TyV3dcDLjMW3NVWZY9TdeaPDyumFEaMuNa4lVYM1k08uCH/XjHo2pqTzkVxbZO6wMDnOYdNw/q3sT6r/6a+Y3uU+MGzxtnkH49zHvmsOfsXHZIAH4C7TpBcK1OJ64DnWn6ue57DfapjupniwNdUCeYJCu/6AsUypmLZPAAami9GiwTKsDwF+wz7GlsGqDS5u5lDWZRZGBpbTogNO3ulD8FsUwOmeYuwVcSOOVKPMEsobqDqmJHTLKnaKoeUemXLys16CopABtG+uZ5yKAIImIGQBUcsbEGf3dew9MptV3nCTpBUn++StB6tjRv67prtBTR01An7rqyykqKMyMpqYOoJqq6Sz6tmnByxKReVBRNb0KvPtUdZ+GzHv6jMChYGojkeFzo2FBrPlNwfpFLZ8yIofY2zHzE07PT3eCg0OqEMLfsiLzPxDGAbRLx1U2PLDc1m9uir7DjbOQitjoeNiabVBgQaFgJojMCehpFW7Sl4h33XditwiRVw0or6F4qWRyna10uwOWGpBBfZAM3ZFRRAXz5PGwxbYZqlxeVmg2ErTLPU0FRzeMcBK0uNZfuACAQ3YHuqTRabDZB9pjkvKe4gRZhjxGKzrrTZvYyxLySFIkJSKCLkLcIM4IhIe1AtRVRZA0cE4aFQpwh4BAxS10lX9D0sBtq1V3gFfAu5dvo8y9r2+25rY3wKDNwSllpFkXFcRWWFJWwDMCOR0NiXJTSb2Wdir2Wz0WT7FvB41swuQFK2gtB0DuPOWKCRz6JjzHY2tjyNFlHZfRmRqqxGVx0L7rFsb9U5D3xEYEphxIjPaEUxRCxzwWoo/fYFUmi37VbgKlbAVRbX0Npt4d7e3gtfZXVcKTJcZYmt8M4vDPWC0mjzBWXY1Nhyw9g2lpsfxkwTw7spDyVVxpE6rAZJaZOS08yOJm+NLVdUS4Q56BOYY8RK2e4p4MUvtnGfSF0yi62xFIEMIkL+J9iIQBvBNiOi2Vn2uYyN6iqik2Dttt0KXMUKUFFdxTCftjE6P78y/EzHz5pahUVtQZJ2bVGlxb7ZzEb1uK8lV2nmlvDG7KrF+pi9INZ9MLPR5OZb7WM9fd4toXp8LjmzYbCFjhUbLausdWbmOYTZQuParx7K9pG0UKuRfRsXsTbHAJpPrdrYW5dC3qpsaYcXYgV4iM0nb/e3xfM4t01fFp28VXweE7rCY3SF62UOXzzodfwmmI1qXd/bZ9jT2HJFs5gpKtK4yj5sQ/oITibajCr7G2vjlhGKMMcEu6PtwjdGs5lDUigiJIUiQt4iKkuhiAGqLHQjouoRlW0zIqoeMeYO1zL6a36G5f+usS02vfi12/zp+h35v4GdF9KBnsPG2+y9qcPkreKU4wWyUWFxerzvLyoj68JiHsO2McY+y/at1wm2zGGBxXEFAmWVY+Zg7lzFUYxFx5rtbGx5GjViXFF5YI/h+DGP5UUM59EcOans5d0SfBRjyTgom+yDG4o5gle7BlRZ17pxjMNtMdPsO9c6qfMOvos71wr4DYnA9cRYNPX9LL1oW+frZfkii+EczMagrpF9hh2NLYOmwjRRWMwhDNbHbDnhrvghOSZFdjSb1DgVdhHVEmEORYStyREBCzS23FBtaOlfZ7EFcFtwRBDPko0YA832IDiU/9KPNLBgI2K575Lu51f97ptYLOKubdHBN/AAABAASURBVLkC/vTPlTC3p4vfSrIyRn4/a8X2IqpUWFKrrmZUFdQY6N4PIJvRBo8GHnzWcFatnj5qVk4LxoviwsWgS/obZzU08jsGNWPMFpIZvjFituyLVNnHcURl23IsdjQPM4Jj6MgkMm7gPDsH4yKCPZZBRyJq2OdhWgQ2dFrGe2fZcId5d4VdIGyecxnsBcuuvVArcMwP8sE2KFEuVOX4v9bcrL8qyb8uaRUFv3/DyhEvpf3JFSy6+zLcDvrceMs3Gb6gjCZzIQ5iMbMaSblrcSiDOFBGWU54h8UFBpFCVG62D4hAcBvgGEQtODVNb81nDkUEYTFiVFmX7Fqg2rBiRxawc87pkbdYq4pCciyICMQBioUdOaLqEaHIMVjqMVNRpb0xvk7XvBU94gLbDtptkytQ9D3/d5ht8NHjn7w7Odazjb7F24Sze5OsmOOFEuXZA1+nd/PYneuEZThR2VI7NclcsfDXRNbiFmx7wjvM8ypj0LloPAgeCButVj+2oNAsZVgKG3fjSGaXauM6trv6+EaT8eTxKmcnXI0R5y1SssdIRdWmgcvATdfS5tgBJsfCEexSDvYhNV3Xm7J44d7eFpe4yLTbPsEV4M0pFO/w835pkpVXkysk4DFQh1aS7bNgNiwPGKkpsqPl9edr0FAaiJ9im7HT5Fiz2NHwyKLGW0T1RJhDEYE7kiPMGmSzsWzDkv51FluAoTEWgbQY0FVWEBCKqECgVTmicSeMtA5gywoKpoKKbuBRbMTCds0fEmq3vSIrQLIiUd32f4x+2c44v+lOTTJ/blWfZ2XtQYVjTxn5Cjb7Kqw4qc2BQMvqxRWN4Zgxms08j2VVm+5Y2zFZNM3h501WKjMXdyLKegXzwkYb5uCYhQ0Ju0e33YzFwR6UcZK8s8tAThpiUsY2bzYAWu2dgnd+ThWETaOo2Tl+yoQm7x66eyV2WF4BXq2Hm8ALb7KC8kP45VFeDq3bfBqLi0p5MWlps9cG8xwWMFI0KLtYX0Hzme1y3CprbcsIRYw5Br1yhFlpQ4THsn0hKRQRkkIRIW8RlSXYMogIRQSmSI4ISaGIThEhCcARoYgFUBTzigp7kxtnf4+xjo4YdVeRsLTbXrIVmJ3Mvudb8ylQSfl3ax0vnXJov5Ryf8n2kig8wxJJegFLhZMjo2P3vlpswzxvTTfPYYGIYl5B2gZfutjRPDjHwUFLHV5v1cMPIV11LOaW5sq2zUGUZQ++4AweKiwCtmhFsRLddFdSdlU9wgwa2zXvi32QwzzERKABRbe7I8z12u22XYHTk1P/Ar/l/ztI0rp58+2XLml1q4uzuDgDlwG11lSYprzuJAVKg5CnYL/YzBnCjibHJmu8VUvEmEMRQVDAAqs8ssm+kNYYS46hpS0iFAFUIWQjAn0E24wI7ArJPAdLSdKJMxEaV2Cuqmp8r45+ZKzld0rttt0KPHsF/JWFmPqVMqE7L9utYeeqpbAm1ClUOov9bNDMuNHYE0ijSnHtAlCyh3lABo7kHH/QoZW+HtMjwEvNkR5/zMRluWSuPqtL42OgcQzHuO8q135Lh0LJPrCbe5mNtC8ZsKLT8jTRsllPQcsVl9CnUMb2CEKAuuP3H/3m8rukXo2t3+vvn/E9o9XvHS30T7aCuHehOQ/fp7qiRDJ/gfgBO6/2w7lhELg+Xq7f6S5fMHlyvmiMVOa7UKRc90qtdamMhyZv5gHpQ44I0SqGmBjYlI4UxruMwDXmGHSzUq7jNn3VFpJCESEpFBHyFlF5LqNHhPxP5gnYbkQQtYYOV4P9lhs3GX30CWFWVjyzCtBFr87Prvp413N6RbHpO0Zn27nt+cTWqx777PlJZ/l11ZufdfFOuvymxzz7vr931cf6pMbjGVbhHMcQ+mI6ZRDNc1jA7goEWnSwfUDzmdPEjpaxydlx065G8O6QAR7DHSsj4ba8CjxUV+7C+diJ2MZAXGmtGloxozL80hpgmjf7qhLQOkJR7WG2CKfcuJOiIwrACuZBOf/+o7+0ux3UbrvMCvjW8PT09J21Mbg15HnWnTX7C2joJC6khNgsQ62h0mS3mWvLoszC0NjyKtInyUzonGVFq1s1RphDEUFAjFgp27wMxzRfSApFhKRQRMhbRGXLFZG+iAVjkBEx2AQb6AKpwSnDQaKJwDpmqqW0N7ZvLFs3mq3rFdE/Unfj9vuPfmPyo2nttt0KbLkCTlq8XR9OdLvn/3M4YX+hTKMKK+uTeWWRlQQ7WlYtq+zALGLSQd8R255gKVbZ/TCvNHf2GObC8Ro7zDo+lUf0PSyzchfLAI3Y8nlQ+ETFmN3VLCpCdwXquB1jRmJWGA/MStydUQUFMYYUd42CzehU7gYxQayi3BV2SWu2ou5uhy9K/877P/yf42/+4DdIVsfLJTwdr6QVrf8/N13xFuU3+cn8x8t4xjGm5nVx2/fOPNrUuGd2mHbyujjW1FiXsG383VRTY05Pa6PVt4bM+XBpztJxt9e98H+Iggpr+bxjUJPZ0RTeYW8s6ytIHzbzHPTJ2Cm2bckZigisMeJUHzx5/ON48uF7/ubuu0+evPcAecCPRmz5fPjwwx89qHgEgw/G+O0HH36wit968OHPfuvBB3N8Hxn89K8/+AD8LPHXHvzsp+B9468++Nn7f/XBT9//KxXvwe/95Qc/fe83H7z/I/Dj67398wNY1unuKljNK21PHv/kX1/FR4/f+8/POsjqnC6pP9h0rI8/fv/R1Ni2b+qzye7vP02NdRnbpnlMjbkpdtN8HT81Z9s29XlR7F1hpgaUrcnmwo5GxZOuOZO5eVNdtjnWFnP2QTFDZ7QWYeY9wcTgHiM7FR2SnO6mvNvtVmC3Aq/8CixXWCHRcmfOgkdSMobGQk5ISpu0xM1t1miLqJYIc9An8EZlbLSUk6XDx49//Cp/csba7NpVrcBunJdjBaiwsqyhrqFoQqRlJdUYa+oOcOVjNLlyrYxsb33GXDvXxWqf2FV2v4wkBGYAWsrw8S5Z1TXb7XcrsFuBxQp01DepBXtXNhBVjvcaGA9NAzIGecGhuSy2AG5zbsKSESXoFyuMqtDp3snuNtBLscNuBXYrsLQCVFhyoVRBoWMvFY6JaidpEYA69jncuhlXjmHejHGkKyxHNuYwdvMp28cfvH89n5z5cDvsVmC3Ai/sClBhSa6QstbxTkpdyLab55CUNimZEIRs8pa6hQER1RJhDvoEnkiOMFutjIpdxzxk3/jJD9G7tluB3Qq8witQKywqG9q8onLV5HLJbMxlFsp6izWnD7tb6hYG1GdVrpzscSW1YPs8lg9qNk6e7m4Fh6Xb0W4FdiswsQL5KaGrG/saK9AGpA3ZDKmxUGgya8MWkRF4zaGISDkCBrRBl7C84++PaLftVmC3ArsV2LACmbBc3djf2FVTAmOzmbM+YkfDQ+WU+807V1HV6x6usKwNjMlj2sKx/KngccoX2L311v7+rVv7B7fe2oRfwfcrB2+9tYJfRP/Frx68tYSvo1f84ue+fvCLn/vGCr6JDr7wzYPPfeFbA7598Ll94wA+OPjCPviVf/zgC3P8Uwf7X/1nK77+6wf73/j1fX1at928divwKV6BzqVNVjqUOJaXwMTTN7BD7E+2DYxbRPVEmEMRgTuSI8waZLNRbSd7e1t/KnjrF750783f9+WjN3/hy+W0lIfR66grOooSR5wU6ObooxwZpdNRRcDdkUoPdMQsjiK6oy76o46Yro+jvu+OinqgI0WA7ii6Huiow9dr70hdB7DtxVGn7qinb29bv3cUwkZ81+0d7e319OuOur0bzKM/ulFee/gHvvFnHn71j/3Ze9ptuxXYrcC5V6BTWVQ8alXPwBBu/AxHmN3yznZMFk1ztIqqMv3ciSjrFXTHRmPcKuN+5+MPHj2aD3IO4eabX7xPv0PGPMi5eAdo9C64GDv3qDTbDZtKChizRe6lKbZtAtERbgw+EjEGGjYB6w3o0fVK0C8S6GTX6Lp9dd3hr/2Juw+/9q1/6Y52224FdivwzBXoJC48msmIQTZbFELljBx22rBlJF3MMcF083ghfImtbwVvvfnFoy7iTkQwRgVCDhZhvRN7AKMLRGABVbYddAAbiQOz/ejdwLYnsM0ZmeTTRafOfQd0JJ8Oe4T9+OAOX4et63t13V5FP+Imp6/f76O/941v/StXepvoXxB3ldDEduvW2//oFCZC56bVOc0dFxBef/1zPAr4wsF4TNsuMNRSl/F4TV4KuIDSxml8mXm6bxunsW3bT2u5h8d449bn7xk3b759f4Q7yFu/qba5XRV7fl1OmaqjVR5m1FoB2YlCs+QCJXnzrkZS+RBCpZNqY6oe6yCPAT/+8Mfrv7uHnpuabwOlOACqW1TSKlczh0AY+5BJQDI0yGO2vAS6D3pEKCKkYMlAqEPvxE5SKGwD9gdJbA6SVxi2kcSCmITlAaLaKns37uuKNr9AWHVuZ8uVwS+W1emxvv8p+J/GIOb3g8nmMVbn5d/aORl8DmO31313dbz+kr+szhfr6pjWPfdzTGkyxH09xhjM82gy+BzGqzxvz41k5N/4Wvq9/iGv5ENDoTsj3Ed2Anvonxfxd3SOrZRyf3zOl5VZs4OOiciIUG5mi43Tl571XYQjpQhzLHGE9epDxDeW8UnbJatb+wf0OowID5SICOU/M9CACE4LuTHBiiAyEwecfsecgYylYoI7EF3PGL0sd9Gp6p067EY4JtCzqurV9VRURgcbTTYbto0Q/R6JWK/iduAk8Wk4cV+8vDoOp+bSkRyn7Be2hfa58O9fuP8lO/pcnXx6kpScnM4zHnMm7ID4TF5+Y0R/rq1r1U4yh15ll1W8g+JZb8XBmCsXqjJHml1NrfLCRuDWt4KK03scytMxJXx4HzEV76wAjrwUJ1a4QmwBWmvyFIcigsBOii7lCHRkFFqATlLQQoE9SF4xVUnZlv5OgayEZdD64P/mwb91oFdwY/UOPw1J66yk5Dn6Ir/SHw+J4pM4bx8zE5V08dcbyYvr7Mhj6TluXYQ0h9isQxqx1WXgxBAx5lBE2AoLBBhzlTE+evx4+1vBiO5AjB/BuALmAYKNiGbvUEfyUP0ESWEZjmmxA49jnUzmeq8g0USOYZl4+4hxhbXAnroO9AOabDb6fsWP7lh8caPb1yu6RYlP9C+8OBnxajg8a/m7q66yONjzPm9XVc86T6Z17uaxnmfSqhUW0xtXKxQpWLRSpaRp2NWIWlkRl2qhcKruHCtt1bfQi6KUrb7C4O9XeVHqyHVfIANaa8v2GPzmFZDcJGxjHuQI2ztJnSIqlLaArIdk+9xPAiNxRQK/E1kmN9sHPX3oto/91j0WfqnXdW6nJ6e3L4pr/1Kv37F55uHEcZ1rsGns8yQjJ5crn99zPO8hsRxsWgOu4EMjFO88efxeGH69kAju2k6/Y7DWWJfzv9EW3fWYF8GTJ+89qBUWU4iQaPLW2HJFtUSZiRX9AAAQAElEQVSYQxGBOUaslG0eAyt29hgjiFc8oLqaPGlt2KIv94ZBIMbwOIaqrFXZeoJEscSOx9YNnEkC3TGZQCwDEocTT4fNCNjosBuWI+Ua2/W9uh5QIXVj9KMKa2xv8uCPgd237683YTnpXBQbfjxXa+biZQ0u/DD6MpPhVXG41L/oUVE5XLLV+W284Jdit1HquNd63n7etHaObY6cqxOIfyOpMb5G/XpxorCdmJa4Wk+RzB7gP3cREhGPPOZF4INSYRWOyXELsKWx5TkwIpdiJn6N6YuNllXWgh07+DR79OGHPzr3iXE45aeCRfMXSBtXw+bZWDTbZ1kKaUAZ2HqVxWY/NG9NN3f0iITYKyzb1kkKCcQAuTLqegVsWdEpDGwyYtCb34nPNnxhINc+dQz3FTF61Tcu3uf9MPoNPspfXfYS5YF/NzoXxyNJC3foen4v+jWfN9fu5AP+QlIm4dx2Almc5LTkmCFx3RZJDuSv4Z6Ovh6rr6o6clRS40GtVI0R5lBEYI4RK2Wbl+GYwVdiu2T11v5BRHeo8BjLsM3AqsQ8plMElphgkkGk3b5VkDTsXwI2kk3Mbegpw66KSDquuLqUh2oq5V7LdnQqp86VFf5o/awPSBu+rr+h3cYKPOeH0dzSrH1M7wvTFyizWb0jOCChrsUTd/l2TeedCZmEuDbBogc+zzX7MwxeFyc58OAZoVfu7siS5xi0ZAxZGi5ZRVE3DYyE2xVOA0GDr8bi3v5WsOiexzk/Yggd2IlLyLBAKCRY3pLRBSyDiE4BNCAiFBHSku4YEhaJzEnJiSbwB4mswxYGCSmMJpvHGPssuy+JK7ob6vvXtNvqCjiJ+Damate3z2dSqxczF3I7YkSs/2We66qyOGgoDq86IXotGXq5USGRcLYqIpYH+GQ0rsCpA0caI8yhiECPEStlm5fhGLGZI5nAR0+2vBV88639+6E4iAi6d8M4HbL1BTBIThgGF36MOWXHrvazPoA+TjSdE0fGd6q6/T1D9+idOscR02UVhK1VTCSatDW23/IYzQYH6OxrnPINdVRWvUHS0qu48SB27bRJIrxBXvufWe8nvmh6eno6/1sC+TyHi3tlfgeZ6FaMW6tT510HuXdVyTrHYS3rsIt9RLxwycqz31BhURPh5QXjPdWS9VotSZVbNbXMzWeufaKUrRbGv3GBQ9xxbw6OOEgQDR3rXAgUtzEjB1AQW1krstgiAmsnweygTqFOSr2D7A/0Tkp7h83o4R4TMoksold0vdgpApt1wz6glHtF+qrfNlmnX+ekBZzMRNLSK7jxTv+AV8zh2qlzofV9f20PozPpcBu2dFySk295xjY/zxrrlpnXPfNlcNZ5c+1NPnPa9ngzzb4z1ScT8ZTjU27jChrPMAbFHIoI9BgxqqxLdq2j+cxBkPyXb461xdaVuB8RjB/0CoWY4qBHoAOBIBlEoDfOBNBip9g24PiOBJJs3bJheQzbenXEdksV0Z6WdPsNxyTo0wMnIZD97U/Zfauv37uhnlvAjiTVpXyDcV/dW8J8wC2tv1ZIWtwiXcnFq5Wtm/he1VRyyuc8JLKl7iS6THhLxu2VPO/RLeh8BJ/3rbcvnayjxP58zIWwvs4L37VKJOLv+ue5DfIZ3DCrbuCBXLpYNBcqqyq7ikrJZgTrBuIQo4FHfaRHj3/+43cdc168+fv2jzgECxxDl8rYqJZssj4CCUtCbyxv6CbsATTAIRG2dIoAAsnYNtqJIdnEGO5jjG2WgwQ3RrOZxwgnLcDtX2QSI1GlfEN91+k6N//gt8VVXJTnOSdXNf7YnB/08qdy7kxy8LwtXhV8XvzkD5fGIyllcloyVmUqkU0lvBp9/n2et29BOfZEr8v/tyUS39q408daC7sWAz9LbQl+TvNvCuQVEhHMLRQRc44IdIHGlhuqDQ2/2KzHMm/7BdH6qWA+t8pB8/iBaHQDWwZc2OGkcRYypsXCMSSUtDPenDfYe5KKQbLpjJQHW5Mz4WAzD7YwGyNbZ3lA74pqQE9l5erKVZbtPRUXi3htjVU43BZ9389fLOeZ2GVihot38v+Yet68K9+5zPjjvt05q6vWZ6iElpKp5+TE12Iuys8670sl6yIKAK1uf3HV8KLonSdKmQYVqqRay1ivcOVku3mMZhvzoi8DXehWkEnUVofizZZjpsWGJsfIUmVpihfPsILEJhKgERFQ0IVTxx4Rgx7YArlTdH3l9Fs2bAdh2bAMMrbqyiRo2cAXRs+4fY7Z9XvKhEbyigHdwNZFItMrvvni5Qe/6bnnlT2M5id9uLrUm6orx+W8pLVbqW4i8ekCm8dnTtPJulzivy2FlpKs2EqUL0MvZOvqrAMKLtJYYVSFIrSCGPQxh6RQRPg/Nm93K/jW7SM67gOGyDEQx9yhVyiTQJUjHGN5ikNdJhD88KZP/yLG/l5OIImeyimBrQcklmq3DNJHAuosg+ZHD8N+2+jbWyYZdSP0yIZtya62uDXUbtOzHkZftqqZrFimniOt/Cxi4isOPCO6c9n5tMP4QXhROWz6nLmto4C42CemE7d/XC3PrWqen8NCOOYN6cGWmH+1pKvjFKhQGEGMVKwijnksu9ap+qKPbXSBylbJyp8KTi3gMIUcUgppQKywIiQB8xi2GeFTBPapseORU++I6iSSWoQroU7RZOsNTkKG9caWG2wbw/bUndRuyImpIyF1mcRuKEhiMdI75P6abwn50T7aGvpktqx2ppIIF29/yU8OnWRWz2r8VYZVX9OdUHL9msFc53NlCcDnzVV16KGXUI9ztGQ7h0I1tVZhcQ775+j67JALRITiXd6Q8hvyW/D8C6qdxBDRgJayeQz7xTbmGPTKYhxFbH8rqO6IfnQPtX/KOaAld6irMrZMKnBsQOfk06sjzoi5bpt9nSJ9lnvi9tSRRDonFMPyGPTvEsQNfied7OM428awLauo15TPqpC7xGsc54Z6klPa915Lf2++cUPXufECuX0BzF8s1zm3qbGHJLJ2GyYuXp5n3Z/q8yxbVkP0X43rSYKM+fBZWO2X+hV/kTSfl03cfl7kvDt168+rOP/8flZO/sXadZREVFZlABqlEw3dcoP9PrExuwaybsZXyvHjn/9wq+rqzbe+coeeS20YDVvMUfhJKcF8wnZYbIM8uGyoiA5TKCLQO2lJxxahUKew3eh6hdmwbFhO2AfS1ktmI1p/bGEs9MDfDckr4DFW7daD6qobEpx223wF/FznrE8OpyqleecNQr/XTyc6LmKdF+tjX80XSYdxr/K8T05O1issjsOVew964VonfkoRISWzR6apIpYYL3pICkWEpFBEaNi2Slbu04XuMYDC/zwOiECbJ4NO0WSqobncbBOxHXGd/SSNIJEs9DpWh73DHo6z3O0pbZkwBtl26/b1vboeIEfaLBuONSwD+wb0WUndoN8N9YNsrhXVjWrnmVVWVa6sGqi6vC47LFbAF29s+la2E8wi9JlSVlfSld2+abT1E9+YH7m3Fn3eVJiTD+G1xXl7HE3dWrMOVJNrBcPWE33OHTpxNq6ofFzzGAsf+bhkBJVXCiiNLZatbwXpxZG1r7UtsACa+MlkCysAjmpgHxL7hohOATQgIhQRuLtEYDc02KLrVdFVDnSj2ZtsNmxfZdsa0rcnJ7VwxUSC60hW1jvLIEDK2LuMuSHHJNBlaLetroCfHfEKPFy1b6t3V/SJ3uRxQ1f28L2NPySbTZ+YtrBnMolvUzFxb0jizxxjNYBkd/+TuK3katWj8HWdiHo9Y6BJsh7SGovNdkja+lNB93rrrf39iFBEJw0cyNF1iqj2oASLaPpga77Gjs+kQVzKjUlAtrt/2q136rB1fQ+7OgI9cCIxG5aNISaWbKNYx4zQk4QqeCaF3FEtORH1yL1lV1TwWlXl6qrZidVum1yBjQ+jJ6PXjb4weQWtJT1uOS/0Sw15t117ttddQ0LkmeP0f1taP8WNFie+suHTx55nd5Ofmm4YzetIsnooErQ/uXzeSatTiUeLqorTonBiIlRSnrF1DFrl6vP+pO8v9A7wwQePHimP7fFDhRXQBix8rvlC3pot6GMINkIdUiexNyLsDQk9Anv0CsNJrOmdbZ0CvcJ6L2VMr1jy9wxlDPH2kbhiBR26kfZ+jzFuqGuML0hOc912dPWvrz9g1m5rK7DxYXQLOIO7qWTCrZIv5osgpr7ioDj0BX3GNC7kusx5twNuHIPby2DeTkJnJR+flxNbX/9oxX6OS19yhf8gxZ3Un8POV933IqSKWGKs6CEpFBGSQhGhuoVCurvtH0GtfeueoY4jk0IoAjS5cXh62JMtL9ARY0QmjE4dbAR2w7IR2I0q78lJout7dd0g47ev2vcUve2D3zH4I4Hdem8fyDhsJJoedAMsj59Vda6e8NlWq6sb6rKquqHePiqvqr+m//rf+7VHdWV2+6kVcGKhIrrLu9tW6+SLjVfR4eqYZ9wqrYau6b5NnZpHN5UYtdZ9K8NFz3t8kGeO4eSjcnTz1tvFyQs4EfnPf6WtJ1FNraHoB747PtZZclG5xzE85oXQnT59eswgWWW5fnG1tWCkamAOBSy14w8//NFaWbwU8Sxl1r/LIkgRkgyxjdly4AnsbiGHRoQUXSIisFUZgdYl2OG3z8BG0snERL+IXjUJ9bItZdvGIH4clzFrthv0d9Ia0O0xbkWH3PWDnYTV8XwqYXlADNzDN/rXph+wareNVyAvvNPTrdaqm0oiRfmresdjbyuXKGuvf15t11JlXeS8V89nPgbnvupb0msSuiNu+7A/60OK4yeP39vm5+HxLozOJ8HHw3cjmBozjLAQiggb5ixVXXU7fvzhj7aZZO21sv/gg+8/Uhccu1PEFEKRdrhrfpJNGOhps2x0DNUrMr5L2cmoa4nDbPRDErFMAkq/5b5XWJ/7e3U9sG+OQSfB9AM6uKNSSnblRMXUp+0G/XmehS0rqMbE9gZ6rbg+o/7GZ48f/Llf3d0Orrw+Nql+zVLdnPtRBK/vO6tjTSWb1Zhn6X6uxjzWqr3+mv7/5bbnPTV/j0Fl+Q5FyuGUfxtb4bnYlslqm+EnYztbXd6ePD25XSQqLfb8FLg3tYtnWdZTzB3ag6tIVjkYuw9++v0HpXRD8gssK4jF860IfAMyMYnpz/Xms82wbiYRBSC5ybCcqD7bInXHAGQNmNvRg76pD8krqJgCuaFDNqruZDWAuM6YJ7HBju7E1fWvHX7v3V8ezp/T37VzrcB5H0b7uYtcMYxHpcLIZDO2XVDekPjuXXC4Z3Y773mfNZCTls+f22uu+XJ4VuwG37H7eowN/mszc9XWsX0Sp33/jvydl9BhRPgd/zg54hD7IYkqtv3toTrH9sHf+j+PS3/jdnS6G1088DEruuNQ+DnXcdf1lQNbk7vuuEOvvj79kXpH/N5x1+8d8253bH/XIdOv6YFsf4c9iMsYM+jHvpR7xtg7jr0bCM6gMQAAAK5JREFUx11f0Td57zWOYdtrx11X2b6+f63aibNMYkJ/7djc9TcOu73PHPY3PnP7z/+7X9n0kfM5Vu6MEB4o877zYAlnhF/ExVvJXwL/xRjPHOcK5+UHyYV3+ZVzXP9m9+oxpStbc89h6fg+lnS89gDb9lU8c7GmA5woznXe093nVl/zHsvJh3Pws0Hf4h4jL6pGkjsd/Njo0MekovKf/3rHfbGf2YpvmVfP+ZL63wMAAP//B8oHugAAAAZJREFUAwBF7z+ECh05+QAAAABJRU5ErkJggg==" x="0" y="0" width="150" height="150"/>
                  </svg>
            </div>
            <div style="flex-grow: 1; text-align: center; color: #9ca3af; margin: 0 20px; border-top: 1px solid #e5e7eb; padding-top: 5px;">
              © 2025 No Filter Finance. All rights reserved. This content does not constitute investment advice. Any action taken based on this content is at the sole responsibility of the user.
            </div>
            <div style="color: #6b7280; font-size: 12px; width: 120px;">
              <span class="pageNumber"></span>
            </div>
          </div>
        `,
      });

      this.logger.log(`PDF saved to: ${pdfFilePath}`);
    } catch (error) {
      this.logger.error(`HTML to PDF conversion failed: ${error.message}`);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
        this.logger.log('Browser closed');
      }
    }
  }
}
