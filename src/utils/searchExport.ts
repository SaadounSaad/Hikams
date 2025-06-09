
// 2. Export des résultats de recherche
// ===========================================

// src/utils/searchExport.ts
import { Quote } from '../types';

export interface ExportOptions {
  format: 'json' | 'csv' | 'txt' | 'pdf';
  includeMetadata: boolean;
  groupByCategory: boolean;
}

export class SearchExporter {
  static async exportResults(
    results: Quote[], 
    searchQuery: string, 
    options: ExportOptions
  ): Promise<void> {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `hikams-search-${searchQuery.replace(/\s+/g, '-')}-${timestamp}`;
    
    switch (options.format) {
      case 'json':
        this.exportAsJSON(results, filename, options);
        break;
      case 'csv':
        this.exportAsCSV(results, filename, options);
        break;
      case 'txt':
        this.exportAsText(results, filename, options);
        break;
      case 'pdf':
        await this.exportAsPDF(results, searchQuery, filename, options);
        break;
    }
  }

  private static exportAsJSON(results: Quote[], filename: string, options: ExportOptions) {
    const data = {
      exportDate: new Date().toISOString(),
      totalResults: results.length,
      results: options.includeMetadata 
        ? results 
        : results.map(({ text, author, category }) => ({ text, author, category }))
    };

    this.downloadFile(
      JSON.stringify(data, null, 2),
      `${filename}.json`,
      'application/json'
    );
  }

  private static exportAsCSV(results: Quote[], filename: string, options: ExportOptions) {
    const headers = ['النص', 'المؤلف', 'الفئة'];
    if (options.includeMetadata) {
      headers.push('المعرف', 'مفضلة');
    }

    const rows = results.map(quote => {
      const row = [
        `"${quote.text.replace(/"/g, '""')}"`,
        `"${quote.author || 'غير معروف'}"`,
        `"${quote.category}"`
      ];
      
      if (options.includeMetadata) {
        row.push(quote.id, quote.isFavorite ? 'نعم' : 'لا');
      }
      
      return row.join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    this.downloadFile(csv, `${filename}.csv`, 'text/csv');
  }

  private static exportAsText(results: Quote[], filename: string, options: ExportOptions) {
    let content = `نتائج البحث - ${new Date().toLocaleDateString('ar-SA')}\n`;
    content += `عدد النتائج: ${results.length}\n`;
    content += '='.repeat(50) + '\n\n';

    if (options.groupByCategory) {
      const grouped = results.reduce((groups, quote) => {
        const category = quote.category || 'غير مصنف';
        if (!groups[category]) groups[category] = [];
        groups[category].push(quote);
        return groups;
      }, {} as Record<string, Quote[]>);

      Object.entries(grouped).forEach(([category, quotes]) => {
        content += `\n${category}\n`;
        content += '-'.repeat(category.length) + '\n\n';
        
        quotes.forEach((quote, index) => {
          content += `${index + 1}. ${quote.text}\n`;
          if (quote.author) content += `   — ${quote.author}\n`;
          content += '\n';
        });
      });
    } else {
      results.forEach((quote, index) => {
        content += `${index + 1}. ${quote.text}\n`;
        if (quote.author) content += `   — ${quote.author}\n`;
        if (options.includeMetadata) {
          content += `   الفئة: ${quote.category}\n`;
          if (quote.isFavorite) content += `   ⭐ مفضلة\n`;
        }
        content += '\n';
      });
    }

    this.downloadFile(content, `${filename}.txt`, 'text/plain');
  }

  private static async exportAsPDF(
    results: Quote[], 
    searchQuery: string, 
    filename: string, 
    options: ExportOptions
  ) {
    // Nécessite une bibliothèque PDF comme jsPDF
    // Cette implémentation est un exemple basique
    try {
      const { jsPDF } = await import('jspdf');
      
      const doc = new jsPDF();
      
      // Configuration pour l'arabe (nécessite une police arabe)
      doc.setFont('Arial');
      doc.setFontSize(16);
      
      // Titre
      doc.text(`نتائج البحث: ${searchQuery}`, 20, 20);
      doc.setFontSize(12);
      doc.text(`التاريخ: ${new Date().toLocaleDateString('ar-SA')}`, 20, 30);
      doc.text(`عدد النتائج: ${results.length}`, 20, 40);
      
      let yPosition = 60;
      
      results.forEach((quote, index) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(10);
        doc.text(`${index + 1}.`, 20, yPosition);
        
        // Diviser le texte long
        const lines = doc.splitTextToSize(quote.text, 160);
        doc.text(lines, 30, yPosition);
        yPosition += lines.length * 5;
        
        if (quote.author) {
          doc.setFontSize(8);
          doc.text(`— ${quote.author}`, 30, yPosition);
          yPosition += 5;
        }
        
        yPosition += 10;
      });
      
      doc.save(`${filename}.pdf`);
    } catch (error) {
      console.error('Erreur export PDF:', error);
      // Fallback vers export texte
      this.exportAsText(results, filename, options);
    }
  }

  private static downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
}
