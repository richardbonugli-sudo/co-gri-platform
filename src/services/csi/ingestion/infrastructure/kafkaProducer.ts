/**
 * Kafka Producer for CSI Event Streaming
 * 
 * Handles sending events to Kafka topics for downstream processing
 * Provides retry logic, error handling, and monitoring
 * 
 * @module ingestion/infrastructure/kafkaProducer
 */

export interface KafkaConfig {
  brokers: string[];
  clientId: string;
  connectionTimeout?: number;
  requestTimeout?: number;
  retry?: {
    maxRetries: number;
    initialRetryTime: number;
    retries: number;
  };
}

export interface ProducerMessage {
  topic: string;
  key?: string;
  value: string | Buffer;
  headers?: Record<string, string>;
  partition?: number;
  timestamp?: string;
}

export interface ProducerStats {
  messagesSent: number;
  messagesFailedretries: number;
  bytesSent: number;
  errors: number;
  lastSentAt?: Date;
}

/**
 * Kafka Producer Wrapper
 * 
 * Note: This is a mock implementation for development.
 * In production, use actual Kafka client (kafkajs, node-rdkafka, etc.)
 */
export class KafkaProducer {
  private config: KafkaConfig;
  private connected: boolean = false;
  private stats: ProducerStats;
  private messageQueue: ProducerMessage[] = [];

  constructor(config: KafkaConfig) {
    this.config = {
      connectionTimeout: 30000,
      requestTimeout: 30000,
      retry: {
        maxRetries: 5,
        initialRetryTime: 300,
        retries: 5
      },
      ...config
    };

    this.stats = {
      messagesSent: 0,
      messagesFailedretries: 0,
      bytesSent: 0,
      errors: 0
    };
  }

  /**
   * Connect to Kafka brokers
   */
  async connect(): Promise<void> {
    try {
      console.log(`Connecting to Kafka brokers: ${this.config.brokers.join(', ')}`);
      
      // Mock connection for development
      // In production: await this.producer.connect();
      
      this.connected = true;
      console.log('Kafka producer connected successfully');
      
    } catch (error) {
      console.error('Failed to connect to Kafka:', error);
      throw error;
    }
  }

  /**
   * Disconnect from Kafka
   */
  async disconnect(): Promise<void> {
    try {
      console.log('Disconnecting from Kafka');
      
      // Flush any pending messages
      if (this.messageQueue.length > 0) {
        console.log(`Flushing ${this.messageQueue.length} pending messages`);
        await this.flush();
      }
      
      // Mock disconnection
      // In production: await this.producer.disconnect();
      
      this.connected = false;
      console.log('Kafka producer disconnected');
      
    } catch (error) {
      console.error('Error disconnecting from Kafka:', error);
      throw error;
    }
  }

  /**
   * Send a single message to Kafka
   */
  async send(message: ProducerMessage): Promise<void> {
    if (!this.connected) {
      throw new Error('Kafka producer not connected');
    }

    try {
      // Add metadata
      const enrichedMessage = {
        ...message,
        timestamp: message.timestamp || new Date().toISOString(),
        headers: {
          ...message.headers,
          'producer-id': this.config.clientId,
          'sent-at': new Date().toISOString()
        }
      };

      // Mock send for development
      // In production: await this.producer.send({ topic, messages: [enrichedMessage] });
      
      console.log(`Sent message to topic ${message.topic}`);
      
      // Update stats
      this.stats.messagesSent++;
      this.stats.bytesSent += Buffer.byteLength(message.value);
      this.stats.lastSentAt = new Date();
      
    } catch (error) {
      console.error(`Failed to send message to ${message.topic}:`, error);
      this.stats.errors++;
      throw error;
    }
  }

  /**
   * Send multiple messages in batch
   */
  async sendBatch(messages: ProducerMessage[]): Promise<void> {
    if (!this.connected) {
      throw new Error('Kafka producer not connected');
    }

    if (messages.length === 0) {
      return;
    }

    try {
      console.log(`Sending batch of ${messages.length} messages`);
      
      // Group messages by topic
      const messagesByTopic = new Map<string, ProducerMessage[]>();
      for (const message of messages) {
        const topicMessages = messagesByTopic.get(message.topic) || [];
        topicMessages.push(message);
        messagesByTopic.set(message.topic, topicMessages);
      }

      // Send to each topic
      for (const [topic, topicMessages] of messagesByTopic) {
        for (const message of topicMessages) {
          await this.send(message);
        }
      }
      
      console.log(`Batch send complete: ${messages.length} messages`);
      
    } catch (error) {
      console.error('Failed to send batch:', error);
      this.stats.errors++;
      throw error;
    }
  }

  /**
   * Queue message for later sending
   */
  queue(message: ProducerMessage): void {
    this.messageQueue.push(message);
  }

  /**
   * Flush queued messages
   */
  async flush(): Promise<void> {
    if (this.messageQueue.length === 0) {
      return;
    }

    const messages = [...this.messageQueue];
    this.messageQueue = [];

    try {
      await this.sendBatch(messages);
    } catch (error) {
      // Re-queue failed messages
      this.messageQueue.unshift(...messages);
      throw error;
    }
  }

  /**
   * Get producer statistics
   */
  getStats(): ProducerStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      messagesSent: 0,
      messagesFailedretries: 0,
      bytesSent: 0,
      errors: 0
    };
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }
}

/**
 * Create default Kafka producer instance
 */
export function createKafkaProducer(config?: Partial<KafkaConfig>): KafkaProducer {
  const defaultConfig: KafkaConfig = {
    brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
    clientId: process.env.KAFKA_CLIENT_ID || 'csi-ingestion-producer',
    ...config
  };

  return new KafkaProducer(defaultConfig);
}

// Export singleton instance
let producerInstance: KafkaProducer | null = null;

export function getKafkaProducer(): KafkaProducer {
  if (!producerInstance) {
    producerInstance = createKafkaProducer();
  }
  return producerInstance;
}