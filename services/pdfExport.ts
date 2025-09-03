import { Alert, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { JournalEntry } from './database';

export class PDFExportService {
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  private generateHTMLContent(entries: JournalEntry[]): string {
    const entriesHTML = entries.map(entry => {
      const plainContent = this.stripHtml(entry.content);
      const formattedDate = this.formatDate(entry.created_at);
      
      return `
        <div class="journal-entry">
          <div class="entry-header">
            <h2 class="entry-title">${entry.title}</h2>
            <div class="entry-meta">
              <span class="entry-date">${formattedDate}</span>
              <span class="entry-mood">Mood: ${entry.mood}</span>
              <span class="entry-category">${entry.category}</span>
            </div>
          </div>
          <div class="entry-content">
            ${plainContent}
          </div>
        </div>
      `;
    }).join('\n');

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Manifestation Journal Export</title>
        <style>
          body {
            font-family: 'Georgia', serif;
            line-height: 1.6;
            color: #2c3e50;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          }
          .header {
            text-align: center;
            margin-bottom: 60px;
            border-bottom: 3px solid #e74c3c;
            padding-bottom: 30px;
          }
          .header h1 {
            font-size: 2.5em;
            color: #2c3e50;
            margin-bottom: 10px;
            font-weight: 300;
          }
          .header .subtitle {
            font-size: 1.2em;
            color: #7f8c8d;
            font-style: italic;
          }
          .journal-entry {
            margin-bottom: 50px;
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            border-left: 5px solid #e74c3c;
          }
          .entry-header {
            margin-bottom: 25px;
            border-bottom: 1px solid #ecf0f1;
            padding-bottom: 15px;
          }
          .entry-title {
            font-size: 1.8em;
            color: #2c3e50;
            margin-bottom: 10px;
            font-weight: 600;
          }
          .entry-meta {
            display: flex;
            gap: 20px;
            font-size: 0.9em;
            color: #7f8c8d;
          }
          .entry-meta span {
            background: #f8f9fa;
            padding: 5px 12px;
            border-radius: 15px;
            font-weight: 500;
          }
          .entry-content {
            font-size: 1.1em;
            line-height: 1.8;
            color: #34495e;
            white-space: pre-wrap;
          }
          .footer {
            text-align: center;
            margin-top: 60px;
            padding-top: 30px;
            border-top: 2px solid #ecf0f1;
            color: #7f8c8d;
            font-style: italic;
          }
          @media print {
            body { background: white; }
            .journal-entry { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>✨ Manifestation Journal</h1>
          <p class="subtitle">Scripting My Reality - Inspired by Neville Goddard</p>
          <p class="subtitle">Exported on ${new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
        </div>
        
        ${entriesHTML}
        
        <div class="footer">
          <p>"Assume the feeling of your wish fulfilled and observe the route that your attention follows."</p>
          <p>- Neville Goddard</p>
        </div>
      </body>
      </html>
    `;
  }

  async exportToPDF(entries: JournalEntry[], filename?: string): Promise<void> {
    try {
      if (entries.length === 0) {
        Alert.alert('No Entries', 'There are no journal entries to export.');
        return;
      }

      const htmlContent = this.generateHTMLContent(entries);
      const fileName = filename || `manifestation-journal-${new Date().toISOString().split('T')[0]}.html`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      // Write HTML file
      await FileSystem.writeAsStringAsync(fileUri, htmlContent);

      // Share the HTML file (which can be converted to PDF by the user)
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/html',
          dialogTitle: 'Export Journal as PDF',
        });
      } else {
        Alert.alert(
          'Export Complete',
          `Your journal has been exported to: ${fileUri}\n\nYou can print this file to PDF from your browser.`
        );
      }
    } catch (error) {
      console.error('PDF export failed:', error);
      Alert.alert('Export Failed', 'Unable to export your journal entries.');
    }
  }

  async exportEntryToPDF(entry: JournalEntry): Promise<void> {
    await this.exportToPDF([entry], `journal-entry-${entry.id}.html`);
  }

  async exportFilteredEntries(entries: JournalEntry[], category: string): Promise<void> {
    const filteredEntries = entries.filter(entry => 
      category === 'All' || entry.category === category
    );
    
    const fileName = category === 'All' 
      ? 'all-journal-entries.html'
      : `${category.toLowerCase()}-entries.html`;
    
    await this.exportToPDF(filteredEntries, fileName);
  }
}

export const pdfExportService = new PDFExportService();