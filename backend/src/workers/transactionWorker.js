const { Kafka } = require("kafkajs");

const brokers = (process.env.KAFKA_BROKER || "localhost:9092")
    .split(",")
    .map(b => b.trim())
    .filter(Boolean);

const useSSL = process.env.KAFKA_SSL === "true" ||
    brokers.some(b => b.includes("upstash.io") || b.includes("confluent.cloud") || b.includes("aivencloud.com"));

const kafkaConfig = {
    clientId: "transaction-worker",
    brokers,
    retry: {
        initialRetryTime: 500,
        retries: 15
    }
};

if (useSSL) {
    kafkaConfig.ssl = true;
}

if (process.env.KAFKA_SASL_USERNAME && process.env.KAFKA_SASL_PASSWORD) {
    kafkaConfig.sasl = {
        mechanism: (process.env.KAFKA_SASL_MECHANISM || "scram-sha-256").toLowerCase(),
        username: process.env.KAFKA_SASL_USERNAME,
        password: process.env.KAFKA_SASL_PASSWORD
    };
}

const kafka = new Kafka(kafkaConfig);

const admin = kafka.admin();
const consumer = kafka.consumer({
    groupId: "wallet-transaction-workers"
});

const ensureTopicExists = async (topicName) => {
    try {
        await admin.connect();
        const topics = await admin.listTopics();
        if (!topics.includes(topicName)) {
            console.log(`Creating Kafka topic '${topicName}'...`);
            await admin.createTopics({
                topics: [{ topic: topicName, numPartitions: 3, replicationFactor: 1 }]
            });
            console.log(`Kafka topic '${topicName}' created successfully.`);
        }
    } catch (err) {
        console.warn(`Note on topic check '${topicName}':`, err.message);
    } finally {
        try { await admin.disconnect(); } catch {}
    }
};

const startWorker = async (maxRetries = 15, delayMs = 2000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await ensureTopicExists("wallet.transactions");
            await consumer.connect();
            console.log("Transaction worker connected to Kafka");

            await consumer.subscribe({
                topic: "wallet.transactions",
                fromBeginning: false
            });

            await consumer.run({
                eachMessage: async ({ topic, partition, message }) => {
                    try {
                        const event = JSON.parse(message.value.toString());
                        console.log("\n========== KAFKA EVENT ==========");
                        console.log("Topic:", topic);
                        console.log("Partition:", partition);
                        console.log("Event:", event.event);
                        console.log("Transaction:", event.transactionId);
                        console.log("Reference:", event.referenceId);
                        console.log("Amount:", event.amount);
                        console.log("=================================\n");
                    } catch (error) {
                        console.error("Failed to process Kafka event:", error.message);
                    }
                }
            });

            return; // Successfully running
        } catch (error) {
            console.warn(`Transaction worker startup attempt ${attempt}/${maxRetries} failed: ${error.message}`);
            if (attempt === maxRetries) {
                console.error("Transaction worker reached max retry attempts.");
                process.exit(1);
            }
            await new Promise(res => setTimeout(res, delayMs));
        }
    }
};

startWorker();