const WALLET_URL = "http://localhost:5000/api/transfers";

// ================================
// CHANGE THESE TWO VALUES
// ================================

const TestUser_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhNDc3OGE4Ny1hZjQxLTRmNWYtOTViYi0wOTQwZTdmOGM3MWMiLCJlbWFpbCI6InRlc3R1c2VyQGV4YW1wbGUuY29tIiwiaWF0IjoxNzg2NjMwODEyLCJleHAiOjE3ODY2MzQ0MTJ9.aSU0Dehz4n9WqRjx6KiYJ4Wtvh13lu49NlHqOseqZoc";

const RAHUL_WALLET_ID = "6e673568-5ca7-454b-a97f-7005ba4b68d1";

// ================================
// TEST CONFIGURATION
// ================================

const NUMBER_OF_REQUESTS = 10;
const AMOUNT_PER_REQUEST = 2000;

const sendTransfer = async (index) => {
    const idempotencyKey = `concurrency-test-${Date.now()}-${index}`;

    try {
        const response = await fetch(WALLET_URL, {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${YASH_JWT}`,
                "Idempotency-Key": idempotencyKey
            },

            body: JSON.stringify({
                receiverWalletId: RAHUL_WALLET_ID,
                amount: AMOUNT_PER_REQUEST
            })
        });

        const data = await response.json();

        return {
            request: index,
            status: response.status,
            message: data.message
        };

    } catch (error) {
        return {
            request: index,
            status: "ERROR",
            message: error.message
        };
    }
};


// ================================
// RUN CONCURRENT REQUESTS
// ================================

const runTest = async () => {

    console.log("=================================");
    console.log("CONCURRENCY TEST STARTED");
    console.log("=================================");

    console.log(`Requests: ${NUMBER_OF_REQUESTS}`);
    console.log(`Amount/request: ₹${AMOUNT_PER_REQUEST}`);
    console.log(
        `Total requested: ₹${NUMBER_OF_REQUESTS * AMOUNT_PER_REQUEST}`
    );

    console.log("---------------------------------");

    const requests = [];

    for (let i = 1; i <= NUMBER_OF_REQUESTS; i++) {
        requests.push(sendTransfer(i));
    }

    const results = await Promise.all(requests);

    console.log("\nRESULTS");
    console.log("---------------------------------");

    results.forEach(result => {
        console.log(
            `Request ${result.request}: ${result.status} - ${result.message}`
        );
    });

    const successful = results.filter(
        result => result.status === 200
    );

    const failed = results.filter(
        result => result.status !== 200
    );

    console.log("\n=================================");
    console.log("SUMMARY");
    console.log("=================================");

    console.log(`Successful transfers: ${successful.length}`);
    console.log(`Failed transfers: ${failed.length}`);

    console.log(
        `Money transferred: ₹${successful.length * AMOUNT_PER_REQUEST}`
    );

    console.log("=================================");
};

runTest();