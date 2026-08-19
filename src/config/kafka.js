const { Kafka, Partitioners } = require("kafkajs");

const brokers = (process.env.KAFKA_BROKER || "localhost:9092")
    .split(",")
    .map(b => b.trim())
    .filter(Boolean);

const useSSL = process.env.KAFKA_SSL === "true" ||
    brokers.some(b => b.includes("upstash.io") || b.includes("confluent.cloud") || b.includes("aivencloud.com"));

const kafkaConfig = {
    clientId: "distributed-wallet",
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

const producer = kafka.producer({
    createPartitioner: Partitioners.LegacyPartitioner
});

let connected = false;

const connectKafka = async () => {
    if (connected) {
        return;
    }

    await producer.connect();

    connected = true;

    console.log("Kafka producer connected");
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