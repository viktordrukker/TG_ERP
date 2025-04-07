import amqp from 'amqplib';
import logger from '../utils/logger';

// Connection variables
let connection: amqp.Connection | null = null;
let channel: amqp.Channel | null = null;

// Configuration from environment variables
const RABBITMQ_URI = process.env.RABBITMQ_URI || 'amqp://localhost:5672';
const EXCHANGE_NAME = process.env.RABBITMQ_EXCHANGE || 'tg_erp_events';
const QUEUE_NAME = process.env.RABBITMQ_QUEUE || 'auth_service_queue';

/**
 * Setup the message broker connection and channel
 */
export async function setupMessageBroker(): Promise<void> {
  try {
    // Connect to RabbitMQ
    connection = await amqp.connect(RABBITMQ_URI);
    
    // Create a channel
    channel = await connection.createChannel();
    
    // Assert the exchange
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    
    // Assert the queue
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    
    // Bind the queue to specific routing keys
    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, 'user.#');
    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, 'auth.#');
    
    // Set up consumer
    await channel.consume(QUEUE_NAME, handleMessage, { noAck: false });
    
    // Setup connection error handling
    connection.on('error', (err) => {
      logger.error('RabbitMQ connection error', { error: err });
      setTimeout(setupMessageBroker, 5000); // Try to reconnect after 5 seconds
    });
    
    logger.info('Connected to RabbitMQ successfully');
  } catch (error) {
    logger.error('Failed to connect to RabbitMQ', { error });
    setTimeout(setupMessageBroker, 5000); // Try to reconnect after 5 seconds
  }
}

/**
 * Handle incoming messages
 */
async function handleMessage(msg: amqp.ConsumeMessage | null): Promise<void> {
  if (!msg) return;
  
  try {
    const content = JSON.parse(msg.content.toString());
    const routingKey = msg.fields.routingKey;
    
    logger.debug('Received message', { routingKey, content });
    
    // Process message based on routing key
    switch (routingKey) {
      case 'user.created':
        // Handle user created event
        break;
        
      case 'user.updated':
        // Handle user updated event
        break;
        
      case 'auth.login':
        // Handle login event
        break;
        
      default:
        logger.warn('Unhandled routing key', { routingKey });
    }
    
    // Acknowledge the message
    channel?.ack(msg);
  } catch (error) {
    logger.error('Error processing message', { error, msg });
    // Negative acknowledge, requeue the message
    channel?.nack(msg, false, true);
  }
}

/**
 * Publish a message to the exchange
 */
export async function publishMessage(routingKey: string, message: any): Promise<boolean> {
  if (!channel) {
    logger.error('Cannot publish message, no channel available');
    return false;
  }
  
  try {
    const success = channel.publish(
      EXCHANGE_NAME,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
    
    if (success) {
      logger.debug('Message published successfully', { routingKey });
    } else {
      logger.warn('Failed to publish message', { routingKey });
    }
    
    return success;
  } catch (error) {
    logger.error('Error publishing message', { error, routingKey });
    return false;
  }
}

/**
 * Close the message broker connection
 */
export async function closeMessageBroker(): Promise<void> {
  try {
    if (channel) {
      await channel.close();
    }
    if (connection) {
      await connection.close();
    }
    logger.info('Closed RabbitMQ connection');
  } catch (error) {
    logger.error('Error closing RabbitMQ connection', { error });
  }
}
