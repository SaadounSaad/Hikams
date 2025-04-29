import { Quote } from '../types';
import { storage } from './storage';
import * as XLSX from 'xlsx';

export const parseExcelFile = async (file: File): Promise<Quote[]> => {
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });

    if (rows.length === 0) {
      throw new Error('Le fichier Excel est vide. Veuillez ajouter des citations avec les colonnes : Date, Citation, Catégorie, Source');
    }

    const quotes: Quote[] = [];
    const errors: string[] = [];
    let hasValidQuote = false;

    // Ignorer la première ligne si elle contient des en-têtes
    const startIndex = rows[0].some(cell => 
      ['date', 'citation', 'categorie', 'source', 'theme', 'ordre'].includes(cell?.toLowerCase?.() || '')) ? 1 : 0;

    for (let i = startIndex; i < rows.length; i++) {
      try {
        const row = rows[i];
        if (!row || !row.length) continue;

        const [day, text, category = 'thoughts', source = ''] = row;

        if (!day || !text) {
          errors.push(`Ligne ${i + 1}: La date et la citation sont obligatoires`);
          continue;
        }

        // Convertir la date Excel en date JS
        let date: Date;
        if (typeof day === 'number') {
          // Si c'est un numéro de série Excel
          date = new Date(Math.round((day - 25569) * 86400 * 1000));
        } else {
          // Si c'est une chaîne de caractères
          const parts = day.split('/').map(Number);
          date = new Date(parts[2], parts[1] - 1, parts[0]);
        }

        if (isNaN(date.getTime())) {
          errors.push(`Ligne ${i + 1}: Format de date invalide. Utilisez JJ/MM/AAAA`);
          continue;
        }

        // Validation du texte
        if (!text || text.length < 2) {
          errors.push(`Ligne ${i + 1}: Le texte de la citation est trop court ou manquant`);
          continue;
        }

        const normalizedCategory = (category || 'thoughts').toLowerCase();

        quotes.push({
          id: crypto.randomUUID(),
          text,
          category: normalizedCategory,
          source: source || '',
          isFavorite: false,
          createdAt: new Date().toISOString(),
          scheduledDate: date.toISOString(),
        });

        hasValidQuote = true;
      } catch (rowError) {
        errors.push(`Ligne ${i + 1}: ${rowError instanceof Error ? rowError.message : 'Format invalide'}`);
      }
    }

    if (!hasValidQuote) {
      throw new Error(`Impossible d'importer les citations:\n\n${errors.join('\n')}\n\nFormat attendu: Date | Citation | Catégorie | Source`);
    }

    if (errors.length > 0) {
      console.warn('Certaines lignes n\'ont pas pu être importées:', errors);
    }

    return quotes;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la lecture du fichier Excel';
    console.error('Erreur lors du parsing du fichier Excel:', message);
    throw new Error(message);
  }
};

export const parseTextFile = async (file: File): Promise<Quote[]> => {
  try {
    const text = await file.text();
    
    if (!text.trim()) {
      throw new Error('Le fichier est vide. Veuillez ajouter des citations au format JJ/MM/AAAA/Citation/Catégorie/Source');
    }
    
    const lines = text.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
    
    if (lines.length === 0) {
      throw new Error('Le fichier ne contient aucune citation valide. Format attendu : JJ/MM/AAAA/Citation/Catégorie/Source');
    }
    
    const quotes: Quote[] = [];
    const errors: string[] = [];
    let hasValidQuote = false;
    
    for (const [index, line] of lines.entries()) {
      try {
        const parts = line.split('/').map(s => s.trim());
        if (parts.length < 2) {
          errors.push(`Ligne ${index + 1}: Format invalide. Attendu: JJ/MM/AAAA/Citation/Catégorie/Source`);
          continue;
        }

        const [day, text, category = 'thoughts', source = ''] = parts;
        
        if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(day)) {
          errors.push(`Ligne ${index + 1}: Format de date invalide. Utilisez JJ/MM/AAAA`);
          continue;
        }

        const [dd, mm, yyyy] = day.split('/').map(Number);
        const date = new Date(yyyy, mm - 1, dd);
        
        if (isNaN(date.getTime()) || 
            date.getDate() !== dd || 
            date.getMonth() !== mm - 1 || 
            date.getFullYear() !== yyyy ||
            yyyy < 2000 || yyyy > 2100) {
          errors.push(`Ligne ${index + 1}: Date invalide (${day}). Assurez-vous que la date existe.`);
          continue;
        }
        
        if (!text || text.length < 2) {
          errors.push(`Ligne ${index + 1}: Le texte de la citation est trop court ou manquant`);
          continue;
        }
        
        const normalizedCategory = category.toLowerCase();
        
        quotes.push({
          id: crypto.randomUUID(),
          text,
          category: normalizedCategory,
          source,
          isFavorite: false,
          createdAt: new Date().toISOString(),
          scheduledDate: date.toISOString(),
        });
        
        hasValidQuote = true;
      } catch (lineError) {
        errors.push(`Ligne ${index + 1}: ${lineError instanceof Error ? lineError.message : 'Format invalide'}`);
      }
    }
    
    if (!hasValidQuote) {
      throw new Error(`Impossible d'importer les citations:\n\n${errors.join('\n')}\n\nFormat attendu: JJ/MM/AAAA/Citation/Catégorie/Source`);
    }
    
    if (errors.length > 0) {
      console.warn('Certaines lignes n\'ont pas pu être importées:', errors);
    }
    
    return quotes;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la lecture du fichier';
    console.error('Erreur lors du parsing du fichier:', message);
    throw new Error(message);
  }
};