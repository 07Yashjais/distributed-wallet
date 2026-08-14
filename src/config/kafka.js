const { Kafka } = require("kafkajs");

const kafka = new Kafka({
    clientId: "distributed-wallet",
    brokers: [
        process.env.KAFKA_BROKER || "localhost:9092"
    ]
});

const producer = kafka.producer();

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