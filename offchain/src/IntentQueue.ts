import { SwapIntent } from './types';
import fs from 'fs';
import path from 'path';

export class IntentQueue {
  private queue: SwapIntent[] = [];
  private dataPath: string;

  constructor(dataPath: string = './data') {
    this.dataPath = dataPath;
    this.ensureDataDirectory();
    this.loadQueue();
  }

  private ensureDataDirectory(): void {
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true });
    }
  }

  private loadQueue(): void {
    const queueFile = path.join(this.dataPath, 'intent-queue.json');
    if (fs.existsSync(queueFile)) {
      try {
        const data = fs.readFileSync(queueFile, 'utf8');
        this.queue = JSON.parse(data);
        console.log(`Loaded ${this.queue.length} intents from queue`);
      } catch (error) {
        console.error('Error loading intent queue:', error);
        this.queue = [];
      }
    }
  }

  private saveQueue(): void {
    const queueFile = path.join(this.dataPath, 'intent-queue.json');
    try {
      fs.writeFileSync(queueFile, JSON.stringify(this.queue, null, 2));
    } catch (error) {
      console.error('Error saving intent queue:', error);
    }
  }

  public addIntent(intent: SwapIntent): void {
    this.queue.push(intent);
    this.saveQueue();
    console.log(`Added intent ${intent.id} to queue`);
  }

  public getPendingIntents(): SwapIntent[] {
    return this.queue.filter(intent => intent.status === 'pending');
  }

  public getIntentsByBatch(batchId: string): SwapIntent[] {
    return this.queue.filter(intent => intent.batchId === batchId);
  }

  public updateIntentStatus(intentId: string, status: SwapIntent['status'], batchId?: string): void {
    const intent = this.queue.find(i => i.id === intentId);
    if (intent) {
      intent.status = status;
      if (batchId) {
        intent.batchId = batchId;
      }
      this.saveQueue();
      console.log(`Updated intent ${intentId} status to ${status}`);
    }
  }

  public clearProcessedIntents(): void {
    this.queue = this.queue.filter(intent => intent.status === 'pending');
    this.saveQueue();
    console.log('Cleared processed intents from queue');
  }

  public getQueueStats(): { total: number; pending: number; processed: number } {
    const total = this.queue.length;
    const pending = this.queue.filter(i => i.status === 'pending').length;
    const processed = total - pending;
    
    return { total, pending, processed };
  }

  public getAllIntents(): SwapIntent[] {
    return [...this.queue];
  }
}
