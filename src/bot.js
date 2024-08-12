// -----------------
// Global variables
// -----------------

// codebeat:disable[LOC,ABC,BLOCK_NESTING]
require("dotenv").config();

const { Client, GatewayIntentBits, Partials } = require("discord.js");

const client = new Client({
   intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.DirectMessages
   ],
   partials: [
      Partials.Channel,
      Partials.Message
   ]}
);
const auth = require("./core/auth");

// ---------------
// Event Listener
// ---------------

const events = require("./events");

events.listen(client);

// ---------------
// Initialize Bot
// ---------------
login(auth.token);

function login(token)
{
   client.login(token).catch(err =>
   {
      console.log(err);
      console.log(`retrying login...`);
      setTimeout(login, 5000);
   });
}
