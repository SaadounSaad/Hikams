// src/utils/quotesDB.ts
import { Quote } from '../types';

export interface DBMetadata {
  key: string;
  value: number;
  userId: string;
  count: number;
  version: string;
}

export class QuotesDB {
  private dbName = 'HikamsDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      console.log('🔧 Initialisation IndexedDB...');
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => {
        console.error('❌ Erreur ouverture IndexedDB:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB initialisée avec succès');
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        console.log('🔄 Mise à jour schéma IndexedDB...');
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('quotes')) {
          const quotesStore = db.createObjectStore('quotes', { keyPath: 'id' });
          quotesStore.createIndex('category', 'category', { unique: false });
          quotesStore.createIndex('createdAt', 'createdAt', { unique: false });
          console.log('📦 Store "quotes" créé');
        }
        
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
          console.log('📊 Store "metadata" créé');
        }
      };
    });
  }

  async storeQuotes(quotes: Quote[], userId: string): Promise<void> {
    await this.init();
    
    return new Promise((resolve, reject) => {
      console.log(`💾 Stockage de ${quotes.length} citations dans IndexedDB...`);
      
      const transaction = this.db!.transaction(['quotes', 'metadata'], 'readwrite');
      const quotesStore = transaction.objectStore('quotes');
      const metadataStore = transaction.objectStore('metadata');
      
      transaction.oncomplete = () => {
        console.log(`✅ ${quotes.length} citations stockées avec succès`);
        resolve();
      };
      
      transaction.onerror = () => {
        console.error('❌ Erreur stockage IndexedDB:', transaction.error);
        reject(transaction.error);
      };
      
      quotesStore.clear();
      
      quotes.forEach(quote => {
        quotesStore.put(quote); // ✅ Remplace ou ajoute
        });
      
      const metadata: DBMetadata = {
        key: 'lastSync',
        value: Date.now(),
        userId: userId,
        count: quotes.length,
        version: '1.0'
      };
      
      metadataStore.put(metadata);
    });
  }

  async getQuotes(): Promise<Quote[]> {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['quotes'], 'readonly');
      const store = transaction.objectStore('quotes');
      const request = store.getAll();
      
      request.onsuccess = () => {
        console.log(`📦 ${request.result.length} citations chargées depuis IndexedDB`);
        resolve(request.result as Quote[]);
      };
      
      request.onerror = () => {
        console.error('❌ Erreur lecture IndexedDB:', request.error);
        reject(request.error);
      };
    });
  }

  async getMetadata(): Promise<DBMetadata | null> {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['metadata'], 'readonly');
      const store = transaction.objectStore('metadata');
      const request = store.get('lastSync');
      
      request.onsuccess = () => {
        resolve(request.result as DBMetadata || null);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async needsSync(userId: string, syncIntervalHours: number = 24): Promise<boolean> {
    try {
      const metadata = await this.getMetadata();
      
      if (!metadata) {
        console.log('🔄 Première synchronisation nécessaire');
        return true;
      }
      
      if (metadata.userId !== userId) {
        console.log('👤 Changement d\'utilisateur détecté');
        return true;
      }
      
      const lastSync = metadata.value;
      const now = Date.now();
      const syncInterval = syncIntervalHours * 60 * 60 * 1000;
      const timeSinceSync = now - lastSync;
      
      const needsSync = timeSinceSync > syncInterval;
      
      if (needsSync) {
        const hoursSinceSync = Math.round(timeSinceSync / (60 * 60 * 1000));
        console.log(`⏰ Synchronisation nécessaire (dernière: il y a ${hoursSinceSync}h)`);
      } else {
        const hoursUntilSync = Math.round((syncInterval - timeSinceSync) / (60 * 60 * 1000));
        console.log(`✅ Données à jour (prochaine sync dans ${hoursUntilSync}h)`);
      }
      
      return needsSync;
    } catch (error) {
      console.error('❌ Erreur vérification sync:', error);
      return true;
    }
  }

  async clearAll(): Promise<void> {
    await this.init();
    
    return new Promise((resolve, reject) => {
      console.log('🗑️ Vidage complet IndexedDB...');
      
      const transaction = this.db!.transaction(['quotes', 'metadata'], 'readwrite');
      
      transaction.oncomplete = () => {
        console.log('✅ IndexedDB vidée avec succès');
        resolve();
      };
      
      transaction.onerror = () => {
        console.error('❌ Erreur vidage IndexedDB:', transaction.error);
        reject(transaction.error);
      };
      
      transaction.objectStore('quotes').clear();
      transaction.objectStore('metadata').clear();
    });
  }

  async forceSync(): Promise<void> {
    console.log('🔄 Synchronisation forcée...');
    await this.clearAll();
  }

  async getStats(): Promise<{
    totalQuotes: number;
    lastSync: Date | null;
    userId: string | null;
  }> {
    try {
      const quotes = await this.getQuotes();
      const metadata = await this.getMetadata();
      
      return {
        totalQuotes: quotes.length,
        lastSync: metadata ? new Date(metadata.value) : null,
        userId: metadata?.userId || null
      };
    } catch (error) {
      console.error('❌ Erreur stats:', error);
      return {
        totalQuotes: 0,
        lastSync: null,
        userId: null
      };
    }
  }

  static isSupported(): boolean {
    return 'indexedDB' in window;
  }
}

export const quotesDB = new QuotesDB();