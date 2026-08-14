const { Kafka } = require("kafkajs");

const kafka = new Kafka({
    clientId: "transaction-worker",
    brokers: [
        process.env.KAFKA_BROKER || "localhost:9092"
    ]
});

const consumer = kafka.consumer({
    groupId: "wallet-transaction-workers"
});

const startWorker = async () => {
    await consumer.connect();

    console.log("Transaction worker connected to Kafka");

    await consumer.subscribe({
        topic: "wallet.transactions",
        fromBeginning: false
    });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {

            try {
                const event = JSON.parse(
                    message.value.toString()
                );

                console.log("\n========== KAFKA EVENT ==========");
                console.log("Topic:", topic);
                console.log("Partition:", partition);
                console.log("Event:", event.event);
                console.log("Transaction:", event.transactionId);
                console.log("Reference:", event.referenceId);
                console.log("Amount:", event.amount);
                console.log("=================================\n");

            } catch (error) {
                console.error(
                    "Failed to process Kafka event:",
                    error.message
                );
            }
        }
    });
};

startWorker().catch((error) => {
    console.error(
        "Transaction worker failed:",
        error
    );
});