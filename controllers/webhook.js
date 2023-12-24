const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();
const app = express().use(bodyParser.json());

const token = process.env.TOKEN;
const myToken = process.env.MYTOKEN;
const whatsappApiUrl = process.env.WHATSAPP_API_URL; // Replace with your WhatsApp API base URL

app.listen(process.env.PORT, () => {
    console.log("Webhook is listening!!");
});

app.get("/whatsapp", (req, res) => {
    let mode = req.query["hub.mode"];
    let challenge = req.query["hub.challenge"];
    let token = req.query["hub.verify_token"];

    if (mode && token) {
        if (mode === "subscribe" && token === myToken) {
            res.status(200).send(challenge);
        } else {
            res.status(403);
        }
    }
});

app.post("/whatsapp", async (req, res) => {
    let body_param = req.body;
    console.log(JSON.stringify(body_param, null, 2));

    if (body_param.object) {
        console.log("inside body_param");
        if (body_param.entry &&
            body_param.entry[0].changes &&
            body_param.entry[0].changes[0].value.messages &&
            body_param.entry[0].changes[0].value.messages[0]
        ) {
            let phone_number_id = body_param.entry[0].changes[0].value.metadata.phone_number_id;
            let msg_body = body_param.entry[0].changes[0].value.messages[0].text.body;

            let responseMessage;

            // Implement your chatbot logic here
            if (msg_body.toLowerCase().includes("keyword")) {
                // Call the route to search schemes by keyword
                const keyword = 'your_keyword'; // Replace with the keyword from the user's message
                const schemesByKeyword = await axios.get(`${whatsappApiUrl}/schemes/${keyword}`);
                
                if (schemesByKeyword.data && schemesByKeyword.data.length > 0) {
                    responseMessage = 'Schemes found:\n';
                    schemesByKeyword.data.forEach((scheme) => {
                        responseMessage += `${scheme.schemeName}\n`; // Customize as per your scheme fields
                    });
                } else {
                    responseMessage = 'No schemes found for the keyword';
                }
            } else if (msg_body.toLowerCase().includes("id")) {
                // Call the route to get a scheme by ID
                const id = 'your_id'; // Replace with the ID from the user's message
                const schemeByID = await axios.get(`${whatsappApiUrl}/scheme/${id}`);

                if (schemeByID.data) {
                    responseMessage = `Scheme Details:\n${schemeByID.data.schemeName}`; // Customize as per your scheme fields
                } else {
                    responseMessage = 'No scheme found for the ID';
                }
            } else {
                responseMessage = 'Sorry, I did not understand your message';
            }

            const sendMessageBody = {
                "messaging_product": "whatsapp",
                "to": phone_number_id,
                "type": "text",
                "text": {
                    "body": responseMessage
                },
                "language": {
                    "code": "en_US"
                }
            };

            try {
                await axios.post(`${whatsappApiUrl}/send-message`, sendMessageBody, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                res.sendStatus(200);
            } catch (error) {
                console.error("Error sending message:", error);
                res.sendStatus(500);
            }
        } else {
            res.sendStatus(404);
        }
    }
});

app.get("/", (req, res) => {
    res.status(200).send("Webhook setup for scheme!!");
});
