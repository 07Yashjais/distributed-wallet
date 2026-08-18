const fs = require("fs");
const path = require("path");
const { Kafka, Partitioners } = require("kafkajs");

const brokers = (process.env.KAFKA_BROKER || "localhost:9092")
    .split(",")
    .map(b => b.trim())
    .filter(Boolean);

const useSSL = process.env.KAFKA_SSL === "true" ||
    brokers.some(b =>
        b.includes("upstash.io") ||
        b.includes("confluent.cloud") ||
        b.includes("aivencloud.com")
    );

const kafkaConfig = {
    clientId: "distributed-wallet",
    brokers,

    retry: {
        initialRetryTime: 500,
        retries: 15
    }
};

if (useSSL) {
    kafkaConfig.ssl = {
        ca: [
            fs.readFileSync(
                path.join(__dirname, "../../certs/ca.pem"),
                "utf-8"
            )
        ]
    };
}

if (
    process.env.KAFKA_SASL_USERNAME &&
    process.env.KAFKA_SASL_PASSWORD
) {
    kafkaConfig.sasl = {
        mechanism: (
            process.env.KAFKA_SASL_MECHANISM || "plain"
        ).toLowerCase(),

        username: process.env.KAFKA_SASL_USERNAME,
        password: process.env.KAFKA_SASL_PASSWORD
    };
}

const kafka = new Kafka(kafkaConfig);

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

module.exports = {
    producer,
    connectKafka,
    publishEvent
};