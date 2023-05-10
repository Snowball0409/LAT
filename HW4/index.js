"use strict";
const line = require("@line/bot-sdk"),
    express = require("express"),
    configGet = require("config");
const {
    TextAnalyticsClient,
    AzureKeyCredential,
} = require("@azure/ai-text-analytics");

const configLine = {
    channelAccessToken: configGet.get("CHANNEL_ACCESS_TOKEN"),
    channelSecret: configGet.get("CHANNEL_SECRET"),
};

const client = new line.Client(configLine);

//Azure service
const endpoint = configGet.get("ENDPOINT");
const apiKey = configGet.get("TEXT_ANALYTICS_API_kEY");

//Express app
const app = express();
const port = process.env.PORT || process.env.port || 3000;

app.listen(port, () => {
    console.log(`Listening on ${port}`);
});

app.post("/callback", line.middleware(configLine), (req, res) => {
    Promise.all(req.body.events.map(handleEvent))
        .then((result) => res.json(result))
        .catch((err) => {
            console.error(err);
            res.status(500).end();
        });
});

async function MS_TextSentimentAnalysis(thisEvent) {
    console.log("[MS_TextSentimentAnalysis] Get input");
    const analyticsClient = new TextAnalyticsClient(
        endpoint,
        new AzureKeyCredential(apiKey)
    );
    let documents = [];
    documents.push(thisEvent.message.text);
    const results = await analyticsClient.analyzeSentiment(documents);
    console.log("[results] ", JSON.stringify(results));

    //TC Output
    let resultMessage = "";
    if (results[0].sentiment == "neutral")
        resultMessage = { type: "text", text: "中立" };
    else if (results[0].sentiment == "positive")
        resultMessage = { type: "text", text: "正面" };
    else resultMessage = { type: "text", text: "負面" };
    client.replyMessage(thisEvent.replyToken, resultMessage);
}

function handleEvent(event) {
    if (event.type !== "message" || event.message.type !== "text") {
        returnPromise.resolve(null);
    }
    // const echo = { type: "text", text: event.message.text };
    // return client.replyMessage(event.replyToken, echo);
    MS_TextSentimentAnalysis(event).catch((err) => {
        console.error("Error:", err);
    });
}
