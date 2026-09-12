require("dotenv").config();

process.env.KAFKAJS_NO_PARTITIONER_WARNING = "1";

const { Kafka, Partitioners } = require("kafkajs");

const createKafkaConfig = (clientId = "distributed-wallet") => {
    const brokers = (process.env.KAFKA_BROKER || process.env.KAFKA_BROKERS || "")
        .split(",")
        .map(b => b.trim())
        .filter(Boolean);

    const username = process.env.KAFKA_SASL_USERNAME || process.env.KAFKA_USERNAME;
    const password = process.env.KAFKA_SASL_PASSWORD || process.env.KAFKA_PASSWORD;
    const mechanism = (process.env.KAFKA_SASL_MECHANISM || "scram-sha-256").toLowerCase();

    const kafkaConfig = {
        clientId,
        brokers,
        ssl: true,
        sasl: {
            mechanism,
            username,
            password
        },
        connectionTimeout: 10000,
        requestTimeout: 25000,
        retry: {
            initialRetryTime: 500,
            retries: 15
        }
    };

    return kafkaConfig;
};

const kafka = new Kafka(createKafkaConfig("distributed-wallet"));

const producer = kafka.producer({
    createPartitioner: Partitioners.LegacyPartitioner
});

let connected = false;

const connectKafka = async (maxRetries = 10, delayMs = 2000) => {
    if (connected) {
        return;
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await producer.connect();

            connected = true;

            console.log("Kafka producer connected");

            return;
        } catch (error) {
            console.warn(
                `Kafka connection attempt ${attempt}/${maxRetries} failed: ${error.message}`
            );

            if (attempt === maxRetries) {
                throw error;
            }

            await new Promise(res => setTimeout(res, delayMs));
        }
    }
};

const publishEvent = async (topic, event) => {
    await connectKafka();

    await producer.send({
        topic,
        messages: [
            {
                key: event.transactionId || undefined,
                value: JSON.stringify(event)
            }
        ]
    });
};

let lastKafkaCheck = 0;
let lastKafkaStatus = "down";
const KAFKA_CHECK_CACHE_MS = 5000;

const checkKafkaHealth = async () => {
    const now = Date.now();

    if (now - lastKafkaCheck < KAFKA_CHECK_CACHE_MS) {
        return lastKafkaStatus;
    }

    const admin = kafka.admin();

    try {
        await Promise.race([
            admin.connect(),
            new Promise((_, reject) =>
                setTimeout(
                    () => reject(new Error("Kafka health check timeout")),
                    3000
                )
            )
        ]);

        lastKafkaStatus = "up";
    } catch (err) {
        lastKafkaStatus = "down";
    } finally {
        try {
            await admin.disconnect();
        } catch {}
        
        lastKafkaCheck = Date.now();
    }

    return lastKafkaStatus;
};

module.exports = {
    producer,
    connectKafka,
    publishEvent,
    createKafkaConfig,
    checkKafkaHealth
};